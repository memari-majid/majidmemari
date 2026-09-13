/**
 * Visitor-selectable chat models, their public Vercel AI Gateway list prices,
 * and the cost math the route, the widget, and the evals all share.
 *
 * Client-safe: no React, no `process.env` reads at import time, and only
 * structural types (the route passes the SDK's `LanguageModelUsage`, which is
 * assignable to `UsageLike`).
 */

export type ChatModel = {
  /** Gateway slug, passed to `gateway(model.id)` as a plain string. */
  id: string;
  /** Short label for the picker and the per-reply stats row. */
  label: string;
  vendor: "Anthropic" | "OpenAI" | "Google";
  /** USD per 1M input tokens (public gateway list price). */
  inputPerM: number;
  /** USD per 1M output tokens (public gateway list price). */
  outputPerM: number;
  /** Whether the route marks the system prompt for provider prompt caching. */
  promptCache: boolean;
  /** One line for the picker tooltip and the how-it-works page. */
  note: string;
};

/** Prices read from the gateway model list on this date. */
export const PRICES_AS_OF = "2026-09-12";

export const CHAT_MODELS: readonly ChatModel[] = [
  {
    id: "anthropic/claude-opus-5",
    label: "Claude Opus 5",
    vendor: "Anthropic",
    inputPerM: 5,
    outputPerM: 25,
    promptCache: true,
    note: "Default. Best judgement on open-ended consulting questions.",
  },
  {
    id: "anthropic/claude-sonnet-5",
    label: "Claude Sonnet 5",
    vendor: "Anthropic",
    inputPerM: 2,
    outputPerM: 10,
    promptCache: true,
    note: "Budget fallback. Fast and close to Opus on most conversations.",
  },
  {
    id: "openai/gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    vendor: "OpenAI",
    inputPerM: 2,
    outputPerM: 10,
    promptCache: false,
    note: "OpenAI's current general model, for comparison.",
  },
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    vendor: "Google",
    inputPerM: 0.75,
    outputPerM: 3.75,
    promptCache: false,
    note: "Cheapest and fastest. Good for a quick second opinion.",
  },
] as const;

export const DEFAULT_MODEL_ID = "anthropic/claude-opus-5";
export const FALLBACK_MODEL_ID = "anthropic/claude-sonnet-5";

/** Cached input tokens are billed at a tenth of the input price. */
export const CACHE_READ_MULTIPLIER = 0.1;
/** Writing a prompt cache entry costs a quarter more than a plain input token. */
export const CACHE_WRITE_MULTIPLIER = 1.25;

export function findModel(id: unknown): ChatModel | undefined {
  if (typeof id !== "string") return undefined;
  const wanted = id.trim();
  return CHAT_MODELS.find((m) => m.id === wanted);
}

/**
 * Picks the visitor's model when it is on the allowlist and falls back to the
 * given default otherwise. Never throws, never trusts the string as a slug.
 */
export function resolveModel(id: unknown, fallback: ChatModel = defaultModel()): ChatModel {
  return findModel(id) ?? fallback;
}

export function defaultModel(): ChatModel {
  return findModel(DEFAULT_MODEL_ID) ?? CHAT_MODELS[0];
}

export function fallbackModel(): ChatModel {
  return findModel(FALLBACK_MODEL_ID) ?? defaultModel();
}

/**
 * Resolves the owner-configured default (`AI_CHAT_MODEL`). The route calls
 * this once at module load and logs the warning, so a typo in the env var is
 * visible in the logs instead of silently changing the model.
 */
export function configuredDefaultModel(envValue: string | undefined): {
  model: ChatModel;
  warning?: string;
} {
  const raw = envValue?.trim();
  if (!raw) return { model: defaultModel() };
  const model = findModel(raw);
  if (model) return { model };
  return {
    model: defaultModel(),
    warning: `AI_CHAT_MODEL="${raw}" is not on the chat model allowlist; using ${DEFAULT_MODEL_ID}. Allowed: ${CHAT_MODELS.map((m) => m.id).join(", ")}.`,
  };
}

/** Structural view of the SDK's `LanguageModelUsage`, so client code can pass plain objects. */
export type UsageLike = {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
  inputTokenDetails?: {
    noCacheTokens?: number | undefined;
    cacheReadTokens?: number | undefined;
    cacheWriteTokens?: number | undefined;
  };
  outputTokenDetails?: {
    textTokens?: number | undefined;
    reasoningTokens?: number | undefined;
  };
  /** Deprecated alias kept as a fallback. */
  cachedInputTokens?: number | undefined;
  /** Deprecated alias kept as a fallback. */
  reasoningTokens?: number | undefined;
};

export type TokenBreakdown = {
  /** Uncached input tokens, billed at the full input price. */
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
  /** Reasoning tokens are a subset of `output`, shown for information. */
  reasoning: number;
  total: number;
};

const n = (v: number | undefined | null): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;

/**
 * Normalises a usage object into billable buckets. Prefers the detailed
 * fields; when `noCacheTokens` is missing it assumes `inputTokens` is the
 * provider total and subtracts the cached buckets, which is the V3 contract.
 */
export function tokenBreakdown(usage: UsageLike | undefined): TokenBreakdown {
  if (!usage) return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, total: 0 };
  const details = usage.inputTokenDetails;
  const cacheRead = n(details?.cacheReadTokens ?? usage.cachedInputTokens);
  const cacheWrite = n(details?.cacheWriteTokens);
  const rawInput = n(usage.inputTokens);
  const input =
    details?.noCacheTokens != null
      ? n(details.noCacheTokens)
      : Math.max(0, rawInput - cacheRead - cacheWrite);
  const output = n(usage.outputTokens);
  const reasoning = n(usage.outputTokenDetails?.reasoningTokens ?? usage.reasoningTokens);
  const total = n(usage.totalTokens) || input + cacheRead + cacheWrite + output;
  return { input, cacheRead, cacheWrite, output, reasoning, total };
}

/** Cost in USD for one breakdown on one model. */
export function costUsd(tokens: TokenBreakdown, model: ChatModel): number {
  const inputUsd =
    (tokens.input +
      tokens.cacheRead * CACHE_READ_MULTIPLIER +
      tokens.cacheWrite * CACHE_WRITE_MULTIPLIER) *
    (model.inputPerM / 1_000_000);
  const outputUsd = tokens.output * (model.outputPerM / 1_000_000);
  return round6(inputUsd + outputUsd);
}

export function usageCostUsd(usage: UsageLike | undefined, model: ChatModel): number {
  return costUsd(tokenBreakdown(usage), model);
}

export function round6(v: number): number {
  return Math.round(v * 1_000_000) / 1_000_000;
}

/** "$0.0312" style, with enough digits that a cheap reply is not shown as $0.00. */
export function formatUsd(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "$0.00";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(2)}`;
}
