import { convertToModelMessages, gateway, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { MAJID } from "@/lib/majid";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Model and budget controls. Every knob that costs money lives here so it can
 * be reviewed, and taught, in one place.
 *
 * - CHAT_MODEL: gateway slug from the Vercel env (`AI_CHAT_MODEL`). Production
 *   runs Claude Opus 5 (see AI-WEBSITES-HANDOFF.md). The code default matches,
 *   so a missing env var never silently downgrades the experience.
 * - Input caps bound what one request may send to the model.
 * - MAX_OUTPUT_TOKENS bounds the reply. On reasoning models it also bounds the
 *   thinking that precedes the reply, so it leaves room for both.
 * - The per-IP limiter is a best-effort backstop inside one warm instance;
 *   durable quotas belong in the Vercel WAF or an Upstash-backed limiter.
 */
const CHAT_MODEL = process.env.AI_CHAT_MODEL || "anthropic/claude-opus-5";
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_TEXT_PART = 4_000;
const MAX_CHARS_TOTAL = 12_000;
const MAX_OUTPUT_TOKENS = 2_000;
const RL_WINDOW_MS = 60_000;
const RL_MAX = 20;

const rlHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rlHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  recent.push(now);
  rlHits.set(ip, recent);
  if (rlHits.size > 5_000) {
    for (const [key, hits] of rlHits) {
      if (hits.every((t) => now - t >= RL_WINDOW_MS)) rlHits.delete(key);
    }
  }
  return recent.length > RL_MAX;
}

/** Only user and assistant turns are accepted, so a client cannot inject system messages. */
const partSchema = z.looseObject({
  type: z.string().max(64),
  text: z.string().max(MAX_CHARS_PER_TEXT_PART).optional(),
});
const messageSchema = z.looseObject({
  id: z.string().max(128).optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(partSchema).max(50),
});
const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SYSTEM = `You are the AI assistant on ${SITE.fullName}'s personal site. Majid is an AI Scientist and Solution Architect who specializes in generative AI (LLMs, agents, RAG). THE MAIN PURPOSE of this site is selling his services: generative-AI consulting and team training. Lead with that.

YOUR JOB, IN ORDER — CONSULT FIRST, DO NOT SELL FIRST:
1) Understand the visitor: what they do, what they want to do with AI, and where they are stuck. Ask one or two short questions.
2) Give genuinely useful AI guidance, including when the honest answer is they may not need AI for it. This is real consulting and it has value; never call it free.
3) Only once you understand the need, offer his services: generative-AI consulting and team training. ${MAJID.clientOffer.summary} Gen AI is the specialty. He delivers NVIDIA DLI Gen AI workshops in person as a Certified Instructor, or customized Gen AI training when a standard course is not the fit — not limited to NVIDIA's courses. Client work is contracted via Nexus AI Solutions (${MAJID.nexusSite}). To move forward, point them to the contact form or email ${SITE.email}. Never promise prices, dates, or a call.
Do not open by pitching or reciting credentials. Earn it by being useful first.

He can speak to his background when asked. Keep the three buckets separate and do not mix them:
Academia: ${MAJID.bio.academia}
Industry: ${MAJID.bio.industry}
Community: ${MAJID.bio.community}

Facts you may share when relevant (never invent beyond these):
- Research: LLMs, agents, RAG, EdTech (AI-STER, AI-ClassSims), public-sector AI (DataGovAI, privacy-preserving synthetic data), drone RGB/thermal wind-turbine inspection, GridEye (University of Utah / PacifiCorp; USHE proposal in development — do not call it a $1M award), the Capability Ladder curriculum framework (arXiv:2608.07779). Publications: ${MAJID.personalSite}/publications and Scholar ${MAJID.scholar}. Never invent citation counts.
- Teaching at UVU in Fall 2026: ${MAJID.fall2026Courses.join("; ")}. Featured: he designed and teaches ${MAJID.cs4720r.title}: ${MAJID.cs4720r.tagline} — ${MAJID.cs4720r.summary} Never mention UVU catalog numbers or course codes, and do not invent industry-partner names.
- NVIDIA DLI (Building Agentic AI Applications with LLMs; Certified Instructor and University Ambassador). Listing: ${MAJID.nvidiaInstructorDirectory}
- ${MAJID.aiUtah100.label} (${MAJID.aiUtah100.url})
- AI Engineer intern opportunities (fully online, multiple projects) — point to the contact form / email.
- To try his shipped AI, point to the "Try My AI" cards on the homepage (AI Financial Assistant and AI Teaching Assistant).
- Reach him: email ${SITE.email} or ${SITE.uvuEmail}; location ${SITE.addressLocality}, ${SITE.addressRegion}.

Hard rules:
- Sound like a person, not a bot: react to what they said in a phrase before you ask anything, ask one question at a time, and vary your rhythm.
- Plain text only: no markdown, no asterisks, no headings (the chat window does not render formatting). For a short list, start each line with a dash.
- Brief by default (2-4 sentences), professional and warm, no emojis. When the visitor asks a substantive technical or strategy question, give a complete, specific answer: what you would do first, the trade-offs, and a realistic sense of effort. Use a short bullet list only when comparing options.
- Consulting and training are the lead offer; do not bury them, and do not jump straight to a pitch.
- Never invent collaborations, papers, prices, dates, or commitments. If you do not know, say so and point to the contact form / ${SITE.email}.
- For unrelated topics, politely decline and redirect to his AI work.`;

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) {
    return json(429, {
      error: "You're sending messages pretty fast. Give it a few seconds and try again.",
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "Invalid request body." });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json(400, { error: "Invalid request body." });

  const totalChars = parsed.data.messages.reduce(
    (sum, m) =>
      sum + m.parts.reduce((s, p) => s + (p.type === "text" && p.text ? p.text.length : 0), 0),
    0,
  );
  if (totalChars > MAX_CHARS_TOTAL) {
    return json(413, { error: "This conversation is getting long. Please start a new chat." });
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(parsed.data.messages as unknown as UIMessage[]);
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const turns = parsed.data.messages.length;
  const result = streamText({
    model: gateway(CHAT_MODEL),
    system: SYSTEM,
    messages: modelMessages,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: {
      gateway: {
        tags: ["site:majidmemari", "feature:chat", `env:${process.env.VERCEL_ENV ?? "dev"}`],
      },
    },
    // One structured line per request so usage can be graphed from Vercel logs.
    onFinish: ({ totalUsage, finishReason, steps }) => {
      console.log(
        JSON.stringify({
          event: "chat.usage",
          site: "majidmemari",
          model: CHAT_MODEL,
          turns,
          inputTokens: totalUsage.inputTokens,
          cachedInputTokens: totalUsage.cachedInputTokens,
          outputTokens: totalUsage.outputTokens,
          reasoningTokens: totalUsage.reasoningTokens,
          totalTokens: totalUsage.totalTokens,
          steps: steps.length,
          finishReason,
        }),
      );
    },
  });

  return result.toUIMessageStreamResponse({
    // Never stream provider error text to visitors; log it and show a plain fallback.
    onError: (error) => {
      console.error("[chat] stream error:", error);
      return "Chat is unavailable right now. Please use the contact form instead.";
    },
  });
}
