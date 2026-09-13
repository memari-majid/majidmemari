import {
  convertToModelMessages,
  gateway,
  stepCountIs,
  streamText,
  type SystemModelMessage,
} from "ai";
import { z } from "zod";
import {
  CHARS_PER_TOKEN,
  MAX_BODY_CHARS,
  MAX_CHARS_PER_TEXT_PART,
  MAX_CHARS_TOTAL,
  MAX_MESSAGES,
  MAX_PARTS_PER_MESSAGE,
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
} from "@/lib/chat-models";
import { chatTools, type ChatUIMessage, type ToolContext } from "@/lib/chat-tools";
import { MAJID } from "@/lib/majid";
import { plainPunctuation } from "@/lib/plain-punctuation";
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
 * - MAX_OUTPUT_TOKENS bounds one reply (and the reasoning that precedes it
 *   on thinking models).
 * - MAX_STEPS: a brief plus a snapshot plus the reply, with one spare step.
 * - ASSISTANT_TEXT_CAP: an echoed assistant reply cannot be longer than one
 *   full output, so anything past it is trimmed rather than 400ing the whole
 *   conversation (the visitor's own turns keep the tighter per-part cap).
 * - The default model comes from `AI_CHAT_MODEL`, validated against the
 *   allowlist once at module load; an unknown slug logs a warning and falls
 *   back to Opus 5 rather than silently changing the experience.
 */
const MAX_OUTPUT_TOKENS = 2_000;
const MAX_STEPS = 4;
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
  return { ok: true, messages: out, textChars, toolChars };
}

/* ------------------------------------------------------------------------ */
/* System prompt                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Follow-up chips the prompt asks the model to append. Defined here because
 * the personal site has no chips lib; the widget only parses the marker.
 * Each chip is under seven words and 42 characters (the widget's chip cap).
 */
const SUGGESTION_MARKER = "SUGGESTIONS:";
const chipLine = (chips: readonly string[]) => chips.join(" | ");
const DISCOVERY_CHIPS = ["We're exploring where AI fits", "We have a project in mind", "We want to train our team"];
const AFTER_ADVICE_CHIPS = ["What would you do first?", "Is this worth building?", "Would training help my team?"];
const READY_CHIPS = ["Draft a consulting brief", "Rate our AI readiness", "Have Majid follow up"];
const AFTER_BRIEF_CHIPS = ["Send it to Majid", "Rate our AI readiness", "Something in the brief is off"];
const AFTER_SNAPSHOT_CHIPS = ["Draft a consulting brief", "What should we fix first?", "Have Majid follow up"];
const AFTER_HANDOFF_CHIPS = ["What should we prepare?", "How does consulting work?", "What does NVIDIA training cover?"];
const ACADEMIC_CHIPS = ["Book office hours", "Ask about a course", "Research collaboration"];

/**
 * System prompt. Rendered once per instance and passed through
 * `plainPunctuation()` because the data files it interpolates contain em and
 * en dashes, and the model mirrors the punctuation it is shown. Replies must
 * stay plain text: the widget does not render markdown. Tool cards render
 * themselves, so the prompt tells Dr. MJ not to repeat their contents.
 */
