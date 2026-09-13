"use client";

/**
 * Evaluations, in public.
 *
 * Two blocks, never merged. The published bake-off is the checked-in artifact
 * from `evals/bakeoff.ts` plus the scores `evals/judge.ts` gave those replies;
 * the live run is one cheap turn a visitor can trigger. They are different
 * measurements, so each block states its own shape and a live number never
 * overwrites a published cell. When nothing has been measured yet the table
 * says so: a score only exists if someone measured it.
 *
 * The published table names a judge per row, not one judge for the table.
 * Every reply is scored by a model that did not write it, and with the whole
 * allowlist racing that has to be a different model for the row whose model
 * would otherwise be scoring itself. A row nobody scored says "not scored" in
 * both the Score and the Scored by column rather than borrowing a number.
 *
 * The live run talks to `POST /api/evals/run`, which replies with
 * `EVAL_CONTENT_TYPE` NDJSON and the `EvalFrame` union from `lib/evals.ts`.
 * Request body: `{"b":"<gateway model id>"}`; the server picks contestant A
 * and the judge, and no model judges itself.
 *
 * A refusal is an `error` frame with a non-2xx status, not a JSON error
 * object, so the body is read as NDJSON either way and the server's own
 * sentence is what the visitor sees. A refusal that spent nothing is worth
 * saying out loud.
 *
 * Cost: the route reserves against the same budget as the chat, plus its own
 * per-day eval sub-budget and a per-visitor daily run count.
 *
 * A visitor may stop a run, and leaving the page stops it too: both abort the
 * same controller, which ends the stream and the accounting. Neither returns
 * the money, because the models already called were already paid for.
 */

import { useEffect, useRef, useState } from "react";
import { formatMs, formatTokens } from "@/lib/chat-metadata";
import { CHAT_MODELS, DEFAULT_MODEL_ID, findModel, formatUsd, PRICES_AS_OF } from "@/lib/chat-models";
import { EVAL_RUNS_PER_IP_PER_DAY } from "@/lib/chat-limits";
import {
  publishedBakeoff,
  readFrames,
  RUBRIC,
  RUBRIC_KEYS,
  RUBRIC_MAX,
  type EvalErrorCode,
  type EvalFrame,
  type RubricKey,
} from "@/lib/evals";

const RUN_ENDPOINT = "/api/evals/run";

/** The reply model the site ships with; the visitor picks what it runs against. */
const DEFAULT_MODEL = findModel(DEFAULT_MODEL_ID) ?? CHAT_MODELS[0];

const ERROR_COPY: Record<EvalErrorCode, string> = {
  "no-shared-store":
    "Live runs need a shared counter store, and this deployment has none, so the run was refused before it spent anything.",
  "ip-runs": `That is today's live runs from this connection (${EVAL_RUNS_PER_IP_PER_DAY} a day). The published table below is unaffected.`,
  "eval-budget": "Today's evaluation budget is used up. Nothing was spent on this attempt.",
  "hard-budget": "The site has reached its daily model budget, so the run was refused.",
  "ip-budget": "This connection has reached its daily model budget, so the run was refused.",
  "rate-limited": "Too many requests in the last minute. Wait a moment and try again.",
  "bad-request": "That request was not something the run accepts.",
  "contestant-failed": "One of the two models did not answer in time, so there is nothing to score.",
  "judge-failed": "Both models answered, but the judge did not return a usable score.",
};

type ReplyFrame = Extract<EvalFrame, { type: "reply" }>;
type StartFrame = Extract<EvalFrame, { type: "start" }>;
type ScoresFrame = Extract<EvalFrame, { type: "scores" }>;
type DoneFrame = Extract<EvalFrame, { type: "done" }>;

type RunState = "idle" | "running" | "finished" | "failed";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
      {children}
    </p>
  );
}

function ReplyText({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-xs text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-100"
      >
        {open ? `Hide what ${label} said` : `Read what ${label} said`}
      </button>
      {open && (
        <p className="mt-1 min-w-0 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 px-2 py-1.5 text-xs leading-relaxed dark:bg-zinc-900/60">
          {text}
        </p>
      )}
    </div>
  );
}

