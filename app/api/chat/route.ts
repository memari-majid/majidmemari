import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  gateway,
  stepCountIs,
  streamText,
  type FinishReason,
  type InferUIMessageChunk,
  type SystemModelMessage,
  type UIMessageStreamWriter,
} from "ai";
import { z } from "zod";
import { chatSystemPrompt } from "@/lib/assistant";
import {
  CHARS_PER_TOKEN,
  MAX_BODY_CHARS,
  MAX_CHARS_PER_TEXT_PART,
  MAX_CHARS_TOTAL,
  MAX_MESSAGES,
  MAX_PARTS_PER_MESSAGE,
  MAX_TOOL_CHARS_TOTAL,
  STREAM_TIMEOUT_MS,
  prechargeEstimateUsd,
} from "@/lib/chat-limits";
import type { ChatMessageMetadata } from "@/lib/chat-metadata";
import {
  configuredDefaultModel,
  costUsd,
  fallbackModel,
  findModel,
  round6,
  tokenBreakdown,
  type ChatModel,
  type TokenBreakdown,
} from "@/lib/chat-models";
import { ASSISTANT_NAME } from "@/lib/chat-persona";
import { chatTools, type ChatUIMessage, type ToolContext } from "@/lib/chat-tools";
import { isEmailConfigured } from "@/lib/email";
import { getRateLimiter } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
/** Keep in step with STREAM_TIMEOUT_MS: the SDK aborts first so accounting completes. */
export const maxDuration = 180;

/**
 * Model and budget controls. The money knobs (per-IP and site-wide budgets,
 * rate limit, body caps) live in `lib/chat-limits.ts`; the model allowlist
 * and prices in `lib/chat-models.ts`. What stays here is per-route:
 *
 * - MAX_OUTPUT_TOKENS bounds one reply AND the reasoning that precedes it on
 *   thinking models, which is why it is not set to the size of an answer.
 *   Measured 2026-09-13: at 2,000, `google/gemini-3.8-flash` spent the whole
 *   budget reasoning on the bake-off's second turn and returned an empty
 *   reply. 2,500 matches the company site and leaves that headroom. A visitor
 *   who picks a thinking model gets no answer at all when this is too low.
 * - MAX_STEPS: a lookup plus a brief plus an estimate plus the reply, with
 *   one spare step. Ten tools make a longer loop possible, not desirable.
 * - ASSISTANT_TEXT_CAP: an echoed assistant reply cannot be longer than one
 *   full output, so anything past it is trimmed rather than 400ing the whole
 *   conversation (the visitor's own turns keep the tighter per-part cap).
 * - The default model comes from `AI_CHAT_MODEL`, validated against the
 *   allowlist once at module load; an unknown slug logs a warning and falls
 *   back to Opus 5 rather than silently changing the experience.
 *
 * One turn may be two model calls. A provider can end a stream after billing
 * real tokens and hand the route nothing to show, and a visitor must never be
 * left looking at an empty bubble, so a turn that delivers nothing at all is
 * recovered once on the fallback model. See "Empty turn recovery" below for
 * the rules, the wording and the accounting.
 */
const MAX_OUTPUT_TOKENS = 2_500;
const MAX_STEPS = 5;
const ASSISTANT_TEXT_CAP = MAX_OUTPUT_TOKENS * CHARS_PER_TOKEN;

const configured = configuredDefaultModel(process.env.AI_CHAT_MODEL);
if (configured.warning) console.warn(`[chat] ${configured.warning}`);
const DEFAULT_MODEL: ChatModel = configured.model;
const FALLBACK_MODEL: ChatModel = fallbackModel();

/**
 * Structural validation only: roles, part counts, and string types. The part
 * shapes that actually reach the model are rebuilt by `sanitizeMessages`
 * below, so nothing echoed by the client is forwarded verbatim. Only user and
 * assistant turns are accepted, so a client cannot inject system messages.
 * `z.object` on the body strips the transport's `id`, `trigger`, and
 * `messageId`; `model` is validated by `findModel`, never by `z.enum`, so an
 * unknown slug falls back instead of 400ing.
 */
const partSchema = z.looseObject({
  type: z.string().max(64),
});
const messageSchema = z.looseObject({
  id: z.string().max(128).optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(partSchema).max(MAX_PARTS_PER_MESSAGE),
});
const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  model: z.string().max(64).optional(),
});
type EchoedPart = z.infer<typeof partSchema>;
type EchoedMessage = z.infer<typeof messageSchema>;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Vercel sets `x-vercel-forwarded-for` and `x-real-ip` itself, so they are
 * read before the spoofable `x-forwarded-for`. Neither domain sits behind the
 * Cloudflare proxy today; if that ever flips, read `cf-connecting-ip` first.
 * Every non-Vercel request (local dev) lands in the shared "unknown" bucket.
 */
