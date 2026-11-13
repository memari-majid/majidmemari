import { createUIMessageStream, createUIMessageStreamResponse, gateway, NoObjectGeneratedError, streamText, type LanguageModel } from "ai";
import { courseAccess, courseClientKey, isCourseCodeAccepted } from "./access";
import { buildCourseSystemPrompt } from "./prompt";
import { courseRetrievalQuery, courseSources, retrieveCourseChunks } from "./retrieve";
import { COURSE_LIMITS, CourseRequestError, readCourseRequest, validateCourseMessages } from "./validation";
import type { CourseChatMessage } from "./types";
import { normalizeCoursePage } from "./context";
import { learningActivity, learningContextChunks, learningPrompt, validateLearningRequest } from "./learning";
import { COURSE_CHUNKS } from "./generated";
import { asksAboutUnsharedShiftResult, SHIFT_TRACE_NOT_SHARED, shiftCoachContext } from './shift-coach';
import { selectShiftDiagnosticQuestion } from './shift-coach-model';

const UNAVAILABLE = "The Learning Companion is temporarily unavailable. Your course lessons remain available; please try again later.";
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
    if (origin && origin !== new URL(req.url).origin) return errorResponse(403, "Open the Learning Companion on this website.");
    if (!isCourseCodeAccepted(settings.code, req.headers.get("x-course-code"))) return errorResponse(401, "Enter the course access code from your instructor.");
    const release = access.acquire(courseClientKey(req));
    if (!release) return errorResponse(429, "The Learning Companion is busy or you have sent several questions. Please wait a few minutes and try again.");
    try {
      const body = await readCourseRequest(req);
      if (body && typeof body === 'object' && 'shiftCoach' in body) {
        const keys = Object.keys(body);
        if (keys.some(key => !['lesson', 'delivery', 'shiftCoach'].includes(key)) || !('lesson' in body) || body.lesson !== 'unit-04.html' || ('delivery' in body && body.delivery !== 'canvas')) throw new CourseRequestError(400, 'Share only the current rehearsal snapshot through its diagnostic question control.');
        const activity = learningActivity('unit-04.html');
        if (!activity || activity.mode !== 'shift-run') throw new CourseRequestError(409, 'Reopen the current workflow rehearsal before sharing an interpretation.');
        const context = shiftCoachContext(activity, body.shiftCoach);
        if (req.signal.aborted) throw new CourseRequestError(499, 'The diagnostic request was cancelled. The written question remains available.');
        const signal = AbortSignal.any([req.signal, AbortSignal.timeout(50000)]);
        const modelId = settings.model || "anthropic/claude-haiku-5.5";
        try {
          const answer = await selectShiftDiagnosticQuestion({ context, model: getModel(modelId), modelId, signal, environment: settings.environment });
          release();
          return Response.json(answer, { headers: { 'Cache-Control': 'no-store' } });
        } catch (error) {
          release();
          if (req.signal.aborted) return errorResponse(499, 'The diagnostic request was cancelled. Use the written question to continue.');
          if (error instanceof CourseRequestError || NoObjectGeneratedError.isInstance(error)) return errorResponse(422, 'The diagnostic focus could not be checked. Use the written question; no repair request was made.');
          return errorResponse(503, 'The diagnostic service is unavailable. Use the written question beside your saved explanation.');
        }
      }
      const messages = validateCourseMessages(body);
      const lesson = normalizeCoursePage(body && typeof body === "object" && "lesson" in body ? body.lesson : "");
      const canvasDelivery = !!(body && typeof body === "object" && "delivery" in body && body.delivery === "canvas");
      const learning = validateLearningRequest(body && typeof body === "object" && "learning" in body ? body.learning : undefined, lesson);
      if (!learning && asksAboutUnsharedShiftResult(lesson, messages.at(-1)?.content ?? '')) {
        release();
        const stream = createUIMessageStream<CourseChatMessage>({ execute({ writer }) {
          writer.write({ type: 'start' }); writer.write({ type: 'text-start', id: 'unshared-trace' });
          writer.write({ type: 'text-delta', id: 'unshared-trace', delta: SHIFT_TRACE_NOT_SHARED });
          writer.write({ type: 'text-end', id: 'unshared-trace' }); writer.write({ type: 'finish' });
        } });
        return createUIMessageStreamResponse({ stream, headers: { 'Cache-Control': 'no-store' } });
      }
      const lab = learning ? learningActivity(lesson) : undefined;
      const chunks = learning && lab
        ? learningContextChunks(COURSE_CHUNKS, lab, learning)
        : retrieveCourseChunks(courseRetrievalQuery(messages), 6, lesson);
      const learningMetadata = learning ? { learningPhase: learning.phase } : undefined;
      const sources = courseSources(chunks);
      if (!chunks.length) {
        release();
        const stream = createUIMessageStream<CourseChatMessage>({ execute({ writer }) {
          writer.write({ type: "start", ...(learningMetadata ? { messageMetadata: learningMetadata } : {}) }); writer.write({ type: "text-start", id: "guidance" });
          writer.write({ type: "text-delta", id: "guidance", delta: "I could not find a relevant passage in the public course materials. Tell me the unit, milestone, or concept you are working on, and share your specific question or attempt. I can help you reason through it; I cannot access private records or your instructor’s current calendar." });
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
          writer.write({ type: "start", ...(learningMetadata ? { messageMetadata: learningMetadata } : {}) });
          for (const source of sources) writer.write({ type: "source-url", ...source });
          const result = streamText({
            model: getModel(modelId), system: buildCourseSystemPrompt(chunks, lesson, canvasDelivery) + (learning && lab ? `\n\n${learningPrompt(lab, learning)}` : ""), messages,
            maxOutputTokens: COURSE_LIMITS.outputTokens, maxRetries: 0, abortSignal: signal,
            onFinish: release, onAbort: release, onError: () => { release(); },
            providerOptions: { gateway: { tags: ["site:majidmemari", "feature:course-ta", `env:${settings.environment ?? "dev"}`] } },
          });
          writer.merge(result.toUIMessageStream<CourseChatMessage>({
            sendStart: false, sendReasoning: false, sendSources: false, onError: () => UNAVAILABLE,
            messageMetadata: ({ part }) => part.type === "finish" ? { finishReason: part.finishReason, ...learningMetadata } : undefined,
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
