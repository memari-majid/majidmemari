import type { UIMessage } from "ai";
import { COURSE_LIMITS } from "./limits";

/** Prepare a bounded text-only suffix for the next request, keeping full messages
 * and citations in the UI state. Failed, source-only assistant turns are omitted.
 * There are no server imports: this helper runs in the browser and in unit tests. */
export function prepareCourseHistory(messages: readonly UIMessage[]): UIMessage[] {
  const textOnly: UIMessage[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = message.parts.filter(part => part.type === "text").map(part => part.type === "text" ? part.text : "").join("\n").trim();
    if (!text) continue;
    const maximum = message.role === "user" ? COURSE_LIMITS.messageCharacters : COURSE_LIMITS.assistantCharacters;
    textOnly.push({ id: message.id.slice(0, 256), role: message.role, parts: [{ type: "text", text: text.slice(0, maximum) }] });
  }
  const encoder = new TextEncoder(); let selected: UIMessage[] = [], characters = 0;
  for (let index = textOnly.length - 1; index >= 0; index -= 1) {
    const message = textOnly[index];
    const length = message.parts.reduce((n, part) => n + (part.type === "text" ? part.text.length : 0), 0);
    const candidate = [message, ...selected];
    if (candidate.length > COURSE_LIMITS.messages || characters + length > COURSE_LIMITS.totalCharacters || encoder.encode(JSON.stringify({ messages: candidate })).byteLength > COURSE_LIMITS.bodyBytes) break;
    selected = candidate; characters += length;
  }
  return selected;
}
