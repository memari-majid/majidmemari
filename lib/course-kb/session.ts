import type { CourseChatMessage, CourseMessageMetadata } from "./types";
import { courseEvidenceLink, normalizeCoursePage } from "./context";
import { COURSE_LIMITS } from "./limits";

export const COURSE_SESSION_KEY = "ai-solutions-ta-conversation";
const VERSION = 2;
const MAX_BYTES = 200 * 1024;
const MAX_MESSAGES = 30;
const LEARNING_PHASES = new Set(['decide', 'investigate', 'revise', 'transfer']);
const FINISH_REASONS = new Set(["stop", "length", "content-filter", "tool-calls", "error", "other"]);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
export type CourseSession = { version: 2; lesson: string; messages: CourseChatMessage[] };

/** Restore a small, allowlisted UI shape, never arbitrary SDK tools/files or roles. */
export function normalizeCourseSession(value: unknown): CourseSession {
  const envelope = object(value) && value.version === VERSION ? value : undefined;
  // Validate legacy arrays as well; only safe text and course references survive migration.
  const candidates: unknown[] = envelope && Array.isArray(envelope.messages) ? envelope.messages : Array.isArray(value) ? value : [];
  const messages: CourseChatMessage[] = [];
  const ids = new Set<string>();
  for (const candidate of candidates.slice(-MAX_MESSAGES)) {
    if (!object(candidate) || typeof candidate.id !== "string" || !candidate.id || candidate.id.length > 256 || ids.has(candidate.id) || (candidate.role !== "user" && candidate.role !== "assistant") || !Array.isArray(candidate.parts) || candidate.parts.length > 24) continue;
    const parts: CourseChatMessage["parts"] = [];
    let remaining = candidate.role === "user" ? COURSE_LIMITS.messageCharacters : COURSE_LIMITS.assistantCharacters;
    for (const part of candidate.parts) {
      if (!object(part)) continue;
      if (part.type === "text" && typeof part.text === "string" && remaining > 0) {
        const text = part.text.slice(0, remaining); remaining -= text.length;
        if (text.trim()) parts.push({ type: "text", text });
      } else if (candidate.role === "assistant" && part.type === "source-url") {
        const url = courseEvidenceLink(part.url);
        if (url && typeof part.sourceId === "string" && part.sourceId.length <= 256) parts.push({ type: "source-url", sourceId: part.sourceId, url, title: typeof part.title === "string" ? part.title.slice(0, 300) : "Course material" });
      }
    }
    if (!parts.some(part => part.type === "text")) continue;
    let metadata: CourseMessageMetadata | undefined;
    if (object(candidate.metadata)) {
      metadata = {};
      if (candidate.role === "assistant" && typeof candidate.metadata.finishReason === "string" && FINISH_REASONS.has(candidate.metadata.finishReason)) metadata.finishReason = candidate.metadata.finishReason as CourseMessageMetadata["finishReason"];
      if (typeof candidate.metadata.learningPhase === "string" && LEARNING_PHASES.has(candidate.metadata.learningPhase)) metadata.learningPhase = candidate.metadata.learningPhase as CourseMessageMetadata["learningPhase"];
      if (candidate.role === "user" && candidate.metadata.requestInterrupted === true) metadata.requestInterrupted = true;
      if (!Object.keys(metadata).length) metadata = undefined;
    }
    messages.push({ id: candidate.id, role: candidate.role, parts, ...(metadata ? { metadata } : {}) });
    ids.add(candidate.id);
  }
  const session: CourseSession = { version: VERSION, lesson: normalizeCoursePage(envelope?.lesson), messages };
  while (session.messages.length && new TextEncoder().encode(JSON.stringify(session)).byteLength > MAX_BYTES) session.messages.shift();
  return session;
}

export function parseCourseSession(raw: string | null): CourseSession {
  if (!raw || raw.length > MAX_BYTES || new TextEncoder().encode(raw).byteLength > MAX_BYTES) return normalizeCourseSession(null);
  try { return normalizeCourseSession(JSON.parse(raw)); } catch { return normalizeCourseSession(null); }
}

export function serializeCourseSession(messages: readonly CourseChatMessage[], lesson: string, interrupted: ReadonlySet<string> = new Set(), unfinished = false): string {
  const latestQuestion = messages.map(message => message.role).lastIndexOf("user");
  const marked = messages.map((message, index) => {
    if (message.role === "assistant" && (interrupted.has(message.id) || (unfinished && index === messages.length - 1))) return { ...message, metadata: { ...message.metadata, finishReason: "error" } };
    if (message.role === "user" && unfinished && index === latestQuestion) return { ...message, metadata: { ...message.metadata, requestInterrupted: true } };
    return message;
  });
  return JSON.stringify(normalizeCourseSession({ version: VERSION, lesson, messages: marked }));
}

/** A React restore must commit before any save is allowed, including an empty save. */
export function shouldPersistCourseSession(hydrated: boolean, status: string): boolean {
  return hydrated && (status === "ready" || status === "error");
}
