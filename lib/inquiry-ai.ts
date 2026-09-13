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
 * Server-only. Never import from a client component.
 */

import { gateway, generateObject } from "ai";
import { z } from "zod";
import {
  CONTACT_CLASSIFY_OUTPUT_TOKENS,
  CONTACT_CLASSIFY_TIMEOUT_MS,
} from "@/lib/chat-limits";
import { tokenBreakdown } from "@/lib/chat-models";

const inquirySchema = z.object({
  category: z.enum(["consulting", "workshop", "mentorship", "collaboration", "general"]),
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

Then write a short personalized acknowledgment (2 to 4 sentences) the visitor will see on the website after submitting. Use their name if natural. Be warm and professional. Plain sentences, no em dashes. Do not promise specific timelines; say Majid Memari, PhD will follow up personally. That is the only form of his name you use: "Dr. Memari" belongs to the chat assistant, not to this form.

Name: ${input.name}
Message:
${input.message}`;
}

/** Characters the classification prompt will send, for the precharge estimate. */
export function inquiryPromptChars(input: { name: string; message: string }): number {
  return inquiryPrompt(input).length;
}

export async function classifyInquiry(input: {
  name: string;
  message: string;
  modelId: string;
}): Promise<InquiryClassification> {
  const { object, usage } = await generateObject({
    model: gateway(input.modelId),
    schema: inquirySchema,
    maxOutputTokens: CONTACT_CLASSIFY_OUTPUT_TOKENS,
    timeout: { totalMs: CONTACT_CLASSIFY_TIMEOUT_MS },
    providerOptions: {
      gateway: {
        tags: ["site:majidmemari", "feature:contact-classify", `env:${process.env.VERCEL_ENV ?? "dev"}`],
      },
    },
    prompt: inquiryPrompt(input),
  });
  const tokens = tokenBreakdown(usage);
  return {
    ...object,
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
