/**
 * Per-reply stats the route attaches as UI message metadata and the widget
 * renders under each assistant reply (model, time to first token, total time,
 * tokens, cost). The schema doubles as `messageMetadataSchema` for `useChat`.
 * Which limiter backend served the request stays in the server log only: it
 * would tell a prober whether the budgets are durable or per instance.
 *
 * Client-safe: zod only.
 */

import { z } from "zod";
import { findModel, formatUsd } from "@/lib/chat-models";

export const chatTokenStatsSchema = z.object({
  input: z.number(),
  cacheRead: z.number(),
  cacheWrite: z.number(),
  output: z.number(),
  reasoning: z.number(),
  total: z.number(),
});

export const chatMessageMetadataSchema = z.object({
  /** Gateway slug that actually produced the reply. */
  model: z.string().optional(),
  modelLabel: z.string().optional(),
  /** What the visitor picked, when it differs from `model`. */
  requestedModel: z.string().optional(),
  /** True when the global soft budget routed this reply to the fallback model. */
  budgetFallback: z.boolean().optional(),
  /**
   * True when the model the visitor picked ended its turn without delivering
   * anything and the fallback model answered instead. `requestedModel` names
   * the model that failed, `model` the one that answered.
   */
  errorFallback: z.boolean().optional(),
  /** Milliseconds from request start to the first streamed token. */
  ttftMs: z.number().optional(),
  /** Milliseconds from request start to the end of the last step. */
  totalMs: z.number().optional(),
  tokens: chatTokenStatsSchema.optional(),
  costUsd: z.number().optional(),
  steps: z.number().optional(),
  toolCalls: z.number().optional(),
  finishReason: z.string().optional(),
});

export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;
export type ChatTokenStats = z.infer<typeof chatTokenStatsSchema>;

export function formatMs(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function formatTokens(v: number | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return v.toLocaleString("en-US");
}

/** Compact one-line summary: model, first token, total, tokens, cost. */
export function formatStatsLine(meta: ChatMessageMetadata | undefined): string {
  if (!meta) return "";
  const label = meta.modelLabel ?? findModel(meta.model)?.label ?? meta.model ?? "";
  const parts = [label];
  if (meta.ttftMs != null) parts.push(`first token ${formatMs(meta.ttftMs)}`);
  if (meta.totalMs != null) parts.push(`total ${formatMs(meta.totalMs)}`);
  if (meta.tokens) parts.push(`${formatTokens(meta.tokens.total)} tokens`);
  if (meta.costUsd != null) parts.push(formatUsd(meta.costUsd));
  if (meta.budgetFallback) parts.push("budget fallback");
  if (meta.errorFallback) parts.push("error fallback");
  return parts.filter(Boolean).join(" · ");
}
