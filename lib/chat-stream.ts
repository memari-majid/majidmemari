/**
 * Holds the chunks of one tool input until the input has parsed.
 *
 * The SDK streams `tool-input-start` and its deltas as the model writes the
 * JSON, then either `tool-input-available` or `tool-input-error`. An input
 * that fails to parse is the model's own mistake and the SDK already feeds
 * the error back so the model tries again; showing the visitor a "failed,
 * ask again" card for each attempt is noise they cannot act on. Measured
 * 2026-09-13 on this site: Opus wrote `estimateProject` twice as invalid JSON
 * before the third call landed, and the visitor saw two failed cards above
 * the estimate.
 *
 * So the chunks of an input are held until it resolves: an input that parsed
 * is flushed in order, and one that failed is dropped and reported to
 * `onDrop`. A card therefore appears once its input is complete rather than
 * filling in as it streams, a few seconds later than before. Anything still
 * held when the stream ends (an abort mid-input) is flushed by `flush()` so
 * the client is never left without the parts the stream started.
 *
 * Pure, so a script or the company repo's vitest can drive it with a chunk
 * list. Client-safe types only.
 */

import type { InferUIMessageChunk, UIMessage } from "ai";

export type ToolInputHold<CHUNK> = {
  /** Routes one chunk: held, flushed, dropped, or written straight through. */
  push(chunk: CHUNK): void;
  /** Writes whatever is still held, in order, and forgets it. */
  flush(): void;
};

export function holdToolInputs<MESSAGE extends UIMessage>(
  write: (chunk: InferUIMessageChunk<MESSAGE>) => void,
  onDrop: (dropped: { toolCallId: string; toolName: string; errorText: string }) => void,
): ToolInputHold<InferUIMessageChunk<MESSAGE>> {
  type Chunk = InferUIMessageChunk<MESSAGE>;
  const held = new Map<string, Chunk[]>();
  const idOf = (chunk: Chunk): string | undefined =>
    "toolCallId" in chunk && typeof chunk.toolCallId === "string" ? chunk.toolCallId : undefined;
  return {
    push(chunk) {
      const id = idOf(chunk);
      if (chunk.type === "tool-input-start" && id) {
        held.set(id, [chunk]);
        return;
      }
      if (chunk.type === "tool-input-delta" && id && held.has(id)) {
        held.get(id)?.push(chunk);
        return;
      }
      if (chunk.type === "tool-input-available" && id && held.has(id)) {
        for (const earlier of held.get(id) ?? []) write(earlier);
        held.delete(id);
        write(chunk);
        return;
      }
      if (chunk.type === "tool-input-error" && id) {
        held.delete(id);
        // The generic chunk union does not narrow on `type`; read the two fields structurally.
        const failed = chunk as { toolName?: unknown; errorText?: unknown };
        onDrop({
          toolCallId: id,
          toolName: typeof failed.toolName === "string" ? failed.toolName : "",
          errorText: typeof failed.errorText === "string" ? failed.errorText : "",
        });
        return;
      }
      write(chunk);
    },
    flush() {
      for (const chunks of held.values()) for (const chunk of chunks) write(chunk);
      held.clear();
    },
  };
}
