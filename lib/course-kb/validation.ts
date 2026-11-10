import type { CourseTurn } from "./types";
import { COURSE_LIMITS } from "./limits";
export { COURSE_LIMITS } from "./limits";

export class CourseRequestError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateCourseMessages(body: unknown): CourseTurn[] {
  if (!object(body) || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > COURSE_LIMITS.messages) throw new CourseRequestError(400, "Send between 1 and 16 conversation messages.");
  const result: CourseTurn[] = []; let total = 0;
  for (const message of body.messages) {
    if (!object(message) || (message.role !== "user" && message.role !== "assistant") || !Array.isArray(message.parts) || message.parts.length > 24) throw new CourseRequestError(400, "Only user and assistant text messages are supported.");
    const texts: string[] = [];
    for (const part of message.parts) {
      if (!object(part)) throw new CourseRequestError(400, "A conversation part is invalid.");
      if (part.type === "text" && typeof part.text === "string") texts.push(part.text);
      // The UI persists these server-created decorations. Discard them, never
      // accept their URLs/titles as model context or as new grounded citations.
      else if (message.role === "assistant" && (part.type === "source-url" || part.type === "step-start")) continue;
      else throw new CourseRequestError(400, "Only text is accepted; remove files, tools or unsupported message parts.");
    }
    const content = texts.join("\n").trim();
    const maximum = message.role === "user" ? COURSE_LIMITS.messageCharacters : COURSE_LIMITS.assistantCharacters;
    if (!content || content.length > maximum) throw new CourseRequestError(400, `Each ${message.role} message must contain 1–${maximum.toLocaleString("en-US")} characters of text.`);
    total += content.length;
    if (total > COURSE_LIMITS.totalCharacters) throw new CourseRequestError(400, "This conversation is too long. Start a new conversation.");
    result.push({ role: message.role, content });
  }
  if (result.at(-1)?.role !== "user") throw new CourseRequestError(400, "The final message must be your question.");
  return result;
}

export async function readCourseRequest(req: Request): Promise<unknown> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new CourseRequestError(400, "Send a JSON conversation.");
  if (Number(req.headers.get("content-length") ?? 0) > COURSE_LIMITS.bodyBytes) throw new CourseRequestError(413, "The conversation request is too large.");
  if (!req.body) throw new CourseRequestError(400, "The conversation is missing.");
  const reader = req.body.getReader(), decoder = new TextDecoder(); let bytes = 0, text = "";
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > COURSE_LIMITS.bodyBytes) { await reader.cancel(); throw new CourseRequestError(413, "The conversation request is too large."); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); } catch { throw new CourseRequestError(400, "The conversation JSON is invalid."); }
}