function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

const NEW_CHAT_MESSAGE = "This conversation is getting long. Start a new chat with the New button.";
const TOO_LONG_MESSAGE = "That message is too long. Please shorten it and send it again.";
const INVALID_MESSAGE = "Invalid request body.";
/** The mailbox is a real inbox; the contact form only logs until Resend is configured, so it comes second. */
const CONTACT_FALLBACK = `Please email ${SITE.email} or use the contact form instead.`;

/* ------------------------------------------------------------------------ */
/* Transcript whitelist                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Only the part shapes this widget can legitimately produce reach the model.
 * `convertToModelMessages` would otherwise forward an echoed `file` part as a
 * remote URL the provider fetches and tokenizes (a 100-page PDF costs real
 * money and is invisible to the precharge), `reasoning` parts verbatim, and
 * `providerMetadata` / `callProviderMetadata` as provider options. User turns
 * keep text only; assistant turns keep text, step boundaries, and tool parts
 * for tools in `chatTools`, rebuilt from known keys.
 *
 * An approval that can no longer complete is rewritten to `output-denied`
 * with a reason that tells the model what really happened. The SDK executes
 * an approval only in the final step of the last message, so:
 * - `approval-requested` anywhere (never answered): the stale reason.
 * - `approval-responded` with approved false outside the final step (the
 *   visitor tapped Not now, but the request carrying the decline did not
 *   complete before they typed again): the visitor's decline, never the
 *   stale reason.
 * - `approval-responded` with approved true outside the final step (approved,
 *   but the send never ran and the conversation moved on): approved, not sent.
 * Left alone, the SDK emits a tool call with no result and every later
 * request in the conversation fails with MissingToolResultsError until the
 * visitor taps New.
 */
const STALE_APPROVAL_REASON =
  "Not sent: this approval was not completed before the conversation moved on, so nothing went out. Offer the hand-off again only if the visitor still wants it.";
const DECLINED_APPROVAL_REASON =
  "Not sent: the visitor declined this hand-off on screen, so nothing went out. Do not offer it again unless they ask.";
const APPROVED_NOT_SENT_REASON =
  "Not sent: the visitor approved this hand-off, but the send did not run before the conversation moved on, so nothing went out. Offer to send it again if they still want it.";

