/**
 * The contact form's intake classification: one small model call that sorts a
 * message into a category and writes the acknowledgment the visitor reads.
 *
 * It reports the tokens it used, because the caller reserves budget before it
 * runs and settles against real usage afterwards. Every model call on this
 * site passes through the same daily cap, and a call whose usage nobody reads
 * would have to be settled by guesswork.
 *
 * Bounded on both ends: `maxOutputTokens` so the precharge is a real ceiling
 * rather than a hope, and a timeout so a hung provider cannot hold the
 * visitor's form open with money reserved.
 *
 * Tolerant of the model, on purpose. Measured 2026-09-13: with the classifier
 * pinned to `openai/gpt-oss-20b`, 99 of 99 submissions across both sites
 * failed `generateObject` with `AI_NoObjectGeneratedError`. The model answered
 * in harmony markup (`<|channel|>final<|message|>...`), or with markdown, or
 * with a JSON object whose acknowledgment field was called `acknowledgment`
 * rather than `autoReply`, and every one of those calls was paid for and
 * thrown away. So the structured output is asked for first, and when the SDK
 * cannot validate it the raw text is read once more by `parseInquiryText`,
 * which strips the wrappers, takes the first JSON object it finds and accepts
 * the field names a model is likely to use. A call that still yields nothing
 * throws, and the caller charges it at the floor as before.
 *
 * `parseInquiryText` is exported so the company repo's `lib/inquiry.test.ts`
 * can pin its behaviour; this repo has no test runner.
 *
 * Server-only. Never import from a client component.
 */

import { gateway, generateText, Output } from "ai";
import { z } from "zod";
import {
  CONTACT_CLASSIFY_OUTPUT_TOKENS,
  CONTACT_CLASSIFY_TIMEOUT_MS,
} from "@/lib/chat-limits";
import { tokenBreakdown } from "@/lib/chat-models";
import { FOUNDER_CHAT_NAME, FOUNDER_SITE_NAME } from "@/lib/chat-persona";
import { gatewayProviderOptions } from "@/lib/gateway";

const INQUIRY_CATEGORIES = ["consulting", "workshop", "mentorship", "collaboration", "general"] as const;

const inquirySchema = z.object({
  category: z.enum(INQUIRY_CATEGORIES),
  autoReply: z.string().max(550),
});

export type InquiryCategory = z.infer<typeof inquirySchema>["category"];

/** The classification, plus what it cost in tokens so the caller can settle it. */
export type InquiryClassification = z.infer<typeof inquirySchema> & {
  inputTokens: number;
  outputTokens: number;
};

/**
 * Built in one place so the caller can size its budget reservation against the
 * same characters the model will actually read.
 */
function inquiryPrompt(input: { name: string; message: string }): string {
  return `You are the intake assistant for the personal website of Majid Memari, PhD, Assistant Professor of Computer Science at Utah Valley University, NVIDIA University Ambassador, Principal AI Architect at the Gary R. Herbert Institute for Public Policy, and founder of Nexus AI Solutions LLC.

Classify this contact form message into exactly one category:
- consulting: AI consulting, adoption advice, architecture review, when to use AI, paid advisory
- workshop: workshops, team training, in-house training, NVIDIA DLI, campus invitations
- mentorship: student internships, AI Engineer Intern role, applying to work with him, resume
- collaboration: research collaboration, joint project, partnership, vendor inquiry
- general: other or unclear

Then write a short personalized acknowledgment (2 to 4 sentences) the visitor will see on the website after submitting. Use their name if natural. Be warm and professional. Plain sentences, no em dashes. Do not promise specific timelines; say ${FOUNDER_SITE_NAME} will follow up personally. Write his name exactly as "${FOUNDER_SITE_NAME}" every time you mention him. Never write "${FOUNDER_CHAT_NAME}", "Dr.", "Professor" or "Majid" on its own: those belong to the chat assistant, not to this form.

Answer with one JSON object and nothing else: {"category": "<one of the five>", "autoReply": "<the acknowledgment>"}.

Name: ${input.name}
Message:
${input.message}`;
}

