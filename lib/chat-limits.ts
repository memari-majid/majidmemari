/**
 * Every owner-tunable number that bounds what the chat may cost or accept.
 * Budgets are in USD so cached input (a tenth of the price) and cheaper
 * picker models count for what they actually cost, not a flat token figure.
 *
 * Client-safe: constants and pure functions only.
 */

import { CACHE_READ_MULTIPLIER, type ChatModel } from "@/lib/chat-models";

/** Per-IP requests per rolling minute. */
export const RATE_LIMIT_PER_MINUTE = 20;

/**
 * Per-IP spend per UTC day. Raised from the 60k-token equivalent ($0.30 at
 * Opus input price) to $1.00 because cached reads count at a tenth and a
 * whole company behind one NAT shares the allowance.
 */
export const IP_DAILY_BUDGET_USD = 1.0;

/** Site-wide spend per UTC day beyond which replies route to the fallback model. */
export const GLOBAL_SOFT_BUDGET_USD = 3.0;

/** Site-wide spend per UTC day beyond which the chat politely closes for the day. */
export const GLOBAL_HARD_BUDGET_USD = 10.0;

/** Raw request text, before JSON parsing. Bounds echoed tool parts. */
export const MAX_BODY_CHARS = 60_000;

/** Visible text characters across the whole transcript. */
export const MAX_CHARS_TOTAL = 12_000;
export const MAX_CHARS_PER_TEXT_PART = 4_000;
export const MAX_MESSAGES = 40;
export const MAX_PARTS_PER_MESSAGE = 50;

/** The SDK aborts first so `onAbort` runs and accounting completes before the function is killed. */
export const STREAM_TIMEOUT_MS = 150_000;

/**
 * Upper bound on one Upstash REST round trip. A slow or hung store throws
 * after this and the limiter degrades to its in-memory fallback for that
 * call; without it undici waits up to 300 s, past the function's maxDuration,
 * and chat availability would depend on Upstash latency.
 */
export const LIMITER_TIMEOUT_MS = 1_500;

/** Function duration for the chat route (Fluid compute). */
export const MAX_DURATION_SECONDS = 180;

/** Output tokens assumed when reserving budget before the model runs. */
export const PRECHARGE_OUTPUT_TOKENS = 1_200;

/** Hand-off and other outbound emails started from chat, per IP per UTC day. */
export const EMAIL_PER_IP_PER_DAY = 3;
/** Outbound emails started from chat, site-wide per UTC day. */
export const EMAIL_SITE_PER_DAY = 40;

/** Rough chars-per-token used only for the precharge estimate. */
export const CHARS_PER_TOKEN = 4;

/**
 * What one request will probably cost, reserved before the model runs and
 * settled against actual usage afterwards. The system prompt is assumed to
 * be a cache read on models that support caching; conversation text is
 * charged at the full input price.
 */
export function prechargeEstimateUsd(args: {
  model: ChatModel;
  systemChars: number;
  conversationChars: number;
  outputTokens?: number;
}): number {
  const { model } = args;
  const systemTokens = Math.ceil(args.systemChars / CHARS_PER_TOKEN);
  const conversationTokens = Math.ceil(args.conversationChars / CHARS_PER_TOKEN);
  const systemRate = model.promptCache ? CACHE_READ_MULTIPLIER : 1;
  const inputUsd =
    (systemTokens * systemRate + conversationTokens) * (model.inputPerM / 1_000_000);
  const outputUsd = (args.outputTokens ?? PRECHARGE_OUTPUT_TOKENS) * (model.outputPerM / 1_000_000);
  return Math.round((inputUsd + outputUsd) * 1_000_000) / 1_000_000;
}
