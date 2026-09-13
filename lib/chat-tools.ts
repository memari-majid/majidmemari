/**
 * Dr. MJ's tools on the personal site. Module scope, created once: the client
 * IP and the model reach `execute` through `experimental_context` (typed
 * `unknown` by the SDK; narrow it with `toolContext()`), never by creating
 * tools inside `POST`.
 *
 * Every `toModelOutput` returns `{ type: "text" as const, value }` and reads
 * `output` with optional chaining: tool parts echo back from the client on
 * every request, so a crafted `output: {}` must produce a generic sentence,
 * never a throw that 400s a legitimate long conversation.
 *
 * Server-side runtime. Client components may import types from here
 * (`import type`), nothing else.
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
import type { ChatMessageMetadata } from "@/lib/chat-metadata";
import {
  briefSummaryLine,
  consultingBriefSchema,
  findBrief,
} from "@/lib/consulting-brief";
import { EMAIL_RE, founderInbox, isEmailConfigured, sendEmail } from "@/lib/email";
import { handOffEmail } from "@/lib/handoff-email";
import { getRateLimiter } from "@/lib/rate-limit";
import {
  assessReadiness as scoreReadiness,
  readinessInputSchema,
  readinessToText,
  type ReadinessSnapshot,
} from "@/lib/readiness";
import { SITE } from "@/lib/site";

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

/** The mailbox is a real inbox; the contact form only logs until Resend is configured, so it comes second. */
const CONTACT_FALLBACK = `${SITE.email} (the contact form at /contact records the message on the server but does not email yet)`;

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

const draftConsultingBrief = tool({
  description:
    "Draft the structured consulting brief for this visitor and show it to them as a card. Call it once you understand what they do, what they want from AI, and where they are stuck (usually after two or three exchanges), or as soon as they ask for a summary, a plan, or a brief. Never in your first reply. The card is rendered from your input, so do not repeat the brief in text afterwards; say what stands out in one or two sentences and ask whether anything is off.",
  inputSchema: consultingBriefSchema,
  execute: async (brief) => ({
    ok: true as const,
    title: brief.title,
    opportunities: brief.opportunities.length,
    engagement: brief.engagement,
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
  execute: async (input) => scoreReadiness(input),
  toModelOutput: ({ output }) =>
    safeText("A readiness snapshot was shown to the visitor as a card.", () => {
      if (!output || typeof output.overall !== "number" || !Array.isArray(output.dimensions)) return undefined;
      return `${readinessToText(output)} Do not list the scores again; comment on the weakest area in a sentence and suggest the next step.`;
    }),
});

const handOffInputSchema = z.object({
  name: z.string().min(1).max(120).describe("Visitor's name, exactly as they gave it in this conversation"),
  email: z.string().min(3).max(200).describe("Visitor's email address, exactly as they typed it in this conversation"),
  organization: z.string().max(160).optional().describe("Company or team, only if they mentioned one"),
  topic: z
    .string()
    .min(1)
    .max(500)
    .describe("What they want Majid's help with, one or two sentences in their own words"),
  briefToolCallId: z
    .string()
    .max(128)
    .optional()
    .describe("The toolCallId of the draftConsultingBrief call to attach, if a brief was drafted"),
});

type HandOffFailure = "invalid-email" | "quota" | "not-configured" | "send-failed";

const handOffToMajid = tool({
  description:
    "Send Majid Memari a structured hand-off email (name, email, what they need, and the consulting brief if one was drafted) so he can follow up personally about consulting or team training. Use only when the visitor says they want Majid to follow up AND has given both their name and email in this conversation; never invent or guess either one, ask for them first. The visitor sees the exact email and must approve it on screen before anything is sent. If they decline, do not call this again unless they ask.",
  inputSchema: handOffInputSchema,
  needsApproval: true,
  execute: async (input, options: ToolCallOptions) => {
    const ctx = toolContext(options.experimental_context);
    const name = input.name.trim();
    const email = input.email.trim();
    const topic = input.topic.trim();
    const organization = input.organization?.trim() || undefined;
    const base = { to: "Majid Memari", name, email, topic, organization };

    if (!EMAIL_RE.test(email)) {
      return { ...base, delivered: false as const, briefAttached: false, reason: "invalid-email" as HandOffFailure };
    }

    // Only spend the visitor's daily hand-off allowance on a send that can
    // actually happen. Without Resend configured, `sendEmail` logs the
    // request and reports not-configured; charging the quota for that would
    // turn the fourth attempt into a misleading "quota" reason.
    if (isEmailConfigured()) {
      const quota = await getRateLimiter().reserveEmail(ctx.ip);
      if (!quota.allowed) {
        console.info("[chat] hand-off refused by email quota:", { reason: quota.reason, requestId: ctx.requestId });
        return { ...base, delivered: false as const, briefAttached: false, reason: "quota" as HandOffFailure };
      }
    }

    // A brief drafted in the same step as the hand-off (parallel calls) is not
    // visible here yet; the hand-off then goes out without it.
    const brief = findBrief(options.messages, input.briefToolCallId);
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
        name,
        topic: topic.slice(0, 120),
        briefAttached: Boolean(brief),
      });
      return {
        ...base,
        delivered: false as const,
        briefAttached: Boolean(brief),
        reason: (sent.ok ? "not-configured" : "send-failed") as HandOffFailure,
      };
    }

    return { ...base, delivered: true as const, briefAttached: Boolean(brief), reason: undefined };
  },
  toModelOutput: ({ output }) =>
    safeText(
      `The hand-off was not confirmed as sent. Tell the visitor plainly that it may not have gone out and point them to ${CONTACT_FALLBACK}.`,
      () => {
        if (!output || typeof output.delivered !== "boolean") return undefined;
        if (output.delivered) {
          return `Hand-off email sent to Majid Memari${output.briefAttached ? " with the consulting brief attached" : ""}. He will reply to ${output.email ?? "the visitor's email"} himself. Confirm that in one short sentence; do not promise a time, a call, or a price.`;
        }
        switch (output.reason) {
          case "invalid-email":
            return "Not sent: that email address does not look valid. Ask the visitor to re-type it; do not guess.";
          case "quota":
            return `Not sent: this connection has reached today's hand-off limit. Say so plainly and point the visitor to ${CONTACT_FALLBACK}.`;
          default:
            return `Not sent: email is not configured on this server, so nothing went out. The request was noted in the server log only. Say plainly that it was NOT emailed and that the fastest way to reach Majid is ${CONTACT_FALLBACK}. Never say an email went out.`;
        }
      },
    ),
});

const offerOfficeHours = tool({
  description:
    "Show Majid's office-hours booking card. Only for Utah Valley University students and academic contacts: course questions, advising, research or teaching collaboration. Not for consulting or business inquiries, which go through handOffToMajid instead.",
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
        ? "Office-hours booking card shown, with the link to Majid's university booking page. Tell the visitor to pick a slot there; do not paste the URL in text."
        : undefined,
    ),
});

export const chatTools = {
  draftConsultingBrief,
  assessReadiness,
  handOffToMajid,
  offerOfficeHours,
};

export type ChatTools = InferUITools<typeof chatTools>;
export type ChatToolName = keyof typeof chatTools;

/** The UI message shape shared by the route and the widget (metadata + typed tool parts). */
export type ChatUIMessage = UIMessage<ChatMessageMetadata, UIDataTypes, ChatTools>;

/** Tools that end the turn with an approval card. */
export const APPROVAL_TOOLS: readonly ChatToolName[] = ["handOffToMajid"];