/** "A", "A and B", "A, B and C". No dashes, no serial comma. */
function nameList(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * Allowlisted models the published run does not cover.
 *
 * `evals/bakeoff.ts` retries a model once and then stops the whole run rather
 * than writing a row it could not measure, so a model can only be missing here
 * because a human reran without it after it failed to answer. The reader is
 * owed that fact rather than left to notice the table is shorter than the
 * picker. Empty on a run that raced the whole allowlist, and the note below
 * disappears with it.
 */
function unmeasuredModels(models: readonly { model: string }[]) {
  const measured = new Set(models.map((row) => row.model));
  return CHAT_MODELS.filter((m) => !measured.has(m.id));
}

function PublishedBlock() {
  const published = publishedBakeoff();

  if (!published) {
    return (
      <>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          No scored run is published for this site yet, so this table is deliberately empty. A run is
          published by checking in the artifact the bake-off writes; nobody types a score into the page
          by hand.
        </p>
        {/*
          A sideways scroller is only reachable by mouse or touch until it can
          take focus: it holds no focusable descendant, so a keyboard or
          switch-access visitor could never see the columns past the fold.
          tabIndex 0 plus a name and a visible ring make it a stop on the tab
          order that arrow keys can then scroll.
        */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Model list prices, scroll sideways"
          className="min-w-0 overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <table className="w-full min-w-[26rem] text-left text-xs">
            <caption className="pb-2 text-left text-xs text-zinc-600 dark:text-zinc-400">
              The models the picker offers, at gateway list price on {PRICES_AS_OF}
            </caption>
            <thead className="text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="py-1 pr-3 font-medium">Model</th>
                <th className="py-1 pr-3 font-medium">In per 1M</th>
                <th className="py-1 pr-3 font-medium">Out per 1M</th>
                <th className="py-1 font-medium">Prompt cache</th>
              </tr>
            </thead>
            <tbody>
              {CHAT_MODELS.map((m) => (
                <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">{m.label}</td>
                  <td className="py-1.5 pr-3">${m.inputPerM}</td>
                  <td className="py-1.5 pr-3">${m.outputPerM}</td>
                  <td className="py-1.5">{m.promptCache ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // A table where every row is perfect says more about the judge than about the
  // models, and a page arguing for evaluation should be the first to say so.
  const scoredRows = published.rows.filter((row) => row.total != null);
  const maxTotal = RUBRIC.length * RUBRIC_MAX;
  const everyoneTied = scoredRows.length > 1 && scoredRows.every((row) => row.total === maxTotal);

  const missing = unmeasuredModels(published.rows);
  const missingJudges = missing.filter((m) =>
    published.judgedBy?.judges.some((judge) => judge.model === m.id),
  );

  return (
    <>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {published.generatedAt.slice(0, 10)} · {published.turns} turns, up to{" "}
        {formatTokens(published.maxOutputTokens)} output tokens · commit {published.gitSha.slice(0, 7)} ·
        prompt {published.promptHash}
      </p>
      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{published.scenarioSummary}</p>
      <div
        tabIndex={0}
        role="region"
        aria-label="Published bake-off results, scroll sideways"
        className="min-w-0 overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <table className="w-full min-w-[36rem] text-left text-xs">
          <thead className="text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="py-1 pr-3 font-medium">Model</th>
              <th className="py-1 pr-3 font-medium">First token</th>
              <th className="py-1 pr-3 font-medium">Total</th>
              <th className="py-1 pr-3 font-medium">Cost</th>
              <th className="py-1 pr-3 font-medium">Score</th>
              <th className="py-1 font-medium">Scored by</th>
            </tr>
          </thead>
          <tbody>
            {published.rows.map((row) => (
              <tr key={row.model} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-1.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">{row.label}</td>
                <td className="py-1.5 pr-3">{row.ttftMs == null ? "not measured" : formatMs(row.ttftMs)}</td>
                <td className="py-1.5 pr-3">{formatMs(row.totalMs)}</td>
                <td className="py-1.5 pr-3">{formatUsd(row.costUsd)}</td>
                <td className="py-1.5 pr-3">
                  {row.total == null ? "not scored" : `${row.total} of ${RUBRIC.length * RUBRIC_MAX}`}
                </td>
                {/* The judge of this reply, so the rule is checkable row by row. */}
                <td className="py-1.5">{row.judgeLabel ?? "not scored"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {published.judgedBy ? (
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Scored on {published.judgedBy.generatedAt.slice(0, 10)}, one reply at a time, by{" "}
          {nameList(published.judgedBy.judges.map((j) => j.label))}. No model scored its own reply, so
          the Scored by column names the judge of each row rather than one judge for the table.
        </p>
      ) : (
        /* The timings above were measured; the scores were not. Say which. */
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          No scores belong to this run yet. The latency and cost above were measured; the Score column
          stays empty until these same replies have been scored, rather than borrowing numbers from an
          earlier run.
        </p>
      )}
      {everyoneTied && (
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Every scored row came back at {maxTotal} of {maxTotal}, which is a finding about the rubric
          and the judge rather than a tie between the models. On a scenario this familiar the five
          questions stop separating good answers from very good ones, and this judge is a generous
          one. The honest next change to this page is a harder scenario and a stricter judge, not a
          better looking table.
        </p>
      )}
      {missing.length > 0 && (
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {nameList(missing.map((m) => m.label))} {missing.length === 1 ? "is" : "are"} on the model
          picker but not in this table, and the reason is worth reading. The bake-off calls each model
          with the system prompt of this site and no tools attached. In that configuration, on{" "}
          {published.generatedAt.slice(0, 10)}, the second turn ended in a provider error on every
          attempt, so there was nothing to measure and the bake-off refuses to publish a row it could
          not measure. The chat itself attaches ten tools, and there the same second turn is answered
          normally, checked three times that day. The gap between the harness and the product is the
          point: an evaluation only measures the call it actually makes.{" "}
          {/* A missing contestant can still be a judge: a verdict is one call, and the failure is on a follow-up turn. */}
          {missingJudges.length > 0
            ? `${nameList(missingJudges.map((m) => m.label))} still ${missingJudges.length === 1 ? "scores" : "score"} rows above, because a verdict is a single call. `
            : ""}
          In the chat, a turn that returns nothing is retried once on the fallback model and the reply
          names the model that answered.
        </p>
      )}
    </>
  );
}

export type EvalPanelProps = {
  /**
   * Where this panel's progress line and its notices go to be spoken. The
   * inline demo frame passes its own always-rendered region here, because the
   * tabpanel this panel sits in is hidden with `display: none` whenever the
   * visitor is on another tab, and a hidden subtree is not in the
   * accessibility tree. Left out, where nothing hides this panel, the copy
   * below carries its own regions exactly as it did before.
   */
  onAnnounce?: (announcement: { key: string; text: string } | undefined) => void;
};

export function EvalPanel({ onAnnounce }: EvalPanelProps) {
  const others = CHAT_MODELS.filter((m) => m.id !== DEFAULT_MODEL.id);
  const [contestant, setContestant] = useState(others[0]?.id ?? CHAT_MODELS[0].id);
  const [state, setState] = useState<RunState>("idle");
  const [start, setStart] = useState<StartFrame | undefined>();
  const [replies, setReplies] = useState<ReplyFrame[]>([]);
  const [scores, setScores] = useState<ScoresFrame | undefined>();
  const [done, setDone] = useState<DoneFrame | undefined>();
  const [note, setNote] = useState("");
  const running = state === "running";
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    if (running) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setState("running");
    setStart(undefined);
    setReplies([]);
    setScores(undefined);
    setDone(undefined);
    setNote("");
    try {
      const res = await fetch(RUN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ b: contestant }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.status === 404 || res.status === 501) {
        setState("failed");
        setNote("Live runs are not enabled on this deployment. The published block above is unaffected.");
        return;
      }
      if (!res.ok || !res.body) {
        // Refusals come back as one `error` frame with a non-2xx status.
        const text = await res.text();
        if (controller.signal.aborted) return;
        const refusal = readFrames(`${text}\n`).frames.find((f) => f.type === "error");
        setState("failed");
        setNote(
          refusal?.message ||
            (refusal ? ERROR_COPY[refusal.code] : "") ||
            `The run did not start (${res.status}).`,
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let failed = false;
      for (;;) {
        const { done: streamDone, value } = await reader.read();
        if (controller.signal.aborted) return;
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const { frames, rest } = readFrames(buffer);
        buffer = rest;
        for (const frame of frames) {
          switch (frame.type) {
            case "start":
              setStart(frame);
              break;
            case "reply":
              setReplies((rows) => [...rows.filter((r) => r.slot !== frame.slot), frame]);
              break;
            case "scores":
              setScores(frame);
              break;
            case "done":
              setDone(frame);
              break;
            case "error":
              failed = true;
              // The route writes the sentence; the table here is the fallback.
              setNote(frame.message || ERROR_COPY[frame.code] || "The run did not finish.");
              break;
          }
        }
      }
      setState(failed ? "failed" : "finished");
    } catch {
      if (controller.signal.aborted) return;
      setState("failed");
      setNote("The connection dropped before the run finished. Nothing was published.");
    } finally {
      // Only clear the slot this run owns. A visitor who stops and starts again
      // must not have the finished run null out the new controller, or the
      // unmount cleanup would have nothing left to abort.
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  /**
   * Stopping ends the stream and the accounting, and never returns the money.
   * The models already called were already paid for, so the notice says so
   * rather than implying a refund. The panel goes back to idle here rather than
   * waiting on the aborted fetch to reject, so a stop can never leave the
   * button stuck reading "Stop".
   */
  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setNote("You stopped the run. The models already called are still counted.");
  }

  /** The one line this panel has while a run is in flight, rendered and spoken. */
  const progress =
    running && !start
      ? "Reserving budget and starting the run."
      : start
        ? `${start.cached ? "Today's run, replayed from cache: " : ""}up to ${formatTokens(start.maxOutputTokens)} output tokens each, judged by ${start.judge.label}.`
        : "";
  /** A notice outranks the progress line: a refusal or a stop is the answer. */
  const spoken = note || progress;

  // What the frame's region was last handed, so an unrelated re-render does
  // not read the same line out again. A new key every time the words change is
  // what makes two runs with the same progress line two announcements.
  const spokenRef = useRef("");
  const seqRef = useRef(0);
  useEffect(() => {
    if (!onAnnounce || spoken === spokenRef.current) return;
    spokenRef.current = spoken;
    seqRef.current += 1;
    onAnnounce(spoken ? { key: `eval-live-${seqRef.current}`, text: spoken } : undefined);
  }, [onAnnounce, spoken]);

  const sortedReplies = [...replies].sort((a, b) => a.slot.localeCompare(b.slot));
  const scoreBySlot = new Map(scores?.results.map((r) => [r.slot, r]) ?? []);

  return (
    <div className="min-w-0 space-y-6 px-4 py-4 text-sm text-zinc-700 dark:text-zinc-300">
      <div className="space-y-2">
        <Label>The rubric</Label>
        <p className="leading-relaxed">
          A score only exists if someone measured it. Every model that answers on this site is measured
          on the same prospect conversation, against the same five questions.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-600 dark:text-zinc-400">
          {RUBRIC.map((r) => (
            <li key={r.key}>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{r.label}:</span> {r.question}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Label>Published run</Label>
        <PublishedBlock />
      </div>

      <div className="space-y-3">
        <Label>Run it live</Label>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          One turn of the same scenario, answered by {DEFAULT_MODEL.label} and by the model you pick, then
          scored by a third model. This is a smaller shape than the published run, so it stays in its own
          block and never rewrites a published cell. Two runs per visitor a day, inside the site budget.
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label htmlFor="eval-contestant" className="text-xs text-zinc-600 dark:text-zinc-400">
            Against
          </label>
          <select
            id="eval-contestant"
            value={contestant}
            onChange={(e) => setContestant(e.target.value)}
            disabled={running}
            className="min-w-0 max-w-full flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-sky-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {others.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          {/*
            One control, two states. While a run is in flight the same button
            stops it, so the visitor is never left watching a disabled button
            spend money it cannot be told to stop spending. It sits directly
            above the status line below, so the outcome of either press is
            announced there.
          */}
          <button
            type="button"
            onClick={() => (running ? stop() : void run())}
            className="btn-primary btn-compact shrink-0 text-xs disabled:opacity-50"
          >
            {running ? "Stop" : "Run it live"}
          </button>
        </div>

        {/*
          Where this line is announced depends on who rendered the panel.
          Inside the inline demo the run outlives the tab: a visitor presses
          Run it live, waits out the 20 to 40 seconds on another tab, and this
          subtree is `display: none` by then, pruned out of the accessibility
          tree with every word in it. So the frame passes `onAnnounce` and the
          speaking happens in its region, outside every tabpanel. With no frame
          around it this paragraph is the region, as it was. The words on
          screen are the same either way.
        */}
        <p
          aria-live={onAnnounce ? undefined : "polite"}
          className="min-w-0 text-xs text-zinc-600 dark:text-zinc-400"
        >
          {progress}
        </p>

        {start && (
          <p className="min-w-0 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 px-2 py-1.5 text-xs leading-relaxed dark:bg-zinc-900/60">
            {start.question}
          </p>
        )}

        {sortedReplies.length > 0 && (
          <div className="min-w-0 space-y-3">
            <div
              tabIndex={0}
              role="region"
              aria-label="Live run results, scroll sideways"
              className="min-w-0 overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <table className="w-full min-w-[30rem] text-left text-xs">
                <thead className="text-zinc-600 dark:text-zinc-400">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Model</th>
                    <th className="py-1 pr-3 font-medium">First token</th>
                    <th className="py-1 pr-3 font-medium">Total</th>
                    <th className="py-1 pr-3 font-medium">Output tokens</th>
                    <th className="py-1 pr-3 font-medium">Cost</th>
                    <th className="py-1 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReplies.map((r) => {
                    const scored = scoreBySlot.get(r.slot);
                    return (
                      <tr key={r.slot} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="py-1.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">{r.label}</td>
                        <td className="py-1.5 pr-3">{r.ttftMs == null ? "not measured" : formatMs(r.ttftMs)}</td>
                        <td className="py-1.5 pr-3">{formatMs(r.totalMs)}</td>
                        <td className="py-1.5 pr-3">{formatTokens(r.outputTokens)}</td>
                        <td className="py-1.5 pr-3">{formatUsd(r.costUsd)}</td>
                        <td className="py-1.5">
                          {scored ? `${scored.total} of ${RUBRIC.length * RUBRIC_MAX}` : "waiting"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sortedReplies.map((r) => (
              <ReplyText key={r.slot} label={r.label} text={r.text} />
            ))}
          </div>
        )}

        {scores && (
          <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Scored by {scores.judge.label}, which is neither of the two models above. No model
              scored its own reply.
            </p>
            <div
              tabIndex={0}
              role="region"
              aria-label="Live run rubric scores, scroll sideways"
              className="min-w-0 overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <table className="w-full min-w-[24rem] text-left text-xs">
                <thead className="text-zinc-600 dark:text-zinc-400">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Criterion</th>
                    {scores.results.map((r) => (
                      <th key={r.slot} className="py-1 pr-3 font-medium">
                        {findModel(r.model)?.label ?? r.model}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RUBRIC_KEYS.map((key: RubricKey) => (
                    <tr key={key} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="py-1.5 pr-3">{RUBRIC.find((r) => r.key === key)?.label ?? key}</td>
                      {scores.results.map((r) => (
                        <td key={r.slot} className="py-1.5 pr-3 font-mono">
                          {r.scores[key]} / {RUBRIC_MAX}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {scores.winner === "tie"
                ? "Too close to call on this run."
                : `Better on this run: ${
                    findModel(scores.results.find((r) => r.slot === scores.winner)?.model)?.label ??
                    scores.winner
                  }`}
            </p>
            {scores.why && <p className="text-xs leading-relaxed">{scores.why}</p>}
          </div>
        )}

        {done && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {done.cached
              ? "Replayed from today's cached run, so it cost nothing."
              : `This run cost ${formatUsd(done.totalUsd)}.`}{" "}
            {done.runsLeftToday} left today from this connection.
          </p>
        )}

        {/*
          Always mounted, even while empty: a live region that arrives in the
          DOM already holding its text is read out by no screen reader, and a
          refusal or a stop is exactly the outcome this line exists to speak.
          Empty it has no line box, and it is the last child here, so the
          spacing of the block is the same either way.

          It stops being a region when the frame took the speaking over: the
          notice is already in `spoken` above, and two regions saying it would
          say it twice.
        */}
        <p
          role={onAnnounce ? undefined : "status"}
          aria-live={onAnnounce ? undefined : "polite"}
          className="min-w-0 break-words text-xs text-amber-700 dark:text-amber-400"
        >
          {note}
        </p>
      </div>
    </div>
  );
}
