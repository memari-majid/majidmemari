/**
 * AI readiness snapshot. The model scores five dimensions from what the
 * visitor actually said; this module turns the scores into an overall
 * reading, a label, and a concrete next step, so the card and the model's
 * summary come from the same arithmetic.
 *
 * Client-safe: zod and pure functions, no React, no `ai` runtime imports.
 */

import { z } from "zod";

export const READINESS_DIMENSIONS = [
  {
    key: "goal",
    label: "Goal clarity",
    question: "Is the outcome specific enough to test, and does someone care about it?",
  },
  {
    key: "data",
    label: "Data",
    question: "Is the data the AI would need available, good enough, and allowed to be used?",
  },
  {
    key: "people",
    label: "People",
    question: "Is there an owner, and a team with the time and skills to run a first version?",
  },
  {
    key: "workflow",
    label: "Workflow fit",
    question: "Is there a concrete process the AI plugs into, with a person checking the output?",
  },
  {
    key: "governance",
    label: "Governance",
    question: "Are privacy, security, and approval questions answered, or at least known?",
  },
] as const;

export type ReadinessKey = (typeof READINESS_DIMENSIONS)[number]["key"];
export const READINESS_KEYS = READINESS_DIMENSIONS.map((d) => d.key) as readonly ReadinessKey[];

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

/** No regex patterns and no `format` keywords: this schema is sent to every picker model. */
const dimensionSchema = z.object({
  score: z
    .number()
    .int()
    .min(SCORE_MIN)
    .max(SCORE_MAX)
    .describe("1 = nothing in place, 3 = partly there, 5 = clearly ready. Score only from what the visitor said."),
  note: z
    .string()
    .max(240)
    .describe("One short sentence of evidence from the conversation, under 120 characters"),
});

export const readinessInputSchema = z.object({
  goal: dimensionSchema,
  data: dimensionSchema,
  people: dimensionSchema,
  workflow: dimensionSchema,
  governance: dimensionSchema,
  context: z
    .string()
    .max(400)
    .optional()
    .describe("One line naming the use case being assessed, under 200 characters"),
});

export type ReadinessInput = z.infer<typeof readinessInputSchema>;
export type ReadinessDimensionScore = z.infer<typeof dimensionSchema>;

export type ReadinessLevel = "exploring" | "forming" | "pilot-ready" | "build-ready";

export type ReadinessSnapshot = {
  context?: string;
  /** Mean of the five scores, one decimal, on the 1 to 5 scale. */
  overall: number;
  /** Same reading as a percentage for the bar. */
  percent: number;
  level: ReadinessLevel;
  label: string;
  summary: string;
  dimensions: Array<{
    key: ReadinessKey;
    label: string;
    score: number;
    note: string;
  }>;
  strongest: ReadinessKey;
  weakest: ReadinessKey;
  nextStep: string;
};

/** Integer 0 to 5, safe for `"★".repeat(clampScore(x))` on untrusted input. */
export function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(SCORE_MAX, Math.max(0, Math.round(num)));
}

export function readinessLevel(overall: number): ReadinessLevel {
  if (overall >= 4.2) return "build-ready";
  if (overall >= 3.3) return "pilot-ready";
  if (overall >= 2.3) return "forming";
  return "exploring";
}

export function readinessLabel(level: ReadinessLevel): string {
  switch (level) {
    case "build-ready":
      return "Ready to build";
    case "pilot-ready":
      return "Ready for a pilot";
    case "forming":
      return "Taking shape";
    default:
      return "Still exploring";
  }
}

const NEXT_STEP: Record<ReadinessKey, string> = {
  goal: "Write the goal as one sentence with a number in it, and name who will judge whether it worked.",
  data: "Pull a small sample of the real data and check it is usable and allowed before anything else.",
  people: "Name one owner with a few hours a week, and decide who will use the first version.",
  workflow: "Map the exact step where the AI output lands and who checks it before it counts.",
  governance: "List the privacy, security, and approval questions and find out who can answer each one.",
};

const SUMMARY: Record<ReadinessLevel, string> = {
  "build-ready": "The pieces are in place. A scoped first version is a reasonable next commitment.",
  "pilot-ready": "Strong enough to run a small pilot with a clear success test before spending more.",
  forming: "A real opportunity, with a few gaps that are cheaper to close before building.",
  exploring: "Early. The most useful move is a short advisory conversation, not a build.",
};

/** Computes the snapshot. Scores are clamped again here so a crafted input cannot break the card. */
export function assessReadiness(input: ReadinessInput): ReadinessSnapshot {
  const dimensions = READINESS_DIMENSIONS.map((d) => {
    const item = input[d.key];
    return {
      key: d.key,
      label: d.label,
      score: Math.max(SCORE_MIN, clampScore(item?.score)),
      note: (item?.note ?? "").trim().slice(0, 240),
    };
  });
  const mean = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
  const overall = Math.round(mean * 10) / 10;
  const percent = Math.round(((overall - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100);
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = sorted[0].key;
  const weakest = sorted[sorted.length - 1].key;
  const level = readinessLevel(overall);
  const context = input.context?.trim().slice(0, 400) || undefined;
  return {
    ...(context ? { context } : {}),
    overall,
    percent,
    level,
    label: readinessLabel(level),
    summary: SUMMARY[level],
    dimensions,
    strongest,
    weakest,
    nextStep: NEXT_STEP[weakest],
  };
}

/** Short text the model sees instead of the JSON card. */
export function readinessToText(snapshot: ReadinessSnapshot): string {
  const dims = snapshot.dimensions.map((d) => `${d.label} ${d.score}/5`).join(", ");
  return `Readiness snapshot shown to the visitor: ${snapshot.overall}/5 (${snapshot.label}). ${dims}. Weakest: ${labelFor(snapshot.weakest)}. Suggested next step: ${snapshot.nextStep}`;
}

export function labelFor(key: ReadinessKey): string {
  return READINESS_DIMENSIONS.find((d) => d.key === key)?.label ?? key;
}
