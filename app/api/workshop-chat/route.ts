import { convertToModelMessages, gateway, streamText, type UIMessage } from "ai";
import { allowWorkshopChat, isWorkshopCodeAccepted } from "@/lib/workshop-kb/access";
import { buildWorkshopSystemPrompt } from "@/lib/workshop-kb/prompt";
import { retrieveChunks } from "@/lib/workshop-kb/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

const CODE_ERROR = "Enter the workshop code from your instructor.";
const RATE_ERROR = "Too many questions. Wait a few minutes and try again.";

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function latestUserText(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || message.role !== "user") continue;
    const text = (message.parts ?? [])
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

export async function POST(req: Request) {
  if (!isWorkshopCodeAccepted(process.env.WORKSHOP_TA_CODE, req.headers.get("x-workshop-code"))) {
    return jsonError(401, CODE_ERROR);
  }

  if (!allowWorkshopChat(clientIp(req))) {
    return jsonError(429, RATE_ERROR);
  }

  try {
    const body = await req.json();
    const uiMessages = body.messages as UIMessage[];
    if (!Array.isArray(uiMessages)) {
      return jsonError(503, "Chat request failed.");
    }

    const modelMessages = await convertToModelMessages(uiMessages);
    const modelId = process.env.WORKSHOP_TA_MODEL ?? "anthropic/claude-haiku-4.5";
    const chunks = retrieveChunks(latestUserText(uiMessages));

    const result = streamText({
      model: gateway(modelId),
      system: buildWorkshopSystemPrompt(chunks),
      messages: modelMessages,
      providerOptions: {
        gateway: {
          tags: ["site:majidmemari", "feature:workshop-ta", `env:${process.env.VERCEL_ENV ?? "dev"}`],
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed.";
    return jsonError(503, message);
  }
}
