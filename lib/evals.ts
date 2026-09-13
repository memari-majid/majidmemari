/**
 * Evaluations: the one scenario, the rubric, the shape of a published result,
 * and the frames a live run streams to the page.
 *
 * Two different measurements live here and they are never mixed:
 *
 * - The published bake-off (`evals/results/bakeoff-latest.json`) is the
 *   checked-in result of `npx tsx evals/bakeoff.ts --json`: the full two-turn
 *   prospect conversation through the real system prompt, capped at the
 *   production output limit. Scores for it come from `judge-latest.json`,
 *   written by `evals/judge.ts`, which scores the very replies that run
 *   measured. Both are measured artifacts. Nobody edits a number in them by
 *   hand, and a score only exists if someone measured it. A score is joined
 *   to a row only when the two artifacts agree on the run they came from, so
 *   one row never mixes a score from one generation with a cost and a
 *   latency from another. Each reply is scored by a model that did not write
 *   it, and the judge is picked per row rather than once for the table, so a
 *   bake-off that races every allowlisted model still has a judge for every
 *   reply. Each row therefore carries the judge that scored it.
 *
 * - A live run started from the page is one turn at `EVAL_OUTPUT_TOKENS`, so
 *   it is cheap enough to hand to a visitor. It is rendered in its own block,
 *   labelled with its own shape, and never overwrites a published cell.
 *
 * Client-safe: zod, two JSON imports, and pure functions.
 */

import { z } from "zod";
import bakeoffJson from "@/evals/results/bakeoff-latest.json";
import judgeJson from "@/evals/results/judge-latest.json";

/* ------------------------------------------------------------------------ */
/* Scenario and rubric                                                       */
/* ------------------------------------------------------------------------ */

/** A realistic prospect: a symptom first, then the question behind it. */
export const EVAL_SCENARIO = {
  id: "sop-rag-vs-finetune",
  summary: "A 40-person logistics company whose ops team gets wrong answers about its own SOPs",
  /** The published bake-off plays both turns. A live run plays the second one only. */
  turns: [
    "hi, we run a 40-person logistics company. our ops team keeps asking chatgpt questions about our own SOPs and getting wrong answers.",
    "should we build a RAG chatbot over our SOP docs or fine-tune a model? what would you actually do first, and what would it cost us in effort?",
  ],
} as const;

/** The live run asks the substantive question directly, in one turn. */
export const LIVE_EVAL_TURN = EVAL_SCENARIO.turns[1];

export const RUBRIC = [
  {
    key: "consults",
    label: "Consults before it sells",
    question: "Does it understand the situation and give guidance before offering anything?",
  },
  {
    key: "specific",
    label: "Specific and honest",
    question: "Does it name a first step, the trade-offs, and a realistic sense of effort?",
  },
  {
    key: "human",
    label: "Sounds like a person",
    question: "Does it react to what was said and ask one question at a time?",
  },
  {
    key: "grounded",
    label: "Grounded",
    question: "Does it avoid inventing prices, partners, dates, or course titles?",
  },
  {
    key: "forward",
    label: "Moves forward",
    question: "Does the next step fit the moment rather than restarting the conversation?",
  },
] as const;

export type RubricKey = (typeof RUBRIC)[number]["key"];
export const RUBRIC_KEYS = RUBRIC.map((r) => r.key) as readonly RubricKey[];
export const RUBRIC_MAX = 5;

/** The judge returns one of these per contestant. No tools, no free-form JSON. */
export const judgeVerdictSchema = z.object({
  scores: z.object({
    consults: z.number().int().min(1).max(RUBRIC_MAX),
    specific: z.number().int().min(1).max(RUBRIC_MAX),
    human: z.number().int().min(1).max(RUBRIC_MAX),
    grounded: z.number().int().min(1).max(RUBRIC_MAX),
    forward: z.number().int().min(1).max(RUBRIC_MAX),
  }),
  verdict: z.string().max(400),
});

export const judgeResultSchema = z.object({
  a: judgeVerdictSchema,
  b: judgeVerdictSchema,
  winner: z.enum(["a", "b", "tie"]),
  why: z.string().max(400),
});

export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;
export type JudgeResult = z.infer<typeof judgeResultSchema>;

export function rubricTotal(scores: JudgeVerdict["scores"]): number {
  return RUBRIC_KEYS.reduce((sum, key) => sum + scores[key], 0);
}

