/**
 * Model bake-off for the AI Consultant.
 *
 * Plays the same two-turn prospect conversation through the REAL system
 * prompt on each model through Vercel AI Gateway, and records time to first
 * token, total latency, tokens, and cost. With `--json` it writes two files:
 * `evals/results/bakeoff-latest.json`, the metrics the site renders, and
 * `evals/results/bakeoff-transcripts.json`, the replies those metrics belong
 * to, which `evals/judge.ts` scores.
 *
 *   npx tsx evals/bakeoff.ts anthropic/claude-opus-5 anthropic/claude-sonnet-5
 *   npx tsx evals/bakeoff.ts --json anthropic/claude-opus-5 anthropic/claude-sonnet-5 openai/gpt-5.6-sol google/gemini-3.8-flash
 *
 * Needs AI_GATEWAY_API_KEY (`vercel env pull .env.local`, then
 * `set -a; source .env.local; set +a`).
 *
 * The prompt is rendered with `renderedPrompt()`, which is what production
 * sends: email is not configured there, and a run against any other rendering
 * would publish a `promptHash` that matches nothing.
 *
 * The published artifact carries no transcripts: it is a metrics record, and
 * a reply is not a fact about a model that survives a version bump. The
 * replies go to a second file instead, which the page never imports, so the
 * judge scores the very replies that produced the published cost and latency
 * rather than a fresh generation that would only resemble them. The two files
 * share one `generatedAt`, `gitSha` and `promptHash` so a mismatched pair is
 * visible instead of silently wrong. Scores live in `judge-latest.json`,
 * written by `evals/judge.ts`.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { renderedPrompt } from "../lib/assistant";
import { CHAT_MODELS } from "../lib/chat-models";
import { EVAL_SCENARIO, promptHash } from "../lib/evals";

const KEY = process.env.AI_GATEWAY_API_KEY;
if (!KEY) throw new Error("AI_GATEWAY_API_KEY is not set");

const args = process.argv.slice(2);
const WRITE_JSON = args.includes("--json");
const MODELS = args.filter((arg) => !arg.startsWith("--"));
if (MODELS.length === 0) throw new Error("Pass one or more gateway model slugs");

/**
 * Matches the production output cap for the chat route, and must keep matching
 * it: the published numbers are only a measurement of the site if the run is
 * capped the way the site is. On a thinking model this budget covers the
 * reasoning too, and at 2,000 Gemini 3.8 Flash spent all of it thinking and
 * returned an empty second turn, which is what raised both to 2,500.
 */
const MAX_OUTPUT_TOKENS = 2_500;
const OUT_PATH = "evals/results/bakeoff-latest.json";
const TRANSCRIPTS_PATH = "evals/results/bakeoff-transcripts.json";

/** The commit the numbers belong to. Never guessed: a result nobody can trace is not a result. */
function gitSha(): string {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    console.error(
      "Cannot determine the commit: no VERCEL_GIT_COMMIT_SHA and `git rev-parse HEAD` failed. Run this inside the repo.",
    );
    process.exit(1);
  }
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function complete(model: string, messages: Msg[]) {
  const t0 = Date.now();
  const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`${model}: HTTP ${res.status} ${await res.text()}`);

  let text = "";
  let ttft: number | null = null;
  let usage: { prompt_tokens?: number; completion_tokens?: number } = {};
  // The provider can end a stream in an error after billing real tokens, and
  // it says so here rather than in the HTTP status, which was 200 long before.
  let finishReason: string | null = null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      if (!raw.startsWith("data:")) continue;
      const payload = raw.slice(5).trim();
      if (payload === "[DONE]") continue;
      let chunk: {
        usage?: typeof usage;
        choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
      };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      if (chunk.usage) usage = chunk.usage;
      if (chunk.choices?.[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        if (ttft === null) ttft = Date.now() - t0;
        text += delta;
      }
    }
  }
  return { text, ttft, total: Date.now() - t0, usage, finishReason };
}

/**
 * One attempt is not a measurement when the provider can fail mid-stream.
 *
 * Measured 2026-09-13: `google/gemini-3.8-flash` ended its second turn with
 * `finish_reason: "error"` after 763 reasoning tokens and zero text, twice in
 * a row. The old loop read only `delta.content`, so an errored stream reached
 * the artifact as a reply of length zero, priced and timed like any other row.
 * A published table that cannot tell a bad answer from no answer is worse than
 * no table. So: retry once, and if the stream still ends in anything but a
 * clean stop or a length cutoff, or still carries no text, stop the whole run
 * and say which model failed. A human decides whether to publish without it.
 */
