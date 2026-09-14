import {
  InvalidToolApprovalSignatureError,
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
import {
  MAX_SIGNATURE_CHARS,
  approvalSecret,
  verifyApproval,
  verifyDraft,
} from "@/lib/approval-signature";
import { chatSystemPrompt } from "@/lib/assistant";
import {
  CHARS_PER_TOKEN,
  MAX_BODY_CHARS,
  MAX_CHARS_PER_TEXT_PART,
  MAX_CHARS_TOTAL,
  MAX_MESSAGES,
  MAX_OUTPUT_TOKENS,
  MAX_PARTS_PER_MESSAGE,
  MAX_TOOL_CHARS_TOTAL,
  STREAM_TIMEOUT_MS,
  prechargeEstimateUsd,
} from "@/lib/chat-limits";
import {
  configuredDefaultModel,
  costUsd,
  fallbackModel,
  round6,
  tokenBreakdown,
  type ChatModel,
  type TokenBreakdown,
} from "@/lib/chat-models";
import { ASSISTANT_NAME } from "@/lib/chat-persona";
import { holdToolInputs } from "@/lib/chat-stream";
import { chatTools, type ChatToolName, type ChatUIMessage, type ToolContext } from "@/lib/chat-tools";
import { isEmailConfigured } from "@/lib/email";
import { gatewayProviderOptions } from "@/lib/gateway";
import { getRateLimiter } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
/** Keep in step with STREAM_TIMEOUT_MS: the SDK aborts first so accounting completes. */
export const maxDuration = 180;

/**
 * Model and budget controls. The money knobs (per-IP and site-wide budgets,
 * rate limit, body caps) and `MAX_OUTPUT_TOKENS`, which bounds one reply AND
 * the reasoning before it, live in `lib/chat-limits.ts`; the model allowlist
 * and prices in `lib/chat-models.ts`. What stays here is per-route:
 *
 * - MAX_STEPS: a lookup plus a brief plus an estimate plus the reply, with
 *   one spare step. Ten tools make a longer loop possible, not desirable.
 * - ASSISTANT_TEXT_CAP: an echoed assistant reply cannot be longer than one
 *   full output, so anything past it is trimmed rather than 400ing the whole
 *   conversation (the visitor's own turns keep the tighter per-part cap).
 * - The model comes from `AI_CHAT_MODEL`, validated against the allowlist
 *   once at module load; an unknown slug logs a warning and falls back to the
 *   allowlisted model rather than silently changing the experience. The
 *   client sends no model and any `model` field it does send is ignored
 *   (owner decision, 2026-09-13).
 *
 * One turn may be two model calls. A provider can end a stream after billing
 * real tokens and hand the route nothing to show, and a visitor must never be
 * left looking at an empty bubble, so a turn that delivers nothing at all is
 * recovered once on the fallback model. See "Empty turn recovery" below for
 * the rules, the wording and the accounting.
 */
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
 * `z.object` on the body strips the transport's `id`, `trigger`, `messageId`
 * and any `model` a client still sends: the route picks the model.
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
/**
 * A transcript that ends with an assistant message and carries no approval
 * to execute has nothing for the model to do. Sending it anyway asks the
 * provider to continue its own last message, which Anthropic models refuse
 * with a 400 for assistant prefill, and the turn would still be charged.
 * Measured 2026-09-13 when the Retry button re-posted such a transcript.
 */
const NOTHING_TO_ANSWER_MESSAGE =
  "There is nothing to send: the conversation is waiting on you. Type a message, or start a new chat with the New button.";
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
 *
 * Two signature checks run here as well, because the transcript is the
 * client's. An `approval-responded` part is only as trustworthy as the
 * request it answers, and before this a part for a call the model never made,
 * with a self-chosen id and input, executed the send tool (kept inert only by
 * email being unconfigured). Now `streamText` signs every approval request it
 * emits (`experimental_toolApprovalSecret`, HMAC over the approval id, the
 * tool call id, the tool name and a digest of the input), the widget echoes
 * the signature back, and an approved part whose signature is missing or
 * wrong becomes `output-denied` with `FORGED_APPROVAL_REASON` before any
 * budget is reserved. The draft tools sign their own input into their output
 * (`lib/chat-tools.ts`), and a draft part whose output does not verify is
 * dropped, so `findBrief` and `findReadiness` can only hand a send tool a
 * draft this server saw the model write. Same module, same checks, on the
 * company site (`lib/approval-signature.ts` in both repos).
 */
const STALE_APPROVAL_REASON =
  "Not sent: this approval was not completed before the conversation moved on, so nothing went out. Offer the hand-off again only if the visitor still wants it.";
/**
 * Also handed to the SDK as the reason on a decline answered in the final
 * step, where the SDK otherwise reports a bare "execution denied" and the
 * model fills the gap itself (measured: "both requests sit in the server log"
 * and a chip inviting a retry of the declined note).
 */
const DECLINED_APPROVAL_REASON =
  "Not sent: the visitor declined this send on screen, so nothing went out and nothing was recorded anywhere. Do not offer it again unless they ask, and do not suggest a chip that retries it.";
const APPROVED_NOT_SENT_REASON =
  "Not sent: the visitor approved this hand-off, but the send did not run before the conversation moved on, so nothing went out. Offer to send it again if they still want it.";
const FORGED_APPROVAL_REASON =
  "Not sent: that approval could not be verified against a request this assistant made, so nothing went out. Do not call this tool again unless the visitor asks, and point them to the contact form at /contact.";

/**
 * The signing secret, resolved once per instance like the prompt. Always set:
 * the environment, else a key derived from the Resend key, else a random
 * per-instance key with one warning (`lib/approval-signature.ts`).
 */
const APPROVAL_SECRET = approvalSecret();

/** Tools whose input a send tool re-reads from history; their output carries a signature over it. */
const DRAFT_TOOL_NAMES: ReadonlySet<ChatToolName> = new Set<ChatToolName>([
  "draftConsultingBrief",
  "assessReadiness",
  "draftOutreachNote",
]);

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

function approvalOf(
  part: EchoedPart,
): { id: string; approved: unknown; reason?: string; signature?: string } | undefined {
  const a = part.approval;
  if (!isRecord(a) || typeof a.id !== "string" || !a.id || a.id.length > 128) return undefined;
  return {
    id: a.id,
    approved: a.approved,
    ...(typeof a.reason === "string" ? { reason: a.reason.slice(0, 300) } : {}),
    // The SDK's HMAC over the request it issued; verified before an approved call may run.
    ...(typeof a.signature === "string" && a.signature.length <= MAX_SIGNATURE_CHARS
      ? { signature: a.signature }
      : {}),
  };
}

/** The signature a draft tool wrote into its own output, if the echoed output still carries one. */
function draftSignatureOf(output: unknown): unknown {
  return isRecord(output) ? output.signature : undefined;
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
      // A draft the send tools may re-read from history is kept only when the
      // signature its tool wrote into the output still matches the input.
      if (
        DRAFT_TOOL_NAMES.has(toolName as ChatToolName) &&
        !verifyDraft({
          secret: APPROVAL_SECRET,
          toolCallId,
          toolName,
          input: base.input,
          signature: draftSignatureOf(part.output),
        })
      ) {
        return undefined;
      }
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
      if (!approval.approved) {
        // A decline executes nothing, so it needs no signature; it does need a
        // reason the model can act on, or the SDK reports a bare denial.
        return {
          ...base,
          state: "approval-responded",
          approval: { id: approval.id, approved: false, reason: approval.reason || DECLINED_APPROVAL_REASON },
        };
      }
      // The only place a send can still run, so the only place a forged part
      // could get one executed. Verified here, with a reason, rather than left
      // to the SDK's throw, so a forged request costs one ordinary turn and
      // never a stream error. It stays `approval-responded`, turned into a
      // decline, rather than becoming `output-denied`: the SDK then runs its
      // own denial path, which emits `tool-output-denied` to the client and
      // moves the card off "Sending now", so a legitimate approval that could
      // not be verified (a transcript from before this deploy, or a
      // per-instance key on another instance) settles on screen instead of
      // stalling with a Retry that would fail the same way.
      if (
        !verifyApproval({
          secret: APPROVAL_SECRET,
          approvalId: approval.id,
          toolCallId,
          toolName,
          input: base.input,
          signature: approval.signature,
        })
      ) {
        return {
          ...base,
          state: "approval-responded",
          approval: { id: approval.id, approved: false, reason: FORGED_APPROVAL_REASON },
        };
      }
      return {
        ...base,
        state: "approval-responded",
        approval: { id: approval.id, approved: true, signature: approval.signature },
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
 * True when the transcript ends with an assistant message that carries no
 * approval to execute, which is a request the model cannot answer: the
 * approval continuation is the one legitimate shape that ends in an assistant
 * turn, and it always carries an `approval-responded` part in its final step.
 */
function nothingToAnswer(messages: CleanMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return false;
  const lastStepStart = last.parts.map((p) => p.type).lastIndexOf("step-start");
  return !last.parts.some((p, i) => i > lastStepStart && p.state === "approval-responded");
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
 * The prompt lives in `lib/assistant.ts`, not here, so it is data the route
 * renders rather than a string buried in a handler.
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
 * same model and the same SDK answered normally, so it was this prompt on
 * that model. The root cause was the provider's, and the fix is here rather
 * than in the prompt: a turn that hands the visitor nothing is run once more
 * on the fallback model, and the visitor is told, without naming a model,
 * that it was tried again. The rules, in order:
 *
 * - Delivered anything, retry nothing. Text, a tool card, an approval request
 *   or a data part all count. An approval request is the case that matters:
 *   it legitimately ends a turn with no text at all, and retrying it would ask
 *   the visitor to approve the same send twice.
 * - One retry, on the fallback model, never on the model that just failed.
 *   When the model that failed IS the fallback, a second call would be the
 *   same model failing again on the visitor's money, so the turn ends in the
 *   plain sentence below instead. With one model on the allowlist that is
 *   every case today; the retry path stays so a second model can be added
 *   back without touching the route.
 * - Never an empty bubble. Every path writes a sentence.
 * - Both calls are charged. The first call really did spend the tokens the
 *   provider reported, so it tops up and is never settled downward.
 * - One `chat.usage` line per model call, so `outcome: "no-reply"` can be
 *   counted per model in the Vercel logs.
 */
/* Visitor-facing sentences. None of them names a model: which model ran is the server log's business. */
const EMPTY_TURN_NOTICE = "The first attempt at this reply returned an error, so it was tried once more.\n\n";

const RETRY_ALSO_EMPTY = `The second attempt did not return anything either. ${CONTACT_FALLBACK}`;

const NOTHING_TO_RETRY_ON = `Sorry, this reply ran into an error and nothing came back. Send it once more. If it happens again, ${CONTACT_FALLBACK}`;

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
  // Nothing is reserved and nothing is called for a transcript the model
  // cannot continue; the widget shows this sentence in place of a reply.
  if (nothingToAnswer(clean.messages)) return json(400, { error: NOTHING_TO_ANSWER_MESSAGE });

  let model: ChatModel = DEFAULT_MODEL;

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

  /**
   * Request-level figures, for the server log only. A recovered turn is two
   * model calls but one reply, so time to first token describes the request
   * the visitor made rather than whichever call happened to answer.
   */
  let firstTokenAt: number | undefined;
  let stepCount = 0;
  let toolCallCount = 0;
  let charged = 0;
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
        // The client can no longer ask for a model; the key stays so the line's shape does not change.
        requestedModel: null,
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
    /**
     * The SDK refused an approved send whose signature did not verify. The
     * sanitizer denies those first, so this only fires if the two checks ever
     * disagree; either way the same transcript would fail again, so no retry.
     */
    rejectedApproval: boolean;
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
   * The one `finish` chunk of the turn. It carries no metadata: the model,
   * timing, tokens and cost of a reply stay in the `chat.usage` log line and
   * never reach the client.
   */
  const finishChunk = (call: Call) => ({ type: "finish" as const, finishReason: call.finishReason });

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
      rejectedApproval: false,
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
      // The visitor's Stop, or the tab closing, ends the gateway call as well
      // as the response. Without this the call ran to completion after the
      // visitor left and the whole reply was charged (measured: 2,049 output
      // tokens billed for a turn stopped at 208 characters), and `onAbort`
      // below only ever fired on the 150 s timeout.
      abortSignal: req.signal,
      experimental_context: context,
      // Signs every approval request this call emits; the sanitizer above and
      // the SDK both verify the signature when the approval comes back.
      experimental_toolApprovalSecret: APPROVAL_SECRET,
      providerOptions: gatewayProviderOptions("chat", callModel),
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

    // Each call is its own `streamText`, and each numbers its text and
    // reasoning parts from zero. On a retry that means the second call
    // reopens `id: "0"`, the same part the failed call already opened in
    // this message, and the client merges two different calls into one part.
    // Attempt two therefore gets its own id namespace. Tool parts are keyed
    // by `toolCallId`, which the provider makes unique, and are left alone:
    // an approval round trip sends that id back and it has to match.
    //
    // A tool input is held until it has parsed (`lib/chat-stream.ts`): the
    // visitor sees the call that landed, never the model's own failed
    // attempts at the JSON, which the SDK already feeds back for a retry.
    const outbound = holdToolInputs<ChatUIMessage>(
      (chunk) => {
        if (chunk.type === "text-delta") call.chars += chunk.delta.length;
        else if (chunk.type.startsWith("tool-") || chunk.type.startsWith("data-")) {
          call.visibleParts += 1;
        }
        writer.write(attempt === 1 ? chunk : withAttemptId(chunk, attempt));
      },
      (dropped) => {
        console.warn("[chat] tool input did not parse; the model retries and the visitor sees only the call that parsed:", {
          requestId,
          model: callModel.id,
          toolName: dropped.toolName,
          errorText: dropped.errorText.slice(0, 200),
        });
      },
    );

    for await (const chunk of result.toUIMessageStream<ChatUIMessage>({
      ...CALL_STREAM,
      // Never stream provider error text to visitors; log it and hold a plain
      // sentence in its place until the orchestration decides what to do.
      onError: (error) => {
        if (InvalidToolApprovalSignatureError.isInstance(error)) {
          call.rejectedApproval = true;
          console.warn("[chat] approval signature rejected by the SDK:", { requestId, model: callModel.id, attempt, message: error.message });
          return "That approval could not be verified as one this server issued, so nothing was sent. Start a new chat if you still want to send it.";
        }
        console.error("[chat] stream error:", { requestId, model: callModel.id, attempt, error });
        return `The ${ASSISTANT_NAME} is unavailable right now. ${CONTACT_FALLBACK}`;
      },
    })) {
      if (chunk.type === "error") {
        call.errors.push(chunk.errorText);
        continue;
      }
      outbound.push(chunk);
    }
    outbound.flush();
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
    // The echoed transcript, so the SDK stamps the reply with the id of the
    // assistant message it continues. On an approval continuation the client
    // reuses its last assistant message as the streaming state; a reply that
    // arrived under a fresh id was appended as a second copy of that message,
    // with the original card left in `approval-responded` and offering Retry
    // (measured 2026-09-13). With the id matched the card moves to its
    // outcome in place. A transcript ending in a user turn has no id to reuse
    // and streams exactly as before.
    originalMessages: clean.messages as unknown as ChatUIMessage[],
    // Anything thrown out of `execute`. The visitor gets a sentence, never a stack.
    onError: (error) => {
      console.error("[chat] turn failed:", { requestId, error });
      return `The ${ASSISTANT_NAME} is unavailable right now. ${CONTACT_FALLBACK}`;
    },
    execute: async ({ writer }) => {
      try {
        writer.write({ type: "start" });

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
          writer.write(finishChunk(first));
          return;
        }

        // Nothing reached the visitor. The call still spent what the provider
        // reported, so it tops up and is never settled downward.
        callsReconciled += 1;
        await reservation.topUp(first.actualUsd);
        priorUsd = Math.max(estimateUsd, first.actualUsd);
        // A rejected approval fails the same way on any model: no retry.
        const retryModel =
          model.id === FALLBACK_MODEL.id || first.rejectedApproval ? undefined : FALLBACK_MODEL;
        logUsage(model, {
          outcome: "no-reply",
          attempt: 1,
          retryModel: retryModel?.id ?? null,
          ...(first.rejectedApproval ? { reason: "rejected-approval" } : {}),
          ...usageFields(first, priorUsd),
        });

        if (first.rejectedApproval) {
          // The sentence the SDK's error was replaced with is the whole answer.
          flushErrors(writer, first);
          writer.write(finishChunk(first));
          return;
        }

        if (!retryModel) {
          writeNotice(writer, NOTHING_TO_RETRY_ON);
          writer.write(finishChunk(first));
          return;
        }

        writeNotice(writer, EMPTY_TURN_NOTICE);

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
          writeNotice(writer, RETRY_ALSO_EMPTY);
        }
        writer.write(finishChunk(second));
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
