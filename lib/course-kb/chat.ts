import { createUIMessageStream, createUIMessageStreamResponse, gateway, streamText, type LanguageModel } from "ai";
import { courseAccess, courseClientKey, isCourseCodeAccepted } from "./access";
import { buildCourseSystemPrompt } from "./prompt";
import { courseRetrievalQuery, courseSources, retrieveCourseChunks } from "./retrieve";
import { COURSE_LIMITS, CourseRequestError, readCourseRequest, validateCourseMessages } from "./validation";
import type { CourseChatMessage } from "./types";
import { normalizeCoursePage } from "./context";

const UNAVAILABLE = "The teaching assistant is temporarily unavailable. Your course lessons remain available; please try again later.";
const errorResponse = (status: number, error: string) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "600" } : {}) } });

type CourseChatConfig = { code?: string; model?: string; environment?: string };
export function createCourseChatHandler(options: {
  model?: (id: string) => LanguageModel;
  access?: ReturnType<typeof import("./access").createCourseAccess>;
  config?: () => CourseChatConfig;
} = {}) {
  const getModel = options.model ?? gateway;
  const access = options.access ?? courseAccess;
  const config = options.config ?? (() => ({ code: process.env.COURSE_TA_CODE, model: process.env.COURSE_TA_MODEL || process.env.WORKSHOP_TA_MODEL, environment: process.env.VERCEL_ENV }));
  return async function POST(req: Request) {
    const settings = config();
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) return errorResponse(403, "Open the teaching assistant on this website.");
    if (!isCourseCodeAccepted(settings.code, req.headers.get("x-course-code"))) return errorResponse(401, "Enter the course access code from your instructor.");
    const release = access.acquire(courseClientKey(req));
    if (!release) return errorResponse(429, "The teaching assistant is busy or you have sent several questions. Please wait a few minutes and try again.");
    try {
      const body = await readCourseRequest(req);
      const messages = validateCourseMessages(body);
      const lesson = normalizeCoursePage(body && typeof body === "object" && "lesson" in body ? body.lesson : "");
      const canvasDelivery = !!(body && typeof body === "object" && "delivery" in body && body.delivery === "canvas");
      const chunks = retrieveCourseChunks(courseRetrievalQuery(messages), 6, lesson);
      const sources = courseSources(chunks);
      if (!chunks.length) {
        release();
        const stream = createUIMessageStream({ execute({ writer }) {
          writer.write({ type: "start" }); writer.write({ type: "text-start", id: "guidance" });
          writer.write({ type: "text-delta", id: "guidance", delta: "I could not find a relevant passage in the public course materials. Tell me the unit, milestone, or business concept you are working on, and share your specific question or attempt. I can help you reason through it; I cannot access private records or your instructor’s current calendar." });
          writer.write({ type: "text-end", id: "guidance" }); writer.write({ type: "finish" });
        } });
        return createUIMessageStreamResponse({ stream, headers: { "Cache-Control": "no-store" } });
      }
      const modelId = settings.model || "anthropic/claude-haiku-5.5";
      // Authentication follows the existing workshop route: Gateway API key or
      // Vercel OIDC on the server, never a browser credential.
      const signal = AbortSignal.any([req.signal, AbortSignal.timeout(50000)]);
      signal.addEventListener("abort", release, { once: true });
      const stream = createUIMessageStream<CourseChatMessage>({
        onError: () => { release(); return UNAVAILABLE; },
        onFinish: release,
        execute({ writer }) {
          writer.write({ type: "start" });
          for (const source of sources) writer.write({ type: "source-url", ...source });
          const result = streamText({
            model: getModel(modelId), system: buildCourseSystemPrompt(chunks, lesson, canvasDelivery), messages,
            maxOutputTokens: COURSE_LIMITS.outputTokens, maxRetries: 0, abortSignal: signal,
            onFinish: release, onAbort: release, onError: () => { release(); },
            providerOptions: { gateway: { tags: ["site:majidmemari", "feature:course-ta", `env:${settings.environment ?? "dev"}`] } },
          });
          writer.merge(result.toUIMessageStream<CourseChatMessage>({
            sendStart: false, sendReasoning: false, sendSources: false, onError: () => UNAVAILABLE,
            messageMetadata: ({ part }) => part.type === "finish" ? { finishReason: part.finishReason } : undefined,
          }));
        },
      });
      return createUIMessageStreamResponse({ stream, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      release();
      return error instanceof CourseRequestError ? errorResponse(error.status, error.message) : errorResponse(503, UNAVAILABLE);
    }
  }
}
