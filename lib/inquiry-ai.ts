import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const inquirySchema = z.object({
  category: z.enum(["consulting", "workshop", "mentorship", "collaboration", "general"]),
  autoReply: z.string().max(550),
});

export type InquiryCategory = z.infer<typeof inquirySchema>["category"];

export async function classifyInquiry(input: {
  name: string;
  message: string;
  apiKey: string;
  modelId: string;
}) {
  const openai = createOpenAI({ apiKey: input.apiKey });
  const { object } = await generateObject({
    model: openai(input.modelId),
    schema: inquirySchema,
    prompt: `You are the intake assistant for the personal website of Dr. Majid Memari (AI engineer, NVIDIA Ambassador, Assistant Professor at Utah Valley University, Principal AI Architect at the Gary R. Herbert Institute for Public Policy).

Classify this contact form message into exactly one category:
- consulting: AI/ML strategy, integration, custom AI builds, public-sector AI, paid engagements
- workshop: NVIDIA DLI, university GPU training, instructor-led workshops, campus invitations
- mentorship: student internships, AI Engineer Intern role, applying to work with him, resume
- collaboration: research collaboration, joint project, partnership, vendor inquiry
- general: other or unclear

Then write a short personalized acknowledgment (2–4 sentences) the visitor will see on the website after submitting. Use their name if natural. Be warm and professional. Do not promise specific timelines; say Dr. Memari will follow up personally.

Name: ${input.name}
Message:
${input.message}`,
  });
  return object;
}

export function fallbackInquiryResponse(): { category: InquiryCategory; autoReply: string } {
  return {
    category: "general",
    autoReply:
      "Thanks for reaching out. Your message was received — Dr. Memari will follow up personally as soon as he can.",
  };
}
