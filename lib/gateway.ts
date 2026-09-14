/**
 * Provider options for every gateway call this site makes.
 *
 * Two things ride on it. The tags, which every route already sent, so gateway
 * spend can be filtered by site and feature. And the provider order for
 * Anthropic models, which is load-bearing for cost.
 *
 * Measured 2026-09-13 on this site, on Claude Opus 5 before the chat moved to
 * Haiku 4.5: with no order set, the gateway resolved the model to
 * `vertexAnthropic` and three sequential calls
 * five seconds apart, each with the same `cacheControl` system message, all
 * came back as a full cache write (4,713 tokens written, 0 read). Through the
 * chat route that showed as 9 of 34 Opus requests in one session paying the
 * 10,835-token write instead of the read, five times the price of a warm
 * turn. With `order: ["anthropic"]` the same three calls read the cache from
 * the second one on. Anthropic direct keeps one cache; the Vertex route does
 * not reliably serve one back. The other providers stay as fallbacks, so
 * availability is unchanged: only the first choice moves.
 *
 * Server-only: reads `VERCEL_ENV` per call.
 */

import type { ChatModel } from "@/lib/chat-models";

export type GatewayFeature = "chat" | "contact-classify";

/** First choice per vendor. Only Anthropic needs one; the rest keep the gateway's own order. */
const PROVIDER_ORDER: Partial<Record<ChatModel["vendor"], readonly string[]>> = {
  Anthropic: ["anthropic"],
};

/**
 * The `providerOptions.gateway` block for one call. `model` is optional
 * because the contact classifier is not an allowlisted chat model and has no
 * vendor; it then gets tags only.
 */
export function gatewayProviderOptions(feature: GatewayFeature, model?: ChatModel) {
  const order = model ? PROVIDER_ORDER[model.vendor] : undefined;
  return {
    gateway: {
      tags: ["site:majidmemari", `feature:${feature}`, `env:${process.env.VERCEL_ENV ?? "dev"}`],
      ...(order ? { order: [...order] } : {}),
    },
  };
}
