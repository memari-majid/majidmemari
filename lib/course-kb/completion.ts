import type { CourseMessageMetadata } from "./types";

/** Browser-safe presentation of completion state, independent of model prose. */
export function courseCompletionNotice(metadata: CourseMessageMetadata | undefined, interrupted = false): string | null {
  if (metadata?.finishReason === "length") return "This response reached its length limit and may be incomplete. Ask the Learning Companion to finish the table or explain the remaining step.";
  if (interrupted || (metadata?.finishReason && metadata.finishReason !== "stop")) return "This response did not finish normally and may be incomplete. Retry the question or ask a focused follow-up before relying on it.";
  return null;
}
