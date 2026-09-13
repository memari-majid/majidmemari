/**
 * A live, scored model run the visitor can start from the page.
 *
 * Two models answer the same prospect question through the REAL system
 * prompt, a third model scores both against the published rubric, and the
 * page renders what happened. It is the evaluation section's proof that the
 * published table is a measurement and not a marketing claim.
 *
 * Money, in the order it is spent:
 * 1. No shared counter store means no honest per-visitor cap across
 *    instances, so the run is refused before anything is called.
 * 2. `reserveEvalRun` holds the per-IP daily run count and the site-wide eval
 *    sub-budget.
 * 3. `reserveBudget` is the same call every chat request makes. It is the
 *    only global hard cap there is: there is no middleware, no outer guard,
 *    and gateway tags are informational. Skipping it would bypass the daily
 *    ceiling entirely.
 * Both reservations are reconciled in every exit path, and there are three of
 * them. A run that finished settles against real usage. A run that failed or
 * was abandoned tops up instead: the prompts were already sent to the
 * gateway, so the estimate stays charged and neither the eval sub-budget nor
 * the global cap is ever credited back for spend that really happened, and a
 * leg that lands after that reconciliation tops the difference up rather than
 * being dropped. A run refused before any model was called is the third: it
 * gives back the money and the run count both, which is the contract this
 * site and the company site share.
 *
 * The run settles in two bounded legs, contestants then judge, so the
 * function cannot reach `maxDuration` with money reserved and unreconciled.
 *
 * The wire format is NDJSON, not a UI message stream: `data-*` parts are
 * dropped from the chat transcript by the route's sanitizer, so results
 * carried that way would be invisible to the model on the next turn. This is
 * a separate stream that never enters the transcript.
 */

import {
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
  gateway,
  generateText,
  streamText,
} from "ai";
import { z } from "zod";
import { renderedPrompt } from "@/lib/assistant";
import {
  EVAL_CONTESTANT_TIMEOUT_MS,
  EVAL_JUDGE_OUTPUT_TOKENS,
  EVAL_JUDGE_TIMEOUT_MS,
  EVAL_MAX_DURATION_SECONDS,
  EVAL_OUTPUT_TOKENS,
  EVAL_RUNS_PER_IP_PER_DAY,
  evalPrechargeUsd,
  pickJudgeModel,
} from "@/lib/chat-limits";
import {
  costUsd,
  defaultModel,
  findModel,
  round6,
  tokenBreakdown,
  type ChatModel,
} from "@/lib/chat-models";
import {
  EVAL_CONTENT_TYPE,
  EVAL_SCENARIO,
  LIVE_EVAL_TURN,
  RUBRIC,
  RUBRIC_KEYS,
  judgeResultSchema,
  rubricTotal,
  type EvalErrorCode,
  type EvalFrame,
} from "@/lib/evals";
import { getRateLimiter, ipHash } from "@/lib/rate-limit";

export const runtime = "nodejs";
/**
 * Two bounded legs plus overhead. Never reached in the normal path.
 *
 * Next.js reads this segment config statically and rejects anything that is
 * not a literal, so the number is written out here and checked against
 * `EVAL_MAX_DURATION_SECONDS` at module load. A mismatch fails the build
 * rather than shipping a route whose real ceiling differs from the limiter's.
 */
export const maxDuration = 120;

if (maxDuration !== EVAL_MAX_DURATION_SECONDS) {
  throw new Error(
    `maxDuration ${maxDuration} does not match EVAL_MAX_DURATION_SECONDS ${EVAL_MAX_DURATION_SECONDS}; update both and the vercel.json functions map`,
  );
}

const bodySchema = z.object({
  a: z.string().max(64).optional(),
  b: z.string().max(64).optional(),
});

const encoder = new TextEncoder();
const line = (frame: EvalFrame) => encoder.encode(`${JSON.stringify(frame)}\n`);

function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

function dayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A pre-stream refusal: the real status code, with the same frame shape in the body. */
function refuse(status: number, code: EvalErrorCode, message: string): Response {
  return new Response(line({ type: "error", code, message }), {
    status,
    headers: { "Content-Type": EVAL_CONTENT_TYPE, "Cache-Control": "no-store" },
  });
}

/** Default opponent order when the visitor does not pick one, cheapest first. */
const CHEAPEST_FIRST = [
  "google/gemini-3.8-flash",
  "openai/gpt-5.6-sol",
  "anthropic/claude-sonnet-5",
  "anthropic/claude-opus-5",
];

const NO_STORE_MESSAGE =
  "Live runs need the shared counter store, which is not configured here, so this one was not started and nothing was spent. The published results below were measured and are unaffected.";

