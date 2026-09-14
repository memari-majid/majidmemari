/**
 * The AI Consultant's ten tools on this site. Module scope, created once: the
 * client IP and the model reach `execute` through `experimental_context`
 * (typed `unknown` by the SDK; narrow it with `toolContext()`), never by
 * creating tools inside `POST`.
 *
 * Contract every tool keeps:
 * - Input schemas are plain strings, numbers, enums, and arrays: no
 *   `.email()`, no regex, no `format` keywords, because the JSON schema is
 *   sent to every model in the picker. Addresses are validated by `EMAIL_RE`
 *   inside `execute`.
 * - `toModelOutput` returns `{ type: "text" as const, value }` and reads
 *   `output` with optional chaining: tool parts echo back from the client on
 *   every request, so a crafted `output: {}` must produce a generic sentence,
 *   never a throw that 400s a legitimate long conversation.
 * - Outputs are small. The card renders the tool's input while it streams, so
 *   the output carries the result of the work and nothing decorative: every
 *   character is echoed back to the model on every later turn and is charged
 *   again each time.
 * - Sends need on-screen approval. The SDK executes an approved call from the
 *   echoed transcript WITHOUT running `inputSchema` again, so every gated
 *   `execute` re-validates with `recheck()` before it touches a field. A
 *   crafted transcript can otherwise push an oversized or mistyped value into
 *   an email, or throw a TypeError inside `execute` on a non-string field.
 * - Gated sends are idempotent per toolCallId: a retry after a dropped
 *   connection replays the outcome instead of sending twice, and a send that
 *   did not happen gives the claim back so a later retry can still try.
 * - Email quotas are only spent when email can actually go out. Production
 *   has no provider configured, and a not-configured attempt must never burn
 *   the visitor's daily allowance.
 * - A draft the send tools re-read from history is signed. `findBrief` and
 *   `findReadiness` recover a brief and a snapshot from the echoed transcript,
 *   which the client controls, so `draftConsultingBrief`, `assessReadiness`
 *   and `draftOutreachNote` sign their own input into their output
 *   (`signDraft`) and the route's sanitizer keeps such a part only when that
 *   signature verifies. An approval itself is signed by the SDK
 *   (`experimental_toolApprovalSecret` on the route) and verified there too.
 *
 * Server-only (imports the `ai` runtime, Resend, and the rate limiter).
 * Client components may import types from here (`import type`), nothing else.
 */

