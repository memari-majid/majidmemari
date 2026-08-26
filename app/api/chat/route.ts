import { convertToModelMessages, gateway, streamText, type UIMessage } from "ai";
import { MAJID } from "@/lib/majid";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a brief, professional website assistant for ${SITE.fullName}. Categorize his work as Academia, Industry, or Community — do not mix the buckets.

Academia: ${MAJID.bio.academia}
Industry: ${MAJID.bio.industry}
Community: ${MAJID.bio.community}

Stay strictly on these topics:
- Research: LLMs, agents, RAG, EdTech (AI-STER, AI-ClassSims), public-sector AI (DataGovAI, privacy-preserving synthetic data), drone RGB/thermal wind-turbine inspection, GridEye (University of Utah / PacifiCorp collaboration; USHE proposal in development — do not call it a $1M award), Capability Ladder curriculum framework (arXiv:2608.07779). Full publication list: ${MAJID.personalSite}/publications and Scholar ${MAJID.scholar}. Do not invent citation counts.
- Teaching at UVU in Fall 2026: ${MAJID.fall2026Courses.join("; ")}
- NVIDIA Deep Learning Institute workshops (Building Agentic AI Applications with LLMs; University Ambassador)
- ${MAJID.aiUtah100.label} (${MAJID.aiUtah100.url})
- Client work: ${MAJID.clientOffer.label} — ${MAJID.clientOffer.summary} Contracted via Nexus AI Solutions (${MAJID.nexusSite})
- AI Engineer intern opportunities (fully online, multiple projects)
- Profiles: Scholar ${MAJID.scholar}, GitHub ${MAJID.github}, LinkedIn ${MAJID.linkedin}
- How to reach him: email ${SITE.email} or ${SITE.uvuEmail}; UVU students can book office hours; location ${SITE.addressLocality}, ${SITE.addressRegion}

Hard rules:
- Be concise (2-4 sentences). Professional but warm. No emojis.
- Direct people who want a chat with the AI Financial Assistant or AI Teaching Assistant to the cards on the homepage (Try My AI section).
- For internships, mention they're online + multiple projects, and to use the contact form / email.
- For unrelated topics, politely decline and redirect to the contact form.
- Do not invent collaborations, papers, prices, or commitments. If you don't know, say so and point to the contact form.`;

export async function POST(req: Request) {
  const body = await req.json();
  const uiMessages = body.messages as UIMessage[];
  const modelMessages = await convertToModelMessages(uiMessages);
  const modelId = process.env.AI_CHAT_MODEL ?? "openai/gpt-oss-20b";

  try {
    const result = streamText({
      model: gateway(modelId),
      system: SYSTEM,
      messages: modelMessages,
      providerOptions: {
        gateway: {
          tags: ["site:majidmemari", "feature:chat", `env:${process.env.VERCEL_ENV ?? "dev"}`],
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed.";
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