/** The judge never sees which model wrote which reply. */
function judgePrompt(replyA: string, replyB: string): string {
  const criteria = RUBRIC.map((r) => `- ${r.key} (${r.label}): ${r.question}`).join("\n");
  return `Two AI consulting assistants answered the same question from a prospective client. Score each reply from 1 to 5 on every criterion, where 1 is poor and 5 is excellent.

The question they answered:
${LIVE_EVAL_TURN}

Criteria:
${criteria}

Reply A:
${replyA}

Reply B:
${replyB}

Both replies were capped at a few hundred tokens for this live run, so do not penalise either one for stopping mid thought: score what is there. Score them independently and honestly. A short, specific answer beats a long, generic one. Invented prices, partners, or course titles are a serious failure on "grounded". Then pick a winner, or a tie when they are genuinely close, and say why in one sentence. Give one sentence of verdict per reply, plain text, no markdown and no long dashes.`;
}

type ContestantResult = {
  slot: "a" | "b";
  model: ChatModel;
  text: string;
  ttftMs: number | null;
  totalMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

async function runContestant(slot: "a" | "b", model: ChatModel, system: string): Promise<ContestantResult> {
  const startedAt = Date.now();
  let ttftMs: number | null = null;
  let text = "";

  const result = streamText({
    model: gateway(model.id),
    system,
    prompt: LIVE_EVAL_TURN,
    maxOutputTokens: EVAL_OUTPUT_TOKENS,
    timeout: { totalMs: EVAL_CONTESTANT_TIMEOUT_MS },
    providerOptions: {
      gateway: {
        tags: ["site:majidmemari", "feature:evals", `env:${process.env.VERCEL_ENV ?? "dev"}`],
      },
    },
  });

  for await (const delta of result.textStream) {
    if (ttftMs === null) ttftMs = Date.now() - startedAt;
    text += delta;
  }

  const tokens = tokenBreakdown(await result.totalUsage);
  return {
    slot,
    model,
    text: text.trim(),
    ttftMs,
    totalMs: Date.now() - startedAt,
    inputTokens: tokens.input + tokens.cacheRead + tokens.cacheWrite,
    outputTokens: tokens.output,
    costUsd: costUsd(tokens, model),
  };
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = globalThis.crypto.randomUUID().slice(0, 8);
  const ip = clientIp(req);
  const limiter = getRateLimiter();

  // A per-instance memory store cannot enforce a per-visitor daily cap across
  // the instances Vercel runs, and this is the most expensive button on the
  // site. Refuse before anything is called.
  if (limiter.backend !== "upstash") {
    return refuse(503, "no-shared-store", NO_STORE_MESSAGE);
  }

  const rate = await limiter.checkRate(ip);
  if (rate.limited) {
    return refuse(429, "rate-limited", "That is a lot of requests at once. Give it a few seconds and try again.");
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return refuse(400, "bad-request", "That request did not make sense.");
  }

  // An unknown slug falls back rather than 400ing, exactly as the chat route
  // treats the picker. A visitor who picks the same model twice gets the
  // cheapest other model rather than an error.
  const a = findModel(parsed.a) ?? defaultModel();
  const requestedB = findModel(parsed.b);
  const b: ChatModel | undefined =
    requestedB && requestedB.id !== a.id
      ? requestedB
      : CHEAPEST_FIRST.map(findModel).find((model): model is ChatModel => Boolean(model) && model?.id !== a.id);
  if (!b) {
    return refuse(400, "bad-request", "There is no second model to compare against.");
  }
  const judge = pickJudgeModel([a.id, b.id]);
  if (!judge) {
    return refuse(400, "bad-request", "No model is free to score this run.");
  }

  // Per visitor, not site-wide: a shared key would let one visitor's run
  // stand in as another visitor's answer, and a cache hit costs nothing and
  // spends no run allowance, so a shared key would also be a free bypass of
  // the daily cap for everyone after the first tap.
  const cacheKey = `${ipHash(ip)}:${dayBucket()}:${a.id}|${b.id}`;
  const cached = await limiter.recallRun(cacheKey).catch(() => undefined);
  if (cached) {
    // Same visitor, same pair, same day: replay what was measured rather than
    // paying for the same measurement twice.
    return new Response(cached, {
      status: 200,
      headers: { "Content-Type": EVAL_CONTENT_TYPE, "Cache-Control": "no-store" },
    });
  }

  const system = renderedPrompt();
  const estimateUsd = evalPrechargeUsd({
    contestants: [a, b],
    judge,
    promptChars: system.length + LIVE_EVAL_TURN.length,
  });

  const evalReservation = await limiter.reserveEvalRun(ip, estimateUsd);
  if (!evalReservation.ok) {
    const message =
      evalReservation.reason === "ip-runs"
        ? "You have used today's live runs from this connection. The published results below were measured and are still there."
        : "Live runs have used today's evaluation budget. They are back tomorrow; the published results below were measured and are still there.";
    return refuse(429, evalReservation.reason, message);
  }

  // The same call every chat request makes, and the only global hard cap.
  const budget = await limiter.reserveBudget(ip, estimateUsd);
  if (!budget.ok) {
    // Nothing was called, so the eval sub-budget is given all of it back and
    // the run count goes back with it. That is the contract on both sites: a
    // refusal before any model call returns the run, and a run where any model
    // was called keeps the count and the money. Keeping the count here would
    // charge this visitor for a run that never happened, and a visitor who
    // arrives during someone else's budget refusal would find their own
    // allowance already spent.
    await Promise.all([evalReservation.settle(0), evalReservation.release()]);
    const message =
      budget.reason === "hard-budget"
        ? "The site has used today's model budget. Live runs are back tomorrow."
        : "This connection has used today's model allowance. Live runs are back tomorrow.";
    return refuse(429, budget.reason, message);
  }

  const frames: EvalFrame[] = [];
  let spentUsd = 0;
  let reconciled = false;
  /** True once the visitor stopped the run: the stream is gone, the legs are not. */
  let cancelled = false;

  /**
   * `finished` means the accounting is complete: every model call this run
   * made is in `spentUsd`, so both reservations settle against it and an
   * over-estimate is given back.
   *
   * `abandoned` means the run stopped somewhere in the middle, because the
   * visitor navigated away or pressed stop (`cancel`) or because a leg threw
   * (`catch`). The models were already called and the gateway already billed
   * them, and `spentUsd` is a lower bound rather than the total: a leg that
   * throws never reports its usage at all. So the estimate stays charged on
   * both the eval sub-budget and the global cap, and only a run that
   * overshot the estimate is topped up. Refunding here is how a site loses
   * money it cannot see: the books would read zero while the gateway bill
   * does not.
   *
   * This is called more than once on an abandoned run, and that is the point.
   * `cancel` fires the moment the visitor leaves, while the legs it abandoned
   * keep running to completion and keep adding to `spentUsd`. A guard that
   * dropped those later calls dropped the overshoot with them, so a run that
   * cost more than its estimate was billed by the gateway and never charged
   * here. The first call reconciles; every later one tops up with the running
   * total, which adds the difference against what is already held. Only ever
   * up: nothing after the first reconciliation can lower either reservation.
   */
  const settle = async (outcome: "finished" | "abandoned") => {
    const late = reconciled;
    reconciled = true;
    const billed = round6(spentUsd);
    if (outcome === "finished" && !late) {
      await Promise.all([budget.settle(billed), evalReservation.settle(billed)]);
    } else {
      await Promise.all([budget.topUp(billed), evalReservation.topUp(billed)]);
    }
    console.log(
      JSON.stringify({
        event: "evals.usage",
        site: "majidmemari",
        requestId,
        outcome: late ? `${outcome}-late` : outcome,
        ip: ipHash(ip),
        contestants: [a.id, b.id],
        judge: judge.id,
        estimateUsd,
        costUsd: billed,
        chargedUsd:
          outcome === "finished" && !late ? billed : round6(Math.max(spentUsd, estimateUsd)),
        totalMs: Date.now() - startedAt,
        limiter: budget.backend,
      }),
    );
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      /**
       * Once the visitor has gone the controller is dead and `enqueue` throws.
       * The frame has nowhere to reach at that point, but the leg that
       * produced it still has to reach the accounting below, so a dead
       * controller must never throw its way out of a leg: that is how the
       * overshoot on an abandoned run went missing. `frames` keeps filling
       * either way, since the replay cache is built from it.
       */
      let open = true;
      const send = (frame: EvalFrame) => {
        frames.push(frame);
        if (!open) return;
        try {
          controller.enqueue(line(frame));
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed or cancelled. Nothing to close, nothing to report.
        }
      };

      try {
        send({
          type: "start",
          scenarioId: EVAL_SCENARIO.id,
          question: LIVE_EVAL_TURN,
          maxOutputTokens: EVAL_OUTPUT_TOKENS,
          contestants: [a, b].map((model) => ({
            model: model.id,
            label: model.label,
            vendor: model.vendor,
          })),
          judge: { model: judge.id, label: judge.label },
          cached: false,
        });

        // Leg one: both contestants, in parallel, each bounded.
        const results = await Promise.all([
          runContestant("a", a, system),
          runContestant("b", b, system),
        ]);

        for (const result of results) {
          spentUsd += result.costUsd;
          send({
            type: "reply",
            slot: result.slot,
            model: result.model.id,
            label: result.model.label,
            ttftMs: result.ttftMs,
            totalMs: result.totalMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            costUsd: round6(result.costUsd),
            text: result.text,
          });
        }

        // Stopped while the contestants were in flight. They landed, the
        // gateway billed them, so the accounting is topped up with what they
        // actually cost; the judge is never started, because a run nobody is
        // watching must not buy a third model call. Same rule as the company
        // site, which skips its judge leg on a cancelled run too.
        if (cancelled) {
          await settle("abandoned");
          close();
          return;
        }

        if (results.some((r) => r.text.length === 0)) {
          send({
            type: "error",
            code: "contestant-failed",
            message: "One model returned nothing, so there is nothing to score.",
          });
          // Both contestants returned usage, so the accounting is complete
          // even though the run produced no score.
          await settle("finished");
          close();
          return;
        }

        // Leg two: the judge. No tools are attached, because `result.output`
        // throws when the last step finishes with tool calls.
        const judged = await generateText({
          model: gateway(judge.id),
          system:
            "You are scoring two AI assistant replies against a fixed rubric. You do not know which model wrote which reply and you must not guess. Return only the structured verdict.",
          prompt: judgePrompt(results[0].text, results[1].text),
          output: Output.object({ schema: judgeResultSchema }),
          maxOutputTokens: EVAL_JUDGE_OUTPUT_TOKENS,
          timeout: { totalMs: EVAL_JUDGE_TIMEOUT_MS },
          providerOptions: {
            gateway: {
              tags: ["site:majidmemari", "feature:evals", `env:${process.env.VERCEL_ENV ?? "dev"}`],
            },
          },
        });

        spentUsd += costUsd(tokenBreakdown(judged.totalUsage), judge);

        let verdict;
        try {
          verdict = judged.output;
        } catch (err) {
          // A truncated verdict arrives as `NoObjectGeneratedError`, not
          // `NoOutputGeneratedError`: the judge wrote text that did not fit
          // the schema because its reasoning ate the output cap. Both mean
          // the same thing to a visitor, so both leave the replies standing
          // and say the scoring did not land.
          if (
            !NoOutputGeneratedError.isInstance(err) &&
            !NoObjectGeneratedError.isInstance(err)
          ) {
            throw err;
          }
          send({
            type: "error",
            code: "judge-failed",
            message: "The judge did not return a usable score, so this run is unscored. Nothing was published.",
          });
          // The judge call still reported its usage, so this is settleable.
          await settle("finished");
          close();
          return;
        }

        send({
          type: "scores",
          judge: { model: judge.id, label: judge.label },
          results: [
            { slot: "a" as const, model: a.id, verdict: verdict.a },
            { slot: "b" as const, model: b.id, verdict: verdict.b },
          ].map((entry) => ({
            slot: entry.slot,
            model: entry.model,
            scores: Object.fromEntries(
              RUBRIC_KEYS.map((key) => [key, entry.verdict.scores[key]]),
            ) as Record<(typeof RUBRIC_KEYS)[number], number>,
            total: rubricTotal(entry.verdict.scores),
            verdict: entry.verdict.verdict,
          })),
          winner: verdict.winner,
          why: verdict.why,
        });

        send({
          type: "done",
          totalUsd: round6(spentUsd),
          cached: false,
          runsLeftToday: Math.max(0, EVAL_RUNS_PER_IP_PER_DAY - evalReservation.runsToday),
        });

        await settle("finished");
        // Remember the finished run so the next tap today replays it.
        const replay = frames
          .map((frame) =>
            frame.type === "start" || frame.type === "done"
              ? JSON.stringify({ ...frame, cached: true })
              : JSON.stringify(frame),
          )
          .join("\n");
        await limiter.rememberRun(cacheKey, `${replay}\n`).catch(() => undefined);
        close();
      } catch (err) {
        console.error("[evals] live run failed:", { requestId, err });
        send({
          type: "error",
          code: "contestant-failed",
          message: "The run did not finish. Nothing was published and the published results below are unaffected.",
        });
        await settle("abandoned");
        close();
      }
    },
    async cancel() {
      // The visitor navigated away or pressed stop mid-run. The models were
      // already called, so the reservation is topped up, never refunded. The
      // flag stops the legs that have not been paid for yet: see the judge.
      cancelled = true;
      await settle("abandoned");
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": EVAL_CONTENT_TYPE,
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