import {
  tool,
  type InferUITools,
  type ModelMessage,
  type ToolCallOptions,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { approvalSecret, signDraft } from "@/lib/approval-signature";
import { briefEmail } from "@/lib/brief-email";
import { FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import {
  briefSummaryLine,
  consultingBriefSchema,
  findBrief,
} from "@/lib/consulting-brief";
import { EMAIL_RE, founderInbox, isEmailConfigured, scrubForEmail, sendEmail } from "@/lib/email";
import { handOffEmail } from "@/lib/handoff-email";
import { noteEmail } from "@/lib/note-email";
import { outreachNoteSchema, outreachToText } from "@/lib/outreach-note";
import { estimateInputSchema, estimateProject as computeEstimate } from "@/lib/project-estimate";
import { getRateLimiter } from "@/lib/rate-limit";
import {
  assessReadiness as scoreReadiness,
  readinessInputSchema,
  readinessToText,
  type ReadinessSnapshot,
} from "@/lib/readiness";
import { FACT_TOPICS, factsToText, lookupFacts } from "@/lib/site-facts";
import { SITE } from "@/lib/site";
import { recommendTraining } from "@/lib/training-catalog";

export type ToolContext = {
  ip: string;
  model: string;
  requestId: string;
};

/** Narrows the SDK's `unknown` context. Missing fields default rather than throw. */
export function toolContext(ctx: unknown): ToolContext {
  const c = (ctx && typeof ctx === "object" ? ctx : {}) as Partial<Record<keyof ToolContext, unknown>>;
  return {
    ip: typeof c.ip === "string" && c.ip ? c.ip : "unknown",
    model: typeof c.model === "string" ? c.model : "",
    requestId: typeof c.requestId === "string" ? c.requestId : "",
  };
}

const text = (value: string) => ({ type: "text" as const, value });

/** Runs a formatter over untrusted echoed output; any throw becomes the fallback sentence. */
function safeText(fallback: string, fn: () => string | undefined) {
  try {
    return text(fn() || fallback);
  } catch {
    return text(fallback);
  }
}

/**
 * Re-validates the input of an approved tool call. The SDK takes it from the
 * echoed transcript and skips `inputSchema`, so this runs BEFORE any field is
 * read. Returns undefined rather than throwing: a bad input has to become a
 * visible "not sent" card, not a 500 in the middle of a conversation.
 */
function recheck<T>(schema: z.ZodType<T>, raw: unknown): T | undefined {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** Reads one string field out of an unvalidated input, for the card's own fields. */
function field(raw: unknown, key: string, max: number): string {
  if (!raw || typeof raw !== "object") return "";
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** The mailbox is a real inbox; the contact form only logs until email is configured, so it comes second. */
const CONTACT_FALLBACK = `${SITE.email} (the contact form at /contact goes through the same email path, so today it only logs on the server too)`;

/**
 * The part of the hint every not-configured send shares. The server log is
 * not a durable record: a Vercel runtime line expires within hours unless a
 * log drain is attached, so a visitor told their request was "recorded and
 * will be reviewed" may skip the contact form and never be reached. The
 * prompt still calls the log a record (`lib/assistant.ts`, an owner
 * decision); this hint is what the model reads right after the send and it
 * must not let that turn into a promise.
 */
const NOT_CONFIGURED_HINT = `Email is not configured on this server, so nothing went out and nothing reached ${FOUNDER_CHAT_NAME}. The request appears in the server log only, which is not a durable record, so do not promise that ${FOUNDER_CHAT_NAME} will review it or reach out. Say plainly that it was NOT emailed and that the sure way to reach him is ${CONTACT_FALLBACK}. Never say an email went out.`;

/**
 * Signs a draft tool's input into its output, so the send tools can only ever
 * attach a draft this server saw the model write. The signature is over the
 * parsed input, which is also what the SDK streams to the client and what the
 * client echoes back, so the sanitizer verifies exactly what was signed.
 */
function draftSignature(toolName: string, options: ToolCallOptions, input: unknown): string {
  return signDraft({
    secret: approvalSecret(),
    toolCallId: typeof options.toolCallId === "string" ? options.toolCallId : "",
    toolName,
    input,
  });
}

/**
 * Recovers the latest readiness input from the transcript and recomputes the
 * snapshot (the computation is deterministic, and the tool result the model
 * saw was compact text, not the JSON).
 */
export function findReadiness(messages: ModelMessage[]): ReadinessSnapshot | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant" || typeof m.content === "string") continue;
    for (let j = m.content.length - 1; j >= 0; j--) {
      const part = m.content[j];
      if (part.type !== "tool-call" || part.toolName !== "assessReadiness") continue;
      const parsed = readinessInputSchema.safeParse(part.input);
      if (parsed.success) return scoreReadiness(parsed.data);
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------------ */
/* Send idempotency                                                          */
/* ------------------------------------------------------------------------ */

/**
 * One claim per approved send, keyed by tool name and the SDK's toolCallId. A
 * request the client retries after a dropped connection carries the same
 * approved call, and the email must not go out twice. The claim lives in the
 * rate-limit store (Upstash, or per-instance memory) for 24 hours. Store
 * errors fail open: a send that cannot be de-duplicated still goes out, since
 * a lost lead is worse than a duplicate email.
 */
async function claimSend(toolName: string, toolCallId: string, requestId: string): Promise<boolean> {
  if (!toolCallId) return true;
  try {
    return (await getRateLimiter().claimSend(`${toolName}:${toolCallId}`)).first;
  } catch (err) {
    console.warn("[chat] send idempotency claim failed; sending anyway:", { requestId, toolName, err });
    return true;
  }
}

/** Gives the claim back when nothing was sent, so a later retry can still send. Best effort. */
async function releaseSend(toolName: string, toolCallId: string, requestId: string): Promise<void> {
  if (!toolCallId) return;
  try {
    await getRateLimiter().releaseSend(`${toolName}:${toolCallId}`);
  } catch (err) {
    console.warn("[chat] send idempotency release failed:", { requestId, toolName, err });
  }
}

/** Spends a unit of the visitor's daily email allowance, but only when a send can really happen. */
async function emailAllowed(ip: string, requestId: string, toolName: string): Promise<boolean> {
  if (!isEmailConfigured()) return true;
  const quota = await getRateLimiter().reserveEmail(ip);
  if (!quota.allowed) {
    console.info("[chat] send refused by email quota:", { reason: quota.reason, requestId, toolName });
    return false;
  }
  return true;
}

/** Every honest reason a send can come back undelivered. The card must have copy for each. */
export type SendFailure =
  | "invalid-input"
  | "invalid-email"
  | "quota"
  | "not-configured"
  | "send-failed"
  | "no-brief";

/* ------------------------------------------------------------------------ */
/* Grounding and advice                                                      */
/* ------------------------------------------------------------------------ */

const FACT_TEXT_CAP = 420;

const lookupSiteFacts = tool({
  description:
    "Look up grounded facts from this site before answering anything about Majid Memari's background, research, teaching, courses, training, consulting, internships, location, or contact routes. Returns short facts with the module each came from. Call it instead of answering from memory; if it returns nothing, say you do not know.",
  inputSchema: z.object({
    topic: z
      .enum(FACT_TOPICS)
      .optional()
      .describe("Narrow the lookup to one area when the question clearly belongs to it"),
    query: z
      .string()
      .max(200)
      .optional()
      .describe("The visitor's question in a few plain words, used to rank the facts"),
  }),
  execute: async (input) => {
    const facts = lookupFacts({ topic: input.topic, query: input.query, limit: 3 });
    return {
      topic: input.topic,
      count: facts.length,
      facts: facts.map((fact) => ({
        label: fact.label,
        text: fact.text.slice(0, FACT_TEXT_CAP),
        source: fact.source,
        ...(fact.url ? { url: fact.url } : {}),
      })),
    };
  },
  toModelOutput: ({ output }) =>
    safeText("No grounded fact was found. Say you do not know rather than guessing.", () =>
      Array.isArray(output?.facts) ? factsToText(output.facts) : undefined,
    ),
});

const recommendWorkshop = tool({
  description:
    "Pick the training that fits what the visitor described, from the real catalog Majid teaches or can arrange. Call it when they want training, name a skills gap, or ask which workshop suits their team. Never name a workshop title this tool did not return. The card shows the pick, so afterwards add one sentence on why it fits, do not list it again.",
  inputSchema: z.object({
    role: z.string().max(160).optional().describe("Who the training is for, in their words"),
    need: z.string().max(300).optional().describe("What they said they need to learn or fix"),
    level: z.string().max(120).optional().describe("Their current level, only if they said"),
    text: z.string().max(400).optional().describe("Any other words of theirs worth matching on"),
  }),
  execute: async (input) => {
    const rec = recommendTraining(input);
    return {
      title: rec.option.title,
      url: rec.option.url,
      track: rec.option.track,
      taught: rec.taught,
      why: rec.why.slice(0, 320),
      alternatives: rec.alternatives.map((option) => option.title),
    };
  },
  toModelOutput: ({ output }) =>
    safeText("A training recommendation was shown to the visitor as a card.", () => {
      if (!output?.title) return undefined;
      const alternatives = Array.isArray(output.alternatives) ? output.alternatives.join("; ") : "";
      return `${output.why || output.title}${alternatives ? ` Alternatives shown: ${alternatives}.` : ""} Only this title and those alternatives exist; never name another. Do not repeat the card, say in one sentence why it fits their team, and never quote a price.`;
    }),
});

const draftConsultingBrief = tool({
  description:
    "Draft the structured consulting brief for this visitor and show it to them as a card. Call it once you understand what they do, what they want from AI, and where they are stuck (usually after two or three exchanges), or as soon as they ask for a summary, a plan, or a brief. Never in your first reply. The card is rendered from your input, so do not repeat the brief in text afterwards; say what stands out in one or two sentences and ask whether anything is off.",
  inputSchema: consultingBriefSchema,
  execute: async (brief, options: ToolCallOptions) => ({
    ok: true as const,
    title: brief.title,
    opportunities: brief.opportunities.length,
    engagement: brief.engagement,
    signature: draftSignature("draftConsultingBrief", options, brief),
  }),
  toModelOutput: ({ input, output }) =>
    safeText("A consulting brief was shown to the visitor as a card.", () => {
      if (!output?.ok) return undefined;
      const parsed = consultingBriefSchema.safeParse(input);
      return parsed.success
        ? `${briefSummaryLine(parsed.data)} Do not repeat it in text. Ask whether anything is off, then decide with the visitor on the first step.`
        : undefined;
    }),
});

const assessReadiness = tool({
  description:
    "Score the visitor's readiness for the AI use case you have been discussing on five dimensions (goal, data, people, workflow, governance) and show a snapshot card. Score only from what they actually said; low scores are useful and expected. Call it when they ask whether they are ready, or after a brief when it helps decide the first step. Never in your first reply.",
  inputSchema: readinessInputSchema,
  execute: async (input, options: ToolCallOptions) => ({
    ...scoreReadiness(input),
    signature: draftSignature("assessReadiness", options, input),
  }),
  toModelOutput: ({ output }) =>
    safeText("A readiness snapshot was shown to the visitor as a card.", () => {
      if (!output || typeof output.overall !== "number" || !Array.isArray(output.dimensions)) return undefined;
      return `${readinessToText(output)} Do not list the scores again; comment on the weakest area in a sentence and suggest the next step.`;
    }),
});

const estimateProject = tool({
  description:
    "Size the first useful version of what the visitor described: a range of calendar weeks, the phases, and what drives the number. Call it when they ask how long something takes, what it would take, how much work it is, or whether it is worth doing. Judge every field from what they actually said. The result is effort, never a price and never a quote.",
  inputSchema: estimateInputSchema,
  execute: async (input) => {
    const estimate = computeEstimate(input);
    return {
      weeksLow: estimate.weeksLow,
      weeksHigh: estimate.weeksHigh,
      band: estimate.band,
      bandLabel: estimate.bandLabel,
      shapeLabel: estimate.shapeLabel,
      phases: estimate.phases,
      drivers: estimate.drivers,
      caveat: estimate.caveat,
    };
  },
  toModelOutput: ({ output }) =>
    safeText("A project estimate was shown to the visitor as a card.", () => {
      if (!output || typeof output.weeksHigh !== "number") return undefined;
      const drivers = Array.isArray(output.drivers) ? output.drivers.join("; ") : "";
      return `Estimate shown as a card: ${output.weeksLow} to ${output.weeksHigh} weeks to a first useful version (${output.bandLabel}). What drives it: ${drivers}. Do not repeat the phases in text. Say what would shrink the range, and be clear this is effort, not a price.`;
    }),
});

const draftOutreachNote = tool({
  description:
    "Draft a short note the visitor can send to someone else: their manager, an executive, their team, a client, or a peer. Call it when they have to convince somebody, or ask for something to paste into an email or a ticket. Write it in their voice, from this conversation only. The card shows the draft, so do not repeat it in text. This never sends anything to a third party.",
  inputSchema: outreachNoteSchema,
  execute: async (note, options: ToolCallOptions) => ({
    ok: true as const,
    audience: note.audience,
    subject: note.subject,
    asks: note.asks.length,
    signature: draftSignature("draftOutreachNote", options, note),
  }),
  toModelOutput: ({ input, output }) =>
    safeText("A note was drafted and shown to the visitor as a card.", () => {
      if (!output?.ok) return undefined;
      const parsed = outreachNoteSchema.safeParse(input);
      return parsed.success ? outreachToText(parsed.data) : undefined;
    }),
});

/* ------------------------------------------------------------------------ */
/* Sends (approval gated)                                                    */
/* ------------------------------------------------------------------------ */

const handOffInputSchema = z.object({
  name: z.string().min(1).max(120).describe("Visitor's name, exactly as they gave it in this conversation"),
  email: z.string().min(3).max(200).describe("Visitor's email address, exactly as they typed it in this conversation"),
  organization: z.string().max(160).optional().describe("Company or team, only if they mentioned one"),
  topic: z
    .string()
    .min(1)
    .max(500)
    .describe("What they want help with, one or two sentences in their own words"),
  briefToolCallId: z
    .string()
    .max(128)
    .optional()
    .describe("The toolCallId of the draftConsultingBrief call to attach, if a brief was drafted"),
});

type HandOffOutput = {
  to: string;
  name: string;
  email: string;
  topic: string;
  organization?: string;
  delivered: boolean;
  briefAttached: boolean;
  reason?: SendFailure;
  /** True on a replay: the same approved tool call already sent its email once. */
  alreadySent?: boolean;
};

const handOffToMajid = tool({
  description: `Send ${FOUNDER_CHAT_NAME} a structured hand-off email (name, email, what they need, and the consulting brief if one was drafted) so he can follow up personally about consulting or team training. Use only when the visitor says they want him to follow up AND has given both their name and email in this conversation; never invent or guess either one, ask for them first. The visitor sees the exact email and must approve it on screen before anything is sent. If they decline, do not call this again unless they ask.`,
  inputSchema: handOffInputSchema,
  needsApproval: true,
  execute: async (raw, options: ToolCallOptions): Promise<HandOffOutput> => {
    const ctx = toolContext(options.experimental_context);
    const toolCallId = typeof options.toolCallId === "string" ? options.toolCallId : "";
    // Re-validate the approved input BEFORE reading a single field: the SDK
    // took it from the echoed transcript and never ran `inputSchema`.
    const input = recheck(handOffInputSchema, raw);
    const base = {
      to: "the founder's inbox",
      name: field(raw, "name", 120) || "Visitor",
      email: field(raw, "email", 200),
      topic: field(raw, "topic", 500),
      ...(field(raw, "organization", 160) ? { organization: field(raw, "organization", 160) } : {}),
    };

    if (!input) return { ...base, delivered: false, briefAttached: false, reason: "invalid-input" };
    if (!EMAIL_RE.test(input.email.trim())) {
      return { ...base, delivered: false, briefAttached: false, reason: "invalid-email" };
    }

    const name = input.name.trim();
    const email = input.email.trim();
    const topic = input.topic.trim();
    const organization = input.organization?.trim() || undefined;

    // A brief drafted in the same step as the hand-off (parallel calls) is not
    // visible here yet; the hand-off then goes out without it.
    const brief = findBrief(options.messages, input.briefToolCallId);

    // Same approved tool call seen before: the client retried after a dropped
    // connection and the email already went out once. Report that instead of
    // sending again. Checked before the quota so a retry does not spend a
    // second allowance unit.
    if (!(await claimSend("handOffToMajid", toolCallId, ctx.requestId))) {
      console.info("[chat] hand-off already sent for this tool call; not sending again:", {
        requestId: ctx.requestId,
        toolCallId,
      });
      return { ...base, delivered: true, briefAttached: Boolean(brief), alreadySent: true };
    }

    if (!(await emailAllowed(ctx.ip, ctx.requestId, "handOffToMajid"))) {
      await releaseSend("handOffToMajid", toolCallId, ctx.requestId);
      return { ...base, delivered: false, briefAttached: false, reason: "quota" };
    }

    const readiness = findReadiness(options.messages);
    const mail = handOffEmail({ name, email, organization, topic, brief, readiness, model: ctx.model });

    const sent = await sendEmail({
      to: founderInbox(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: email,
    });

    if (!sent.delivered) {
      console.info("[chat] hand-off not delivered:", {
        requestId: ctx.requestId,
        reason: sent.ok ? sent.reason : sent.error,
        topic: topic.slice(0, 120),
        briefAttached: Boolean(brief),
      });
      // Nothing went out, so the id must not block a later retry.
      await releaseSend("handOffToMajid", toolCallId, ctx.requestId);
      return {
        ...base,
        delivered: false,
        briefAttached: Boolean(brief),
        reason: sent.ok ? "not-configured" : "send-failed",
      };
    }

    return { ...base, delivered: true, briefAttached: Boolean(brief) };
  },
  toModelOutput: ({ output }) =>
    safeText(
      `The hand-off was not confirmed as sent. Tell the visitor plainly that it may not have gone out and point them to ${CONTACT_FALLBACK}.`,
      () => {
        if (!output || typeof output.delivered !== "boolean") return undefined;
        if (output.delivered) {
          const once = output.alreadySent
            ? "This same approved hand-off had already been sent once (the earlier request was interrupted), so it was not sent a second time. "
            : "";
          return `${once}Hand-off email sent to ${FOUNDER_CHAT_NAME}${output.briefAttached ? " with the consulting brief attached" : ""}. He will reply to ${output.email ?? "the visitor's email"} himself. Confirm that in one short sentence; do not promise a time, a call, or a price.`;
        }
        switch (output.reason) {
          case "invalid-input":
            return "Not sent: the approved hand-off did not pass validation, so nothing went out. Ask the visitor to confirm their name and email, then offer it once more.";
          case "invalid-email":
            return "Not sent: that email address does not look valid. Ask the visitor to re-type it; do not guess.";
          case "quota":
            return `Not sent: this connection has reached today's send limit. Say so plainly and point the visitor to ${CONTACT_FALLBACK}.`;
          case "not-configured":
            return `Not sent: ${NOT_CONFIGURED_HINT}`;
          default:
            return `Not sent: the email provider failed on this send, so nothing went out. This is a fault on our side, not anything the visitor did wrong, and it is not a setup gap. Say plainly that it was NOT emailed, say briefly that you are sorry, and give them ${CONTACT_FALLBACK} as the sure way to reach ${FOUNDER_CHAT_NAME}. Never say an email went out.`;
        }
      },
    ),
});

const noteInputSchema = z.object({
  name: z.string().min(1).max(120).describe("Visitor's name, exactly as they gave it in this conversation"),
  email: z.string().min(3).max(200).describe("Visitor's email address, exactly as they typed it"),
  organization: z.string().max(160).optional().describe("Company or team, only if they mentioned one"),
  subject: z.string().min(1).max(160).describe("What the note is about, under 70 characters, no trailing period"),
  message: z
    .string()
    .min(1)
    .max(1800)
    .describe(
      "The note itself, in the visitor's own words as they said them in this conversation. Plain text, under 1200 characters. Do not add anything they did not say.",
    ),
});

type NoteOutput = {
  name: string;
  email: string;
  subject: string;
  delivered: boolean;
  reason?: SendFailure;
  alreadySent?: boolean;
};

const emailMajidNote = tool({
  description: `Send ${FOUNDER_CHAT_NAME} a short note from the visitor, in their own words, when they want to say something to him directly rather than file a full hand-off. Use only when they have given their name and email in this conversation. The visitor sees the exact note and must approve it on screen before anything is sent. One send per note; if they decline, do not call this again unless they ask.`,
  inputSchema: noteInputSchema,
  needsApproval: true,
  execute: async (raw, options: ToolCallOptions): Promise<NoteOutput> => {
    const ctx = toolContext(options.experimental_context);
    const toolCallId = typeof options.toolCallId === "string" ? options.toolCallId : "";
    const input = recheck(noteInputSchema, raw);
    const base = {
      name: field(raw, "name", 120) || "Visitor",
      email: field(raw, "email", 200),
      subject: field(raw, "subject", 160) || "A note from the chat",
    };

    if (!input) return { ...base, delivered: false, reason: "invalid-input" };
    if (!EMAIL_RE.test(input.email.trim())) return { ...base, delivered: false, reason: "invalid-email" };

    if (!(await claimSend("emailMajidNote", toolCallId, ctx.requestId))) {
      console.info("[chat] note already sent for this tool call; not sending again:", {
        requestId: ctx.requestId,
        toolCallId,
      });
      return { ...base, delivered: true, alreadySent: true };
    }

    if (!(await emailAllowed(ctx.ip, ctx.requestId, "emailMajidNote"))) {
      await releaseSend("emailMajidNote", toolCallId, ctx.requestId);
      return { ...base, delivered: false, reason: "quota" };
    }

    const mail = noteEmail({
      name: input.name.trim(),
      email: input.email.trim(),
      organization: input.organization?.trim() || undefined,
      subject: input.subject.trim(),
      message: input.message.trim(),
      model: ctx.model,
    });

    const sent = await sendEmail({
      to: founderInbox(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: input.email.trim(),
    });

    if (!sent.delivered) {
      console.info("[chat] note not delivered:", {
        requestId: ctx.requestId,
        reason: sent.ok ? sent.reason : sent.error,
      });
      await releaseSend("emailMajidNote", toolCallId, ctx.requestId);
      return { ...base, delivered: false, reason: sent.ok ? "not-configured" : "send-failed" };
    }

    return { ...base, delivered: true };
  },
  toModelOutput: ({ output }) =>
    safeText(
      `The note was not confirmed as sent. Say plainly that it may not have gone out and point the visitor to ${CONTACT_FALLBACK}.`,
      () => {
        if (!output || typeof output.delivered !== "boolean") return undefined;
        if (output.delivered) {
          const once = output.alreadySent
            ? "This same approved note had already been sent once, so it was not sent again. "
            : "";
          return `${once}Note sent to ${FOUNDER_CHAT_NAME}. He replies from his own inbox. Say so in one short sentence; do not promise when.`;
        }
        switch (output.reason) {
          case "invalid-input":
            return "Not sent: the approved note did not pass validation, so nothing went out. Ask the visitor to confirm the wording and their address.";
          case "invalid-email":
            return "Not sent: that email address does not look valid. Ask the visitor to re-type it.";
          case "quota":
            return `Not sent: this connection has reached today's send limit. Say so plainly and give them ${CONTACT_FALLBACK}.`;
          case "not-configured":
            return `Not sent: ${NOT_CONFIGURED_HINT}`;
          default:
            return `Not sent: the email provider failed, so nothing went out. Say plainly that it was NOT emailed, apologise briefly, and give them ${CONTACT_FALLBACK}.`;
        }
      },
    ),
});

const briefEmailInputSchema = z.object({
  name: z.string().min(1).max(120).describe("Visitor's name, exactly as they gave it"),
  email: z.string().min(3).max(200).describe("Visitor's own email address, exactly as they typed it"),
  briefToolCallId: z
    .string()
    .max(128)
    .optional()
    .describe("The toolCallId of the draftConsultingBrief call to send, if there is more than one"),
});

type BriefEmailOutput = {
  name: string;
  email: string;
  subject: string;
  delivered: boolean;
  reason?: SendFailure;
  alreadySent?: boolean;
};

const emailBriefToVisitor = tool({
  description: `Email the consulting brief to the visitor's own address, with ${FOUNDER_CHAT_NAME} copied. Call it only after draftConsultingBrief has run, when the visitor asks for the brief by email and has given you their name and email. The visitor approves the exact send on screen first.`,
  inputSchema: briefEmailInputSchema,
  needsApproval: true,
  execute: async (raw, options: ToolCallOptions): Promise<BriefEmailOutput> => {
    const ctx = toolContext(options.experimental_context);
    const toolCallId = typeof options.toolCallId === "string" ? options.toolCallId : "";
    const input = recheck(briefEmailInputSchema, raw);
    const base = {
      name: field(raw, "name", 120) || "there",
      email: field(raw, "email", 200),
      subject: "Your AI consulting brief",
    };

    if (!input) return { ...base, delivered: false, reason: "invalid-input" };
    if (!EMAIL_RE.test(input.email.trim())) return { ...base, delivered: false, reason: "invalid-email" };

    const brief = findBrief(options.messages, input.briefToolCallId);
    if (!brief) return { ...base, delivered: false, reason: "no-brief" };

    if (!(await claimSend("emailBriefToVisitor", toolCallId, ctx.requestId))) {
      return { ...base, delivered: true, alreadySent: true };
    }

    if (!(await emailAllowed(ctx.ip, ctx.requestId, "emailBriefToVisitor"))) {
      await releaseSend("emailBriefToVisitor", toolCallId, ctx.requestId);
      return { ...base, delivered: false, reason: "quota" };
    }

    const mail = briefEmail({ name: scrubForEmail(input.name.trim()), brief });
    const sent = await sendEmail({
      to: input.email.trim(),
      cc: [founderInbox()],
      replyTo: founderInbox(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    if (!sent.delivered) {
      console.info("[chat] brief email not delivered:", {
        requestId: ctx.requestId,
        reason: sent.ok ? sent.reason : sent.error,
      });
      await releaseSend("emailBriefToVisitor", toolCallId, ctx.requestId);
      return { ...base, delivered: false, reason: sent.ok ? "not-configured" : "send-failed" };
    }

    return { ...base, delivered: true, subject: mail.subject };
  },
  toModelOutput: ({ output }) =>
    safeText(
      `The brief email was not confirmed as sent. Say plainly that it may not have arrived and offer ${CONTACT_FALLBACK}.`,
      () => {
        if (!output || typeof output.delivered !== "boolean") return undefined;
        if (output.delivered) {
          return `Brief emailed to the visitor with ${FOUNDER_CHAT_NAME} copied. Say so in one sentence and offer the next step.`;
        }
        switch (output.reason) {
          case "no-brief":
            return "Not sent: there is no brief in this conversation yet. Draft one with draftConsultingBrief first, then offer to email it.";
          case "invalid-input":
            return "Not sent: the approved send did not pass validation. Ask the visitor to confirm their name and address.";
          case "invalid-email":
            return "Not sent: that email address does not look valid. Ask the visitor to re-type it.";
          case "quota":
            return `Not sent: this connection has reached today's send limit. Say so plainly and give them ${CONTACT_FALLBACK}.`;
          case "not-configured":
            return `Not sent: email is not configured on this server, so the brief did NOT go out. Say that plainly, and offer to keep going in the chat or to use ${CONTACT_FALLBACK}.`;
          default:
            return `Not sent: the email provider failed, so the brief did NOT go out. Say that plainly and offer ${CONTACT_FALLBACK}.`;
        }
      },
    ),
});

const offerOfficeHours = tool({
  description:
    "Show the office-hours booking card. Only for Utah Valley University students and academic contacts: course questions, advising, research or teaching collaboration. Not for consulting or business inquiries, which go through handOffToMajid instead.",
  inputSchema: z.object({
    reason: z.string().max(200).optional().describe("Why office hours fit, one short phrase"),
  }),
  execute: async () => ({
    url: SITE.bookingUrl,
    label: "Book office hours",
    audience: "UVU students and academic contacts",
    email: SITE.uvuEmail,
  }),
  toModelOutput: ({ output }) =>
    safeText("An office-hours booking card was shown to the visitor.", () =>
      output?.url
        ? "Office-hours booking card shown, with the link to the university booking page. Tell the visitor to pick a slot there; do not paste the URL in text."
        : undefined,
    ),
});

export const chatTools = {
  lookupSiteFacts,
  recommendWorkshop,
  draftConsultingBrief,
  assessReadiness,
  estimateProject,
  draftOutreachNote,
  handOffToMajid,
  emailMajidNote,
  emailBriefToVisitor,
  offerOfficeHours,
};

export type ChatTools = InferUITools<typeof chatTools>;
export type ChatToolName = keyof typeof chatTools;

/**
 * The UI message shape shared by the route and the widget: typed tool parts
 * and no metadata. Per-reply model, token and cost figures stay in the server
 * log and are never streamed to the client (owner decision, 2026-09-13).
 */
export type ChatUIMessage = UIMessage<never, UIDataTypes, ChatTools>;

/** Tools that end the turn with an approval card. */
export const APPROVAL_TOOLS: readonly ChatToolName[] = [
  "handOffToMajid",
  "emailMajidNote",
  "emailBriefToVisitor",
];
