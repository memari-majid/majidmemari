"use client";

/**
 * The visitor picks the model. Two shells can be on the page at once, so the
 * `id` is required and comes from the surface's `useId()` prefix: a hardcoded
 * id would point one `<label htmlFor>` at the other shell's `<select>`.
 */

import { priceLabel } from "@/app/components/chat/chat-ui";
import { setModelId, useModelId } from "@/app/components/chat/chatStore";
import { CHAT_MODELS } from "@/lib/chat-models";

export function ModelPicker({ id, className = "" }: { id: string; className?: string }) {
  const modelId = useModelId();
  return (
    <>
      <label htmlFor={id} className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
        Model
      </label>
      <select
        id={id}
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        className={`min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-sky-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${className}`}
      >
        {CHAT_MODELS.map((m) => (
          <option key={m.id} value={m.id} title={m.note}>
            {priceLabel(m)}
          </option>
        ))}
      </select>
    </>
  );
}