/** Characters the classification prompt will send, for the precharge estimate. */
export function inquiryPromptChars(input: { name: string; message: string }): number {
  return inquiryPrompt(input).length;
}

/** Field names a model uses for the acknowledgment when it does not follow the schema. */
const AUTO_REPLY_ALIASES = ["autoReply", "auto_reply", "acknowledgment", "acknowledgement", "reply", "response"];

/**
 * The founder's name outside the chat is `FOUNDER_SITE_NAME`, and the
 * classifier is told so, but a small model still writes "Dr. Memari" now and
 * then (measured on `openai/gpt-4.1-nano`, 2026-09-13). The acknowledgment is
 * page copy, so the chat form of the name is rewritten before it is shown.
 * Pure and exported for the company repo's tests.
 */
export function siteNameOnly(text: string): string {
  return text
    .replace(/\bDr\.?\s+Majid\s+Memari\b/g, FOUNDER_SITE_NAME)
    .replace(/\bDr\.?\s+Memari\b/g, FOUNDER_SITE_NAME)
    .replace(/\bProfessor\s+Memari\b/g, FOUNDER_SITE_NAME);
}

/**
 * Reads a classification out of whatever text the model returned. Pure.
 *
 * Handles the failure shapes measured on `openai/gpt-oss-20b`: harmony channel
 * markers before the object, a markdown code fence around it, prose after it,
 * and an acknowledgment under another name. Returns undefined when no object
 * with a known category can be found, so the caller can charge the call as a
 * failure rather than deliver a made-up acknowledgment.
 */
export function parseInquiryText(text: string | undefined): z.infer<typeof inquirySchema> | undefined {
  if (!text) return undefined;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const category =
    typeof record.category === "string" ? record.category.trim().toLowerCase() : undefined;
  const alias = AUTO_REPLY_ALIASES.find((key) => typeof record[key] === "string" && (record[key] as string).trim());
  const autoReply = alias ? siteNameOnly((record[alias] as string).trim()).slice(0, 550) : undefined;
  const parsed = inquirySchema.safeParse({ category, autoReply });
  return parsed.success ? parsed.data : undefined;
}

export async function classifyInquiry(input: {
  name: string;
  message: string;
  modelId: string;
}): Promise<InquiryClassification> {
  const result = await generateText({
    model: gateway(input.modelId),
    output: Output.object({ schema: inquirySchema }),
    maxOutputTokens: CONTACT_CLASSIFY_OUTPUT_TOKENS,
    timeout: { totalMs: CONTACT_CLASSIFY_TIMEOUT_MS },
    providerOptions: gatewayProviderOptions("contact-classify"),
    prompt: inquiryPrompt(input),
  });
  const tokens = tokenBreakdown(result.usage);
  // The SDK's own validation first; its throw is the cue to read the text.
  let object: z.infer<typeof inquirySchema> | undefined;
  try {
    object = result.output;
  } catch {
    object = parseInquiryText(result.text);
  }
  if (!object) {
    throw new Error(
      `classifyInquiry: ${input.modelId} returned no usable object (finishReason ${result.finishReason}, text: ${JSON.stringify(result.text.slice(0, 160))})`,
    );
  }
  return {
    category: object.category,
    autoReply: siteNameOnly(object.autoReply).slice(0, 550),
    inputTokens: tokens.input + tokens.cacheRead + tokens.cacheWrite,
    outputTokens: tokens.output,
  };
}

export function fallbackInquiryResponse(): { category: InquiryCategory; autoReply: string } {
  return {
    category: "general",
    autoReply:
      "Thanks for reaching out. Your message was received. Majid Memari, PhD will follow up personally as soon as he can.",
  };
}