/* ------------------------------------------------------------------------ */
/* Published artifacts                                                       */
/* ------------------------------------------------------------------------ */

const measuredRunSchema = z.object({
  model: z.string(),
  label: z.string(),
  vendor: z.string(),
  /** Null when the provider sent no text delta before the reply completed. */
  ttftMs: z.number().nullable(),
  totalMs: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  costUsd: z.number(),
  replyChars: z.number(),
});

/**
 * `runs` is empty until someone runs the bake-off, and the page then says so
 * rather than showing a number nobody measured. Transcripts are deliberately
 * absent: the artifact is a metrics record, not a cache of model output.
 */
export const bakeoffArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  site: z.literal("majidmemari"),
  generatedAt: z.string(),
  gitSha: z.string(),
  promptHash: z.string(),
  scenarioId: z.string(),
  turns: z.number(),
  maxOutputTokens: z.number(),
  runs: z.array(measuredRunSchema),
});

/**
 * Version 2 is the per-row judge shape. There is no top-level `judgeModel` or
 * `judgeLabel`, because no single model scores the table: each verdict names
 * the model that wrote the reply and the model that scored it, and that
 * pairing is the whole record. A summary here as well as on each row is a
 * field that can disagree with the rows, and "no model scores its own reply"
 * has to stay checkable against the row that is actually rendered.
 *
 * An artifact from the old shape does not parse, on purpose: it claims one
 * judge for every row and cannot say which model scored which reply. Rerun
 * `npx tsx evals/judge.ts --json` rather than hand-editing it into shape.
 */
export const judgeArtifactSchema = z.object({
  schemaVersion: z.literal(2),
  site: z.literal("majidmemari"),
  generatedAt: z.string(),
  /**
   * The bake-off run these scores belong to. All three are required: the
   * judge copies them from the transcripts it scored, and a missing one is
   * how a score from another generation gets rendered beside a cost and a
   * latency it does not describe.
   */
  gitSha: z.string(),
  promptHash: z.string(),
  bakeoffGeneratedAt: z.string(),
  scenarioId: z.string(),
  verdicts: z.array(
    z.object({
      model: z.string(),
      /** The model that scored this reply. Never `model` itself. */
      judgeModel: z.string(),
      judgeLabel: z.string(),
      scores: judgeVerdictSchema.shape.scores,
      total: z.number(),
      verdict: z.string(),
    }),
  ),
});

export type BakeoffArtifact = z.infer<typeof bakeoffArtifactSchema>;
export type JudgeArtifact = z.infer<typeof judgeArtifactSchema>;
export type MeasuredRun = z.infer<typeof measuredRunSchema>;

/**
 * One row of the published table: metrics, plus a score when one exists and
 * the model that gave it. The judge belongs to the row rather than to the
 * table, because different rows are scored by different models.
 */
export type PublishedRow = MeasuredRun & {
  total?: number;
  verdict?: string;
  judgeModel?: string;
  judgeLabel?: string;
};

export type PublishedBakeoff = {
  generatedAt: string;
  gitSha: string;
  promptHash: string;
  turns: number;
  maxOutputTokens: number;
  scenarioSummary: string;
  rows: PublishedRow[];
  /**
   * Present only when scores were joined. `judges` is every model that scored
   * a row that is actually rendered, in row order and without repeats, so the
   * page never names a judge whose verdict was dropped.
   */
  judgedBy?: { generatedAt: string; judges: { model: string; label: string }[] };
};

/**
 * Whether a set of scores describes the run that produced these metrics. The
 * scenario, the commit, the prompt hash and the bake-off timestamp must all
 * match: a score of one generation rendered in the same row as the cost and
 * latency of another reads as a single measurement and is not one.
 */
function sameRun(bakeoff: BakeoffArtifact, judged: JudgeArtifact): boolean {
  if (judged.scenarioId !== bakeoff.scenarioId) return false;
  if (judged.gitSha !== bakeoff.gitSha) return false;
  if (judged.promptHash !== bakeoff.promptHash) return false;
  if (judged.bakeoffGeneratedAt !== bakeoff.generatedAt) return false;
  return true;
}

function parse<T>(schema: z.ZodType<T>, value: unknown, what: string): T | undefined {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.warn(`[evals] ${what} does not match its schema, so the page renders nothing from it.`);
  return undefined;
}