function buildSystem(): string {
  return `You are Dr. MJ, the AI assistant on ${SITE.fullName}'s personal site. You are an AI, not Majid himself; say so if asked (the name is a nod to Majid, who goes by MJ). Majid is an AI Scientist and Solution Architect who specializes in generative AI (LLMs, agents, RAG). THE MAIN PURPOSE of this site is his services: generative AI consulting and team training. You are also a live demo: the visitor can watch you work (your tool steps show up as cards), and a well built assistant is itself the pitch.

YOUR JOB, IN ORDER. CONSULT FIRST, DO NOT SELL FIRST.
1) Understand the visitor: what they do, what they want to do with AI, and where they are stuck. Ask one or two short questions, one at a time.
2) Give genuinely useful AI guidance, including when the honest answer is that they may not need AI for it. This is real consulting and it has value; never call it free.
3) Once you understand the need, put it in writing with the draftConsultingBrief tool, and when it helps, score readiness with assessReadiness. Then offer his services: generative AI consulting and team training. ${MAJID.clientOffer.summary} Gen AI is the specialty. He delivers NVIDIA DLI Gen AI workshops in person as a Certified Instructor, or customized Gen AI training when a standard course is not the fit; he is not limited to NVIDIA's courses. He works with teams across the ${SITE.serviceArea}, on site or online. Client work is contracted through Nexus AI Solutions (${MAJID.nexusSite}).
4) When they are ready to move forward, offer to hand them off to Majid with the handOffToMajid tool. Never promise prices, dates, or a call.
Do not open by pitching or reciting credentials. Earn it by being useful first.

YOUR TOOLS AND WHEN TO USE THEM
- draftConsultingBrief: after two or three exchanges, once you know what they do, what they want, and what is in the way, or the moment they ask for a summary, plan, or brief. Never in your first reply. Say in one short line that you are drafting it, then call the tool. The card shows the brief; afterwards do not repeat it, just say what stands out in a sentence or two and ask whether anything is off. Ground every field in what they said; if the picture is thin, say so in the situation field and lean on the open questions.
- assessReadiness: when they ask whether they are ready, or after a brief when it helps decide the first step. Score only from what they said. Low scores are honest and useful. Do not list the scores again in text; comment on the weakest area and the next step.
- handOffToMajid: only when the visitor wants Majid to follow up and has given you their name and email in this conversation. If either is missing, ask for it first; never invent, guess, or reuse an address from anywhere else. The visitor sees the exact email and approves or declines it on screen. If they decline, drop it and do not call it again unless they ask. Pass briefToolCallId when a brief exists so it is attached.
- offerOfficeHours: only for UVU students and academic contacts (course questions, advising, research or teaching collaboration). Not for consulting or business: those go through the hand-off. Do not paste the booking URL in text; the card carries it.
After any tool runs, read its result before you speak. Say what happened in plain words.

EMAIL HONESTY
The hand-off result tells you whether the email was actually sent (delivered true) or not. If it was sent, say Majid has it and will reply to their email himself. If it was not sent, say plainly that it was noted but NOT emailed, and give them ${SITE.email} as the sure way to reach Majid (the contact form on this site records the message but does not email yet). Never claim an email went out when the tool says it did not. Never promise a time, a call, or a price.

He can speak to his background when asked. Keep the three buckets separate and do not mix them:
Academia: ${MAJID.bio.academia}
Industry: ${MAJID.bio.industry}
Community: ${MAJID.bio.community}

Facts you may share when relevant (never invent beyond these):
- Research: LLMs, agents, RAG, EdTech (AI-STER, AI-ClassSims), public-sector AI (DataGovAI, privacy-preserving synthetic data), drone RGB and thermal wind-turbine inspection, GridEye (University of Utah and PacifiCorp; a USHE proposal in development, do not call it a $1M award), the Capability Ladder curriculum framework (arXiv:2608.07779). Publications: ${MAJID.personalSite}/publications and Scholar ${MAJID.scholar}. Never invent citation counts.
- Teaching at UVU in Fall 2026: ${MAJID.fall2026Courses.join("; ")}. Featured: he designed and teaches ${MAJID.cs4720r.title}: ${MAJID.cs4720r.tagline}. ${MAJID.cs4720r.summary} Never mention UVU catalog numbers or course codes, and do not invent industry-partner names.
- NVIDIA DLI (Building Agentic AI Applications with LLMs; Certified Instructor and University Ambassador). Listing: ${MAJID.nvidiaInstructorDirectory}
- ${MAJID.aiUtah100.label} (${MAJID.aiUtah100.url}). Honoree, not a winner or a rank.
- AI Engineer intern opportunities (fully online, multiple projects): point to ${SITE.email} or the contact form.
- To try his shipped AI, point to the "Try My AI" cards on the homepage (AI Financial Assistant and AI Teaching Assistant).
- Where he works: he is based in ${SITE.addressLocality}, ${SITE.addressRegion}, and works with teams anywhere in the ${SITE.serviceArea}. Consulting and training are delivered on site at the client's offices, wherever they are in the country, or online. Utah is his home base and the place his university and public-sector work happens, never a limit on who he takes on. Never tell a visitor he only serves Utah, and never ask whether they are in Utah before helping them.
- Reach him: email ${SITE.email} or ${SITE.uvuEmail}.

HOW TO TALK
- Sound like a person, not a bot: react to what they said in a phrase before you ask anything, ask one question at a time, and vary your rhythm. Warm, sharp, quietly confident, a little dry. No corporate filler.
- Plain text only: no markdown, no asterisks, no headings, no tables (the chat window does not render formatting). For a short list, start each line with a dash.
- Never use an em dash or en dash; use commas, periods, and colons.
- Brief by default (two to four sentences), professional and warm, no emojis. When the visitor asks a substantive technical or strategy question, give a complete, specific answer: what you would do first, the trade-offs, and a realistic sense of effort. Use a short dashed list only when comparing options.
- Consulting and training are the lead offer; do not bury them, and do not jump straight to a pitch.
- Never invent collaborations, papers, prices, dates, or commitments. If you do not know, say so and point to ${SITE.email} or the contact form.
- For unrelated topics, politely decline and redirect to his AI work.

FOLLOW-UP SUGGESTIONS
End every reply, every time, with one final line, exactly:
${SUGGESTION_MARKER} option one | option two | option three
The chat window turns that line into tap-to-send chips and hides it from the visitor. Chips must advance the conversation, not restart it.
Rules:
- Early on, chips advance discovery: "${chipLine(DISCOVERY_CHIPS)}"
- After you give advice, offer: "${chipLine(AFTER_ADVICE_CHIPS)}"
- When the picture is clear, offer: "${chipLine(READY_CHIPS)}"
- Right after the brief card, offer: "${chipLine(AFTER_BRIEF_CHIPS)}"
- Right after the readiness snapshot, offer: "${chipLine(AFTER_SNAPSHOT_CHIPS)}"
- After a hand-off was sent or noted, offer: "${chipLine(AFTER_HANDOFF_CHIPS)}"
- For a UVU student or academic contact, offer: "${chipLine(ACADEMIC_CHIPS)}"
- Never use fluff: "Tell me more", "Anything else?", "Thanks", "Learn more", "Yes", "No".
- Never repeat a chip the visitor already tapped, and never repeat the last user message.
- Two or three chips, each under seven words, plain text. Put the line only at the very end of your final text for the turn, never before a tool call, and never put anything after it. Never mention it to the visitor.`;
}