type CleanPart = { type: string } & Record<string, unknown>;
type CleanMessage = { id: string; role: "user" | "assistant"; parts: CleanPart[] };
type Sanitized =
  | { ok: true; messages: CleanMessage[]; textChars: number; toolChars: number }
  | { ok: false; status: 400 | 413; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Serialized size of a tool input or output; what the model is billed for. */
function jsonLength(v: unknown): number {
  if (v === undefined) return 0;
  try {
    return JSON.stringify(v)?.length ?? 0;
  } catch {
    return 0;
  }
}

function approvalOf(part: EchoedPart): { id: string; approved: unknown; reason?: string } | undefined {
  const a = part.approval;
  if (!isRecord(a) || typeof a.id !== "string" || !a.id || a.id.length > 128) return undefined;
  return { id: a.id, approved: a.approved, ...(typeof a.reason === "string" ? { reason: a.reason.slice(0, 300) } : {}) };
}

/**
 * Rebuilds one echoed tool part from known keys only. Dropped on purpose:
 * `providerExecuted` (would make the SDK skip execution and trust an inlined
 * result), every provider metadata key, `preliminary`, `title`, and any tool
 * name outside `chatTools`. `finalStep` marks parts in the last step of the
 * last message, the only place an approval can still be acted on.
 */
function cleanToolPart(part: EchoedPart, finalStep: boolean): CleanPart | undefined {
  const toolName = part.type.slice("tool-".length);
  if (!Object.hasOwn(chatTools, toolName)) return undefined;
  const { toolCallId } = part;
  if (typeof toolCallId !== "string" || !toolCallId || toolCallId.length > 128) return undefined;
  const base = { type: part.type, toolCallId, input: part.input ?? {} };
  const approval = approvalOf(part);
  const denied = (reason: string): CleanPart | undefined =>
    approval ? { ...base, state: "output-denied", approval: { id: approval.id, approved: false, reason } } : undefined;

  switch (part.state) {
    case "output-available":
      return { ...base, state: "output-available", output: part.output };
    case "output-error":
      return {
        ...base,
        input: part.input ?? part.rawInput ?? {},
        state: "output-error",
        errorText: typeof part.errorText === "string" ? part.errorText.slice(0, 500) : "Tool call failed.",
      };
    case "output-denied":
      return approval
        ? {
            ...base,
            state: "output-denied",
            approval: { id: approval.id, approved: false, ...(approval.reason ? { reason: approval.reason } : {}) },
          }
        : undefined;
    case "approval-responded":
      if (!approval || typeof approval.approved !== "boolean") return undefined;
      if (!finalStep) {
        // The visitor's answer is the true story; the stale reason is only for
        // an approval nobody answered.
        return denied(approval.approved ? APPROVED_NOT_SENT_REASON : approval.reason || DECLINED_APPROVAL_REASON);
      }
      return {
        ...base,
        state: "approval-responded",
        approval: { id: approval.id, approved: approval.approved, ...(approval.reason ? { reason: approval.reason } : {}) },
      };
    case "approval-requested":
      return denied(STALE_APPROVAL_REASON);
    default:
      // input-streaming, input-available, or unknown: the call never completed.
      return undefined;
  }
}

function sanitizeMessages(messages: EchoedMessage[]): Sanitized {
  const out: CleanMessage[] = [];
  let textChars = 0;
  let toolChars = 0;

  for (let mi = 0; mi < messages.length; mi++) {
    const m = messages[mi];
    const isLast = mi === messages.length - 1;
    const lastStepStart =
      isLast && m.role === "assistant" ? m.parts.map((p) => p.type).lastIndexOf("step-start") : -1;
    const parts: CleanPart[] = [];

    for (let pi = 0; pi < m.parts.length; pi++) {
      const part = m.parts[pi];
      if (part.type === "text") {
        if (typeof part.text !== "string" || part.text.length === 0) continue;
        if (m.role === "user") {
          if (part.text.length > MAX_CHARS_PER_TEXT_PART) {
            return { ok: false, status: 413, error: TOO_LONG_MESSAGE };
          }
          parts.push({ type: "text", text: part.text });
          textChars += part.text.length;
        } else {
          const text = part.text.slice(0, ASSISTANT_TEXT_CAP);
          parts.push({ type: "text", text });
          textChars += text.length;
        }
        continue;
      }
      // User turns are text only: no files, no data parts.
      if (m.role !== "assistant") continue;
      if (part.type === "step-start") {
        parts.push({ type: "step-start" });
        continue;
      }
      if (part.type.startsWith("tool-")) {
        const clean = cleanToolPart(part, isLast && pi > lastStepStart);
        if (!clean) continue;
        toolChars += jsonLength(clean.input) + jsonLength(clean.output);
        parts.push(clean);
      }
      // file, reasoning, source-*, data-*, dynamic-tool: this widget never produces them; dropped.
    }

    if (parts.some((p) => p.type !== "step-start")) {
      out.push({ id: typeof m.id === "string" && m.id ? m.id : `m${mi}`, role: m.role, parts });
    }
  }

  if (out.length === 0) return { ok: false, status: 400, error: INVALID_MESSAGE };
  return { ok: true, messages: out, textChars, toolChars: trimToolPayloads(out, toolChars) };
}

/**
 * Keeps echoed tool payloads inside `MAX_TOOL_CHARS_TOTAL`.
 *
 * Only visible text is measured against `MAX_CHARS_TOTAL`, so without this
 * the ten tools are bounded by the raw body cap alone: a project estimate
 * input is about 3.5k characters, an outreach draft about 1.5k, and every one
 * of them is re-sent and re-charged on every later turn.
 *
 * Oldest first, and outputs before inputs. An output is a summary the model
 * has already read and acted on, so losing an old one costs little. An input
 * is what a card was rendered from and what `findBrief` recovers a brief
 * from, so inputs are only trimmed if dropping every old output was not
 * enough, and the newest turns survive either way.
 */
const TRIMMED_MARKER = {
  trimmed: "Removed to keep this conversation inside its size limit. Ask the visitor if you need it again.",
};

function trimToolPayloads(messages: CleanMessage[], toolChars: number): number {
  if (toolChars <= MAX_TOOL_CHARS_TOTAL) return toolChars;
  const markerLength = jsonLength(TRIMMED_MARKER);
  let total = toolChars;

  const sweep = (key: "output" | "input") => {
    for (const message of messages) {
      if (total <= MAX_TOOL_CHARS_TOTAL) return;
      // The final message carries the turn the model is answering right now.
      if (message === messages[messages.length - 1]) continue;
      for (const part of message.parts) {
        if (total <= MAX_TOOL_CHARS_TOTAL) return;
        if (!part.type.startsWith("tool-")) continue;
        const current = jsonLength(part[key]);
        if (current <= markerLength) continue;
        part[key] = TRIMMED_MARKER;
        total -= current - markerLength;
      }
    }
  };

  sweep("output");
  sweep("input");
  return total;
}

/* ------------------------------------------------------------------------ */
/* System prompt                                                             */
/* ------------------------------------------------------------------------ */

/**
 * The prompt lives in `lib/assistant.ts`, not here, because three callers
 * must render the same string: this route, the published bake-off, and the
 * live evaluation run. A result measured against a different prompt would be
 * a published lie.
 *
 * Rendered once per instance. `emailEnabled` reflects what this server can
 * actually do, so the assistant is never told it can send mail that cannot
 * leave the box.
 */
const EMAIL_ENABLED = isEmailConfigured();
const SYSTEM = chatSystemPrompt(EMAIL_ENABLED);

/** Sum of per-step costs; a step with no reported usage is charged at the precharge estimate, never free. */
function chargedUsd(
  steps: ReadonlyArray<{ usage: Parameters<typeof tokenBreakdown>[0] }>,
  model: ChatModel,
  estimateUsd: number,
): number {
  let total = 0;
  for (const step of steps) {
    const tokens = tokenBreakdown(step.usage);
    total += tokens.total > 0 ? costUsd(tokens, model) : estimateUsd;
  }
  return round6(total);
}

/** Anthropic prompt caching on the large, static system prompt. */
function systemFor(model: ChatModel): SystemModelMessage {
  return model.promptCache
    ? {
        role: "system",
        content: SYSTEM,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      }
    : { role: "system", content: SYSTEM };
}

const ZERO_TOKENS: TokenBreakdown = {
  input: 0,
  cacheRead: 0,
  cacheWrite: 0,
  output: 0,
  reasoning: 0,
  total: 0,
};

/**
 * Tokens across both calls of a recovered turn. A turn that cost two calls
 * shows what both of them cost, or the stats line would report a cost the
 * token counts under it cannot explain.
 */
function addTokens(a: TokenBreakdown, b: TokenBreakdown): TokenBreakdown {
  return {
    input: a.input + b.input,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
    output: a.output + b.output,
    reasoning: a.reasoning + b.reasoning,
    total: a.total + b.total,
  };
}

/* ------------------------------------------------------------------------ */
/* Empty turn recovery                                                       */
/* ------------------------------------------------------------------------ */

/**
 * A provider can end a stream having delivered nothing, and it bills the
 * tokens either way.
 *
 * Measured 2026-09-13 against this site's prompt: `google/gemini-3.8-flash`
 * could not answer a SECOND turn. Through `streamText` with one prior
 * assistant turn in `messages` it finished with `finishReason: "error"` after
 * 422 output tokens, 358 of them reasoning, and handed over zero characters.
 * It was reproduced on every attempt, and the company site's prompt on the
 * same model and the same SDK answered normally, so it is this prompt on this
 * model. Bisecting this site's prompt puts it in the tools paragraph, but the
 * root cause is the provider's and the fix is not to reword a prompt whose
 * hash is published in `evals/results/bakeoff-latest.json`.
 *
 * So the fix is here: a turn that hands the visitor nothing is run once more
 * on the fallback model, and the visitor is told which model failed and which
 * one answered. The rules, in order:
 *
 * - Delivered anything, retry nothing. Text, a tool card, an approval request
 *   or a data part all count. An approval request is the case that matters:
 *   it legitimately ends a turn with no text at all, and retrying it would ask
 *   the visitor to approve the same send twice.
 * - One retry, on the fallback model, never on the model that just failed.
 *   When the model that failed IS the fallback, a second call would be the
 *   same model failing again on the visitor's money, so the turn ends in the
 *   plain sentence below instead.
 * - Never an empty bubble. Every path writes a sentence.
 * - Both calls are charged. The first call really did spend the tokens the
 *   provider reported, so it tops up and is never settled downward, the same
 *   rule `/api/evals/run` follows for an abandoned run.
 * - One `chat.usage` line per model call, so `outcome: "no-reply"` can be
 *   counted per model in the Vercel logs.
 */
const EMPTY_TURN_NOTICE = (failed: ChatModel, answering: ChatModel): string =>
  `${failed.label} returned an error on this turn, so ${answering.label} took over.\n\n`;

const RETRY_ALSO_EMPTY = (answering: ChatModel): string =>
  `${answering.label} did not return anything either. ${CONTACT_FALLBACK}`;

const NOTHING_TO_RETRY_ON = (failed: ChatModel): string =>
  `${failed.label} returned an error on this turn, and it is the model this site falls back to, so there was nothing to retry on. Pick another model in the picker and send that again. ${CONTACT_FALLBACK}`;

/** Every call streams into one message: the route writes `start` and `finish` itself. */
const CALL_STREAM = { sendReasoning: false, sendStart: false, sendFinish: false } as const;

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = globalThis.crypto.randomUUID().slice(0, 8);
  const ip = clientIp(req);
  const limiter = getRateLimiter();

  const rate = await limiter.checkRate(ip);
  if (rate.limited) {
    return json(429, {
      error: "You're sending messages pretty fast. Give it a few seconds and try again.",
    });
  }

  let rawText: string;
  try {
    rawText = await req.text();
  } catch {
    return json(400, { error: INVALID_MESSAGE });
  }
  if (rawText.length > MAX_BODY_CHARS) return json(413, { error: NEW_CHAT_MESSAGE });

  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    return json(400, { error: INVALID_MESSAGE });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json(400, { error: INVALID_MESSAGE });

  const clean = sanitizeMessages(parsed.data.messages);
  if (!clean.ok) return json(clean.status, { error: clean.error });
  if (clean.textChars > MAX_CHARS_TOTAL) return json(413, { error: NEW_CHAT_MESSAGE });

  const requested = findModel(parsed.data.model);
  let model: ChatModel = requested ?? DEFAULT_MODEL;

  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;
  try {
    modelMessages = await convertToModelMessages(clean.messages as unknown as ChatUIMessage[], {
      tools: chatTools,
      // A transcript stopped mid tool call must not 400 the next request.
      ignoreIncompleteToolCalls: true,
    });
  } catch (err) {
    console.warn("[chat] convertToModelMessages rejected the transcript:", err);
    return json(400, { error: INVALID_MESSAGE });
  }

  // Reserve the estimated spend before the model runs; settle it afterwards.
  // Tool inputs (a brief is about 1.5k tokens) are echoed to the model on
  // every turn, so they count toward the estimate alongside visible text.
  const estimateUsd = prechargeEstimateUsd({
    model,
    systemChars: SYSTEM.length,
    conversationChars: clean.textChars + clean.toolChars,
  });
  const reservation = await limiter.reserveBudget(ip, estimateUsd);
  if (!reservation.ok) {
    console.warn(
      JSON.stringify({
        event: "chat.refused",
        site: "majidmemari",
        requestId,
        reason: reservation.reason,
        ipUsd: reservation.ipUsd,
        globalUsd: reservation.globalUsd,
        limiter: reservation.backend,
      }),
    );
    if (reservation.reason === "hard-budget") {
      return json(503, {
        error: `The ${ASSISTANT_NAME} has used up today's budget and is resting until tomorrow. ${CONTACT_FALLBACK}`,
      });
    }
    return json(429, {
      error: `This connection has used today's chat allowance. ${CONTACT_FALLBACK}`,
    });
  }

  let budgetFallback = false;
  if (reservation.fallback && model.outputPerM > FALLBACK_MODEL.outputPerM) {
    model = FALLBACK_MODEL;
    budgetFallback = true;
  }

  const turns = clean.messages.length;
  // Which limiter backend served the request stays in the server log only.
  const startMetadata: ChatMessageMetadata = {
    model: model.id,
    modelLabel: model.label,
    ...(requested && requested.id !== model.id ? { requestedModel: requested.id } : {}),
    ...(budgetFallback ? { budgetFallback: true } : {}),
  };

  /**
   * Request-level stats. A recovered turn is two model calls but one reply, so
   * the line under it describes the request the visitor made rather than
   * whichever call happened to answer.
   */
  let firstTokenAt: number | undefined;
  let stepCount = 0;
  let toolCallCount = 0;
  let charged = 0;
  /** Tokens from a call that delivered nothing, carried into the finish metadata. */
  let carriedTokens = ZERO_TOKENS;
  /**
   * What earlier calls in this request already hold against the reservation.
   * Zero on the first call, so its accounting is exactly what it always was;
   * a second call adds to it and can never bring it down.
   */
  let priorUsd = 0;
  /**
   * Model calls started against this request, and how many of them have been
   * reconciled against the reservation. The safety net at the end of `execute`
   * charges the estimate for any call that started and never reported, so a
   * throw between the two can never leave gateway spend off the books.
   */
  let callsStarted = 0;
  let callsReconciled = 0;
  /** The model of the most recent call, so the safety net logs the right one. */
  let lastCallModel: ChatModel = model;

  /** Day totals after this request, given what it ended up charging. */
  const dayTotals = (requestUsd: number) => ({
    ipUsd: round6(reservation.ipUsd - estimateUsd + requestUsd),
    globalUsd: round6(reservation.globalUsd - estimateUsd + requestUsd),
  });

  /**
   * One structured `chat.usage` line per model call, so usage can be graphed
   * from Vercel logs. A turn answered on the first call logs exactly one line,
   * as it always did; a recovered turn logs two, the first with
   * `outcome: "no-reply"` and the model that produced nothing.
   */
  const logUsage = (callModel: ChatModel, fields: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        event: "chat.usage",
        site: "majidmemari",
        requestId,
        model: callModel.id,
        requestedModel: requested?.id ?? null,
        budgetFallback,
        limiter: reservation.backend,
        turns,
        ttftMs: firstTokenAt != null ? firstTokenAt - startedAt : null,
        totalMs: Date.now() - startedAt,
        estimateUsd,
        ...fields,
      }),
    );
  };

  /** What one model call did, as the orchestration below needs to read it. */
  type Call = {
    /** Text characters that actually reached the visitor. */
    chars: number;
    /** Tool cards, approval requests and data parts that reached the visitor. */
    visibleParts: number;
    /** The visitor stopped the turn, or the stream timed out. `onAbort` has reconciled it. */
    aborted: boolean;
    finishReason: FinishReason;
    tokens: TokenBreakdown;
    /** What this call alone cost, at the prices in `lib/chat-models.ts`. */
    actualUsd: number;
    steps: number;
    toolCalls: number;
    tools: string[];
    /** Provider error text, held back until it is known whether this call is the answer. */
    errors: string[];
  };

  /** Prefixes a part id so a retry cannot reuse the failed call's part. */
  const withAttemptId = (
    chunk: InferUIMessageChunk<ChatUIMessage>,
    attempt: number,
  ): InferUIMessageChunk<ChatUIMessage> => {
    const id = (chunk as { id?: unknown }).id;
    return typeof id === "string"
      ? ({ ...chunk, id: `a${attempt}-${id}` } as InferUIMessageChunk<ChatUIMessage>)
      : chunk;
  };

  /** Anything at all on screen. An approval request counts: it is a turn with no text on purpose. */
  const delivered = (call: Call): boolean => call.chars > 0 || call.visibleParts > 0;

  const usageFields = (call: Call, requestUsd: number) => ({
    steps: call.steps,
    toolCalls: call.toolCalls,
    tools: call.tools,
    inputTokens: call.tokens.input,
    cacheReadTokens: call.tokens.cacheRead,
    cacheWriteTokens: call.tokens.cacheWrite,
    outputTokens: call.tokens.output,
    reasoningTokens: call.tokens.reasoning,
    totalTokens: call.tokens.total,
    replyChars: call.chars,
    costUsd: call.actualUsd,
    ...dayTotals(requestUsd),
    finishReason: call.finishReason,
  });

  /**
   * The one `finish` chunk of the turn. `model` is whoever actually answered
   * and, on a recovered turn, `requestedModel` is the model that failed, so
   * the stats line can say which was which without a second channel.
   */
  const finishChunk = (answering: ChatModel, call: Call, errorFallback: boolean) => {
    const tokens = addTokens(carriedTokens, call.tokens);
    const metadata: ChatMessageMetadata = {
      ...startMetadata,
      model: answering.id,
      modelLabel: answering.label,
      ...(errorFallback ? { requestedModel: model.id, errorFallback: true } : {}),
      ...(firstTokenAt != null ? { ttftMs: firstTokenAt - startedAt } : {}),
      totalMs: Date.now() - startedAt,
      tokens,
      costUsd: charged > 0 ? charged : costUsd(tokens, answering),
      steps: stepCount,
      toolCalls: toolCallCount,
      finishReason: call.finishReason,
    };
    return { type: "finish" as const, finishReason: call.finishReason, messageMetadata: metadata };
  };

  /** One plain sentence in the reply itself, so no path can end in an empty bubble. */
  let noticeCount = 0;
  const writeNotice = (writer: UIMessageStreamWriter<ChatUIMessage>, text: string) => {
    const id = `notice-${requestId}-${(noticeCount += 1)}`;
    writer.write({ type: "text-start", id });
    writer.write({ type: "text-delta", id, delta: text });
    writer.write({ type: "text-end", id });
  };

  /**
   * Provider error text is never streamed to visitors, so a call holds its
   * error chunks until it is known whether it is the answer. A call that put
   * something on screen flushes them, which is the alert line the widget has
   * always shown under a half-finished reply; a call that delivered nothing
   * drops them, because the sentence written in its place says more.
   */
  const flushErrors = (writer: UIMessageStreamWriter<ChatUIMessage>, call: Call) => {
    for (const errorText of call.errors) writer.write({ type: "error", errorText });
  };

  const runCall = async (
    writer: UIMessageStreamWriter<ChatUIMessage>,
    callModel: ChatModel,
    attempt: 1 | 2,
  ): Promise<Call> => {
    callsStarted += 1;
    lastCallModel = callModel;
    const context: ToolContext = { ip, model: callModel.id, requestId };
    const call: Call = {
      chars: 0,
      visibleParts: 0,
      aborted: false,
      // Nothing reported yet. A call whose `onFinish` never ran did not finish cleanly.
      finishReason: "error",
      tokens: ZERO_TOKENS,
      actualUsd: estimateUsd,
      steps: 0,
      toolCalls: 0,
      tools: [],
      errors: [],
    };

    const result = streamText({
      model: gateway(callModel.id),
      system: systemFor(callModel),
      messages: modelMessages,
      tools: chatTools,
      stopWhen: stepCountIs(MAX_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      timeout: { totalMs: STREAM_TIMEOUT_MS },
      experimental_context: context,
      providerOptions: {
        gateway: {
          tags: ["site:majidmemari", "feature:chat", `env:${process.env.VERCEL_ENV ?? "dev"}`],
        },
      },
      // Time to first token means the first visible text. Reasoning deltas,
      // tool-input deltas, and the pre-executed approval's tool result all
      // arrive earlier and would make the stat mean something else. It is not
      // reset by a retry: the visitor waited through both calls.
      onChunk: ({ chunk }) => {
        if (firstTokenAt == null && chunk.type === "text-delta") firstTokenAt = Date.now();
      },
      onStepFinish: ({ usage, toolCalls }) => {
        stepCount += 1;
        toolCallCount += toolCalls.length;
        const tokens = tokenBreakdown(usage);
        charged = round6(charged + (tokens.total > 0 ? costUsd(tokens, callModel) : estimateUsd));
      },
      // Records what this call cost; the reservation is reconciled by the
      // orchestration below, which is the only place that knows whether this
      // call is the answer or the one being retried.
      onFinish: ({ totalUsage, finishReason, steps }) => {
        if (call.aborted) return;
        call.finishReason = finishReason;
        call.tokens = tokenBreakdown(totalUsage);
        call.actualUsd = steps.length > 0 ? chargedUsd(steps, callModel, estimateUsd) : estimateUsd;
        call.steps = steps.length;
        call.toolCalls = steps.reduce((n, s) => n + s.toolCalls.length, 0);
        call.tools = steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
      },
      // The visitor stopped or the timeout fired: completed steps are real
      // spend and the interrupted step is charged at the estimate. Only top up,
      // and on a retry on top of whatever the first call already holds.
      onAbort: async ({ steps }) => {
        call.aborted = true;
        callsReconciled += 1;
        const stepsUsd = chargedUsd(steps, callModel, estimateUsd);
        const requestUsd = round6(priorUsd + stepsUsd + estimateUsd);
        await reservation.topUp(requestUsd);
        priorUsd = Math.max(priorUsd, requestUsd);
        logUsage(callModel, {
          outcome: "aborted",
          attempt,
          steps: steps.length,
          toolCalls: steps.reduce((n, s) => n + s.toolCalls.length, 0),
          tools: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
          replyChars: call.chars,
          costUsd: stepsUsd,
          ...dayTotals(Math.max(estimateUsd, requestUsd)),
          finishReason: "aborted",
        });
      },
    });

    for await (const chunk of result.toUIMessageStream<ChatUIMessage>({
      ...CALL_STREAM,
      // Never stream provider error text to visitors; log it and hold a plain
      // sentence in its place until the orchestration decides what to do.
      onError: (error) => {
        console.error("[chat] stream error:", { requestId, model: callModel.id, attempt, error });
        return `The ${ASSISTANT_NAME} is unavailable right now. ${CONTACT_FALLBACK}`;
      },
    })) {
      if (chunk.type === "error") {
        call.errors.push(chunk.errorText);
        continue;
      }
      if (chunk.type === "text-delta") call.chars += chunk.delta.length;
      else if (chunk.type.startsWith("tool-") || chunk.type.startsWith("data-")) {
        call.visibleParts += 1;
      }
      // Each call is its own `streamText`, and each numbers its text and
      // reasoning parts from zero. On a retry that means the second call
      // reopens `id: "0"`, the same part the failed call already opened in
      // this message, and the client merges two different calls into one part.
      // Attempt two therefore gets its own id namespace. Tool parts are keyed
      // by `toolCallId`, which the provider makes unique, and are left alone:
      // an approval round trip sends that id back and it has to match.
      writer.write(attempt === 1 ? chunk : withAttemptId(chunk, attempt));
    }
    // Resolves once the stream is done, which is where `onFinish` has run and
    // the numbers above are final. It rejects when the call threw rather than
    // ending in an error chunk, and the error is already logged above.
    try {
      await result.finishReason;
    } catch {
      call.finishReason = "error";
    }
    return call;
  };

  const stream = createUIMessageStream<ChatUIMessage>({
    // Anything thrown out of `execute`. The visitor gets a sentence, never a stack.
    onError: (error) => {
      console.error("[chat] turn failed:", { requestId, error });
      return `The ${ASSISTANT_NAME} is unavailable right now. ${CONTACT_FALLBACK}`;
    },
    execute: async ({ writer }) => {
      try {
        writer.write({ type: "start", messageMetadata: startMetadata });

        const first = await runCall(writer, model, 1);
        // The visitor's own stop: `onAbort` has reconciled and logged it, and
        // the SDK has already written the abort chunk that ends the message.
        if (first.aborted) return;

        if (delivered(first)) {
          callsReconciled += 1;
          priorUsd = first.actualUsd;
          await reservation.settle(first.actualUsd);
          logUsage(model, { outcome: "finished", attempt: 1, ...usageFields(first, priorUsd) });
          flushErrors(writer, first);
          writer.write(finishChunk(model, first, false));
          return;
        }

        // Nothing reached the visitor. The call still spent what the provider
        // reported, so it tops up and is never settled downward.
        callsReconciled += 1;
        await reservation.topUp(first.actualUsd);
        priorUsd = Math.max(estimateUsd, first.actualUsd);
        const retryModel = model.id === FALLBACK_MODEL.id ? undefined : FALLBACK_MODEL;
        logUsage(model, {
          outcome: "no-reply",
          attempt: 1,
          retryModel: retryModel?.id ?? null,
          ...usageFields(first, priorUsd),
        });

        if (!retryModel) {
          writeNotice(writer, NOTHING_TO_RETRY_ON(model));
          writer.write(finishChunk(model, first, false));
          return;
        }

        carriedTokens = addTokens(carriedTokens, first.tokens);
        writeNotice(writer, EMPTY_TURN_NOTICE(model, retryModel));

        const second = await runCall(writer, retryModel, 2);
        if (second.aborted) return;

        callsReconciled += 1;
        const requestUsd = round6(priorUsd + second.actualUsd);
        await reservation.topUp(requestUsd);
        priorUsd = Math.max(priorUsd, requestUsd);

        if (delivered(second)) {
          logUsage(retryModel, { outcome: "recovered", attempt: 2, ...usageFields(second, priorUsd) });
          flushErrors(writer, second);
        } else {
          logUsage(retryModel, {
            outcome: "no-reply",
            attempt: 2,
            retryModel: null,
            ...usageFields(second, priorUsd),
          });
          writeNotice(writer, RETRY_ALSO_EMPTY(retryModel));
        }
        writer.write(finishChunk(retryModel, second, true));
      } finally {
        // A throw anywhere above must not leave a call nobody reconciled. Every
        // call that started had its prompt handed to the gateway, so each one
        // still owed is charged at the estimate. Upward only, never a refund.
        const unreconciled = callsStarted - callsReconciled;
        if (unreconciled > 0) {
          callsReconciled = callsStarted;
          const requestUsd = round6(priorUsd + estimateUsd * unreconciled);
          await reservation.topUp(requestUsd);
          priorUsd = Math.max(estimateUsd, requestUsd);
          logUsage(lastCallModel, {
            outcome: "failed",
            attempt: callsStarted,
            steps: stepCount,
            toolCalls: toolCallCount,
            tools: [],
            replyChars: 0,
            costUsd: charged,
            ...dayTotals(priorUsd),
            finishReason: "error",
          });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