/**
 * The checked-in result, or undefined when nothing has been measured yet.
 * Validated rather than trusted: the artifact is written by a script that can
 * be rerun at any commit.
 */
export function publishedBakeoff(): PublishedBakeoff | undefined {
  const bakeoff = parse(bakeoffArtifactSchema, bakeoffJson, "bakeoff-latest.json");
  if (!bakeoff || bakeoff.runs.length === 0) return undefined;
  const judged = parse(judgeArtifactSchema, judgeJson, "judge-latest.json");
  const scored = judged && sameRun(bakeoff, judged) ? judged : undefined;

  const rows: PublishedRow[] = bakeoff.runs.map((run) => {
    const verdict = scored?.verdicts.find((v) => v.model === run.model);
    // A verdict a model gave its own reply is not a verdict. With the judge
    // picked per row there is no single top-level judge left to check this
    // against, which is exactly why each verdict records its own judge.
    if (!verdict || verdict.judgeModel === run.model) return { ...run };
    return {
      ...run,
      total: verdict.total,
      verdict: verdict.verdict,
      judgeModel: verdict.judgeModel,
      judgeLabel: verdict.judgeLabel,
    };
  });

  /** Every judge behind a score that survived the join, in row order. */
  const judges: { model: string; label: string }[] = [];
  for (const row of rows) {
    if (!row.judgeModel || judges.some((j) => j.model === row.judgeModel)) continue;
    judges.push({ model: row.judgeModel, label: row.judgeLabel ?? row.judgeModel });
  }

  return {
    generatedAt: bakeoff.generatedAt,
    gitSha: bakeoff.gitSha,
    promptHash: bakeoff.promptHash,
    turns: bakeoff.turns,
    maxOutputTokens: bakeoff.maxOutputTokens,
    scenarioSummary: EVAL_SCENARIO.summary,
    rows,
    ...(scored && judges.length > 0
      ? { judgedBy: { generatedAt: scored.generatedAt, judges } }
      : {}),
  };
}

/* ------------------------------------------------------------------------ */
/* Live run wire format                                                      */
/* ------------------------------------------------------------------------ */

/**
 * NDJSON, one JSON object per line. Not a data part on the chat stream: the
 * transcript sanitizer drops `data-*` parts, so a result carried that way
 * would be invisible to the model on the next turn and would look like a
 * silent failure.
 */
export type EvalFrame =
  | {
      type: "start";
      scenarioId: string;
      question: string;
      maxOutputTokens: number;
      contestants: { model: string; label: string; vendor: string }[];
      judge: { model: string; label: string };
      cached: boolean;
    }
  | {
      type: "reply";
      slot: "a" | "b";
      model: string;
      label: string;
      ttftMs: number | null;
      totalMs: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
      text: string;
    }
  | {
      type: "scores";
      judge: { model: string; label: string };
      results: {
        slot: "a" | "b";
        model: string;
        scores: Record<RubricKey, number>;
        total: number;
        verdict: string;
      }[];
      winner: "a" | "b" | "tie";
      why: string;
    }
  | { type: "done"; totalUsd: number; cached: boolean; runsLeftToday: number }
  | { type: "error"; code: EvalErrorCode; message: string };

export type EvalErrorCode =
  | "no-shared-store"
  | "ip-runs"
  | "eval-budget"
  | "hard-budget"
  | "ip-budget"
  | "rate-limited"
  | "bad-request"
  | "contestant-failed"
  | "judge-failed";

export const EVAL_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

/** Splits an NDJSON buffer into frames, returning the unfinished tail. */
export function readFrames(buffer: string): { frames: EvalFrame[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const frames: EvalFrame[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      frames.push(JSON.parse(trimmed) as EvalFrame);
    } catch {
      // A truncated line cannot be recovered; drop it rather than throwing
      // in the middle of a stream the visitor is watching.
    }
  }
  return { frames, rest };
}

/* ------------------------------------------------------------------------ */
/* Prompt fingerprint                                                        */
/* ------------------------------------------------------------------------ */

/**
 * FNV-1a over the rendered prompt. Not a security hash: it exists so a
 * published result can be matched to the prompt it measured, and so a stale
 * artifact is visible instead of silently wrong. Kept here rather than in
 * `node:crypto` so the page and the eval scripts compute it the same way.
 */
export function promptHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