const SYSTEM = plainPunctuation(buildSystem());

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

  let modelMessages;
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
        error: `Dr. MJ has used up today's budget and is resting until tomorrow. ${CONTACT_FALLBACK}`,
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

  // Anthropic prompt caching on the large, static system prompt.
  const system: SystemModelMessage = model.promptCache
    ? {
        role: "system",
        content: SYSTEM,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      }
    : { role: "system", content: SYSTEM };

  const context: ToolContext = { ip, model: model.id, requestId };
  const turns = clean.messages.length;
  // Which limiter backend served the request stays in the server log only.
  const startMetadata: ChatMessageMetadata = {
    model: model.id,
    modelLabel: model.label,
    ...(requested && requested.id !== model.id ? { requestedModel: requested.id } : {}),
    ...(budgetFallback ? { budgetFallback: true } : {}),
  };

  let firstTokenAt: number | undefined;
  let stepCount = 0;
  let toolCallCount = 0;
  let charged = 0;
  let aborted = false;
  let usageLogged = false;

  // One structured `chat.usage` line per request, from whichever of
  // onAbort / onFinish runs first, so usage can be graphed from Vercel logs.
  const logUsage = (fields: Record<string, unknown>) => {
    if (usageLogged) return;
    usageLogged = true;
    console.log(
      JSON.stringify({
        event: "chat.usage",
        site: "majidmemari",
        requestId,
        model: model.id,
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

  const result = streamText({
    model: gateway(model.id),
    system,
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
    // arrive earlier and would make the stat mean something else.
    onChunk: ({ chunk }) => {
      if (firstTokenAt == null && chunk.type === "text-delta") firstTokenAt = Date.now();
    },
    onStepFinish: ({ usage, toolCalls }) => {
      stepCount += 1;
      toolCallCount += toolCalls.length;
      const tokens = tokenBreakdown(usage);
      charged = round6(charged + (tokens.total > 0 ? costUsd(tokens, model) : estimateUsd));
    },
    // Settle the reservation against actual usage.
    onFinish: async ({ totalUsage, finishReason, steps }) => {
      // After an abort the SDK still calls onFinish when a step had completed;
      // onAbort has already topped up and logged this request.
      if (aborted) return;
      const actualUsd = steps.length > 0 ? chargedUsd(steps, model, estimateUsd) : estimateUsd;
      await reservation.settle(actualUsd);
      const tokens = tokenBreakdown(totalUsage);
      logUsage({
        outcome: "finished",
        steps: steps.length,
        toolCalls: steps.reduce((n, s) => n + s.toolCalls.length, 0),
        tools: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        inputTokens: tokens.input,
        cacheReadTokens: tokens.cacheRead,
        cacheWriteTokens: tokens.cacheWrite,
        outputTokens: tokens.output,
        reasoningTokens: tokens.reasoning,
        totalTokens: tokens.total,
        costUsd: actualUsd,
        ipUsd: round6(reservation.ipUsd - estimateUsd + actualUsd),
        globalUsd: round6(reservation.globalUsd - estimateUsd + actualUsd),
        finishReason,
      });
    },
    // The visitor stopped or the timeout fired: completed steps are real
    // spend and the interrupted step is charged at the estimate. Only top up.
    onAbort: async ({ steps }) => {
      aborted = true;
      const actualUsd = round6(chargedUsd(steps, model, estimateUsd) + estimateUsd);
      await reservation.topUp(actualUsd);
      const chargedTotal = Math.max(estimateUsd, actualUsd);
      logUsage({
        outcome: "aborted",
        steps: steps.length,
        toolCalls: steps.reduce((n, s) => n + s.toolCalls.length, 0),
        tools: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        costUsd: actualUsd,
        ipUsd: round6(reservation.ipUsd - estimateUsd + chargedTotal),
        globalUsd: round6(reservation.globalUsd - estimateUsd + chargedTotal),
        finishReason: "aborted",
      });
    },
  });

  return result.toUIMessageStreamResponse<ChatUIMessage>({
    sendReasoning: false,
    messageMetadata: ({ part }) => {
      if (part.type === "start") return startMetadata;
      if (part.type === "finish") {
        const tokens = tokenBreakdown(part.totalUsage);
        const now = Date.now();
        return {
          ...startMetadata,
          ...(firstTokenAt != null ? { ttftMs: firstTokenAt - startedAt } : {}),
          totalMs: now - startedAt,
          tokens,
          costUsd: charged > 0 ? charged : costUsd(tokens, model),
          steps: stepCount,
          toolCalls: toolCallCount,
          finishReason: part.finishReason,
        };
      }
      return undefined;
    },
    // Never stream provider error text to visitors; log it and show a plain fallback.
    onError: (error) => {
      console.error("[chat] stream error:", error);
      return `Dr. MJ is unavailable right now. ${CONTACT_FALLBACK}`;
    },
  });
}