async function completeOrFail(model: string, messages: Msg[]) {
  const attempts: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const r = await complete(model, messages);
    const clean = r.finishReason === null || r.finishReason === "stop" || r.finishReason === "length";
    if (clean && r.text.trim()) return r;
    attempts.push(`attempt ${attempt}: finish_reason ${r.finishReason ?? "none"}, ${r.text.length} chars`);
    if (attempt === 1) console.log(`  ${model}: ${attempts[0]}, retrying once`);
  }
  throw new Error(
    `${model} did not return a usable reply (${attempts.join("; ")}). Nothing was written. Rerun, or rerun without this model and say on the page that it is missing.`,
  );
}

const SYSTEM = renderedPrompt();

/** One model's side of the conversation, in order. */
type Transcript = {
  model: string;
  label: string;
  turns: { user: string; assistant: string }[];
};

type Run = {
  model: string;
  label: string;
  vendor: string;
  ttftMs: number | null;
  totalMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  replyChars: number;
};

/** Wrapped in a function because this repo is CommonJS: no top-level await. */
async function main() {
  const runs: Run[] = [];
  const transcripts: Transcript[] = [];

  for (const model of MODELS) {
    const priced = CHAT_MODELS.find((m) => m.id === model);
    console.log("=".repeat(100));
    console.log(`MODEL: ${model}${priced ? "" : " (unpriced: not in lib/chat-models.ts, cost shown as $0)"}`);

    const history: Msg[] = [{ role: "system", content: SYSTEM }];
    const turns: Transcript["turns"] = [];
    let cost = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let totalMs = 0;
    let firstTtft: number | null = null;
    let replyChars = 0;

    for (const [i, turn] of EVAL_SCENARIO.turns.entries()) {
      history.push({ role: "user", content: turn });
      const r = await completeOrFail(model, history);
      history.push({ role: "assistant", content: r.text });
      turns.push({ user: turn, assistant: r.text.trim() });

      const inTok = r.usage.prompt_tokens ?? 0;
      const outTok = r.usage.completion_tokens ?? 0;
      cost += (inTok * (priced?.inputPerM ?? 0) + outTok * (priced?.outputPerM ?? 0)) / 1e6;
      inputTokens += inTok;
      outputTokens += outTok;
      totalMs += r.total;
      replyChars += r.text.length;
      if (firstTtft === null) firstTtft = r.ttft;

      console.log(
        `--- turn ${i + 1} | TTFT ${r.ttft === null ? "n/a" : (r.ttft / 1000).toFixed(2)}s | total ${(r.total / 1000).toFixed(1)}s | in ${inTok} out ${outTok}`,
      );
      console.log(r.text.trim());
    }

    console.log(`--- conversation cost: $${cost.toFixed(4)}`);
    runs.push({
      model,
      label: priced?.label ?? model,
      vendor: priced?.vendor ?? "Unknown",
      ttftMs: firstTtft,
      totalMs,
      inputTokens,
      outputTokens,
      costUsd: Math.round(cost * 1e6) / 1e6,
      replyChars,
    });
    transcripts.push({ model, label: priced?.label ?? model, turns });
  }

  if (!WRITE_JSON) return;

  // One stamp for both files: the judge refuses a transcript that does not
  // belong to the published metrics, and that check is only worth anything if
  // the writer cannot produce a pair that disagrees.
  const generatedAt = new Date().toISOString();
  const sha = gitSha();
  const hash = promptHash(SYSTEM);
  const provenance = {
    schemaVersion: 1 as const,
    site: "majidmemari" as const,
    generatedAt,
    gitSha: sha,
    promptHash: hash,
    scenarioId: EVAL_SCENARIO.id,
  };

  const artifact = {
    ...provenance,
    turns: EVAL_SCENARIO.turns.length,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    runs,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);

  const transcriptArtifact = {
    ...provenance,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    runs: transcripts,
  };
  writeFileSync(TRANSCRIPTS_PATH, `${JSON.stringify(transcriptArtifact, null, 2)}\n`);

  console.log(
    `\nWrote ${OUT_PATH} (${runs.length} runs) and ${TRANSCRIPTS_PATH} (the replies behind them).\nScores are a separate measurement of these same replies: run evals/judge.ts.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
