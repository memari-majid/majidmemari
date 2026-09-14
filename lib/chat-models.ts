/**
 * The chat model, its public Vercel AI Gateway list prices, and the cost math
 * the route and the contact-form classifier share.
 *
 * One entry, on purpose (owner decision, 2026-09-13): the chat runs on Claude
 * Haiku 4.5 and nothing else. The allowlist shape is kept so `AI_CHAT_MODEL`
 * is still validated against it and a typo in the environment logs a warning
 * instead of silently changing the model.
 *
 * Client-safe: no React, no `process.env` reads at import time, and only
 * structural types (the route passes the SDK's `LanguageModelUsage`, which is
 * assignable to `UsageLike`).
 */

export type ChatModel = {
  /** Gateway slug, passed to `gateway(model.id)` as a plain string. The dot in `4.5` is the real slug. */
  id: string;
  /** Short human-readable name; the shape matches the company site's table. */
  label: string;
  vendor: "Anthropic" | "OpenAI" | "Google";
  /** USD per 1M input tokens (public gateway list price). */
  inputPerM: number;
  /** USD per 1M output tokens (public gateway list price). */
  outputPerM: number;
  /** USD per 1M prompt-cache read tokens, at the vendor's own discount. */
  cacheReadPerM: number;
  /** USD per 1M prompt-cache write tokens, at the vendor's own premium. */
  cacheWritePerM: number;
  /** Whether the route marks the system prompt for provider prompt caching. */
  promptCache: boolean;
};

/** Prices are the gateway's list prices as read on 2026-09-13. */
export const CHAT_MODELS: readonly ChatModel[] = [
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    vendor: "Anthropic",
    inputPerM: 1,
    outputPerM: 5,
    cacheReadPerM: 0.1,
    cacheWritePerM: 1.25,
    promptCache: true,
  },
] as const;

export const DEFAULT_MODEL_ID = "anthropic/claude-haiku-4.5";
/** The same model: with one entry there is nothing cheaper to fall back to, and the route treats that as a no-op. */
export const FALLBACK_MODEL_ID = "anthropic/claude-haiku-4.5";

export function findModel(id: unknown): ChatModel | undefined {
  if (typeof id !== "string") return undefined;
  const wanted = id.trim();
  return CHAT_MODELS.find((m) => m.id === wanted);
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

/** Structural view of the SDK's `LanguageModelUsage`, so callers can pass plain objects. */
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
  /** Reasoning tokens are a subset of `output`, logged for information. */
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

/**
 * Cost in USD for one breakdown on one model, each bucket at that model's own
 * price. The cache buckets read `cacheReadPerM` and `cacheWritePerM` rather
 * than a multiplier on the input price (nexus-website keeps the same shape).
 */
export function costUsd(tokens: TokenBreakdown, model: ChatModel): number {
  const inputUsd =
    (tokens.input * model.inputPerM +
      tokens.cacheRead * model.cacheReadPerM +
      tokens.cacheWrite * model.cacheWritePerM) /
    1_000_000;
  const outputUsd = tokens.output * (model.outputPerM / 1_000_000);
  return round6(inputUsd + outputUsd);
}

export function usageCostUsd(usage: UsageLike | undefined, model: ChatModel): number {
  return costUsd(tokenBreakdown(usage), model);
}

export function round6(v: number): number {
  return Math.round(v * 1_000_000) / 1_000_000;
}
