import { gateway, generateObject } from "ai";
import { z } from "zod";

const inquirySchema = z.object({
  category: z.enum(["consulting", "workshop", "mentorship", "collaboration", "general"]),
  autoReply: z.string().max(550),
});

export type InquiryCategory = z.infer<typeof inquirySchema>["category"];

export async function classifyInquiry(input: { name: string; message: string; modelId: string }) {
  const { object } = await generateObject({
    model: gateway(input.modelId),
    schema: inquirySchema,
    providerOptions: {
      gateway: {
        tags: ["site:majidmemari", "feature:contact-classify", `env:${process.env.VERCEL_ENV ?? "dev"}`],
      },
    },
    prompt: `You are the intake assistant for the personal website of Dr. Majid Memari — Assistant Professor of Computer Science at Utah Valley University, NVIDIA University Ambassador, Principal AI Architect at the Gary R. Herbert Institute for Public Policy, and founder of Nexus AI Solutions LLC.

Classify this contact form message into exactly one category:
- consulting: AI consulting, adoption advice, architecture review, when to use AI, paid advisory
- workshop: workshops, team training, in-house training, NVIDIA DLI, campus invitations
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
