"use client";

/**
 * What the reply cost, in the open. Compact by default, full breakdown on
 * click. It renders only once the finish metadata (`totalMs`) has landed, so a
 * bare model name never sits under a reply that is still streaming and the
 * line does not change width later.
 */

import { Fragment, useState } from "react";
import {
  formatMs,
  formatStatsLine,
  formatTokens,
  type ChatMessageMetadata,
} from "@/lib/chat-metadata";
import { findModel, formatUsd } from "@/lib/chat-models";

function statRows(meta: ChatMessageMetadata): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const model = findModel(meta.model);
  if (meta.model) rows.push({ label: "Model", value: model ? `${model.label} (${meta.model})` : meta.model });
  // One row, however many reasons: rows are keyed by label, and two rows
  // called "Why this model" would collide.
  const why: string[] = [];
  if (meta.budgetFallback) {
    why.push(
      `The daily budget was reached, so ${findModel(meta.requestedModel)?.label ?? "the model you picked"} was swapped for the fallback.`,
    );
  }
  if (meta.errorFallback) {
    why.push(
      `${findModel(meta.requestedModel)?.label ?? "The model you picked"} returned an error on this turn, so ${model?.label ?? "the fallback"} took over. Both calls are counted in the cost below.`,
    );
  }
  if (why.length > 0) rows.push({ label: "Why this model", value: why.join(" ") });
  if (meta.ttftMs != null) rows.push({ label: "First token", value: formatMs(meta.ttftMs) });
  if (meta.totalMs != null) rows.push({ label: "Total time", value: formatMs(meta.totalMs) });
  if (meta.tokens) {
    const t = meta.tokens;
    rows.push({
      label: "Input tokens",
      value: `${formatTokens(t.input)} new${t.cacheRead ? `, ${formatTokens(t.cacheRead)} cached` : ""}${t.cacheWrite ? `, ${formatTokens(t.cacheWrite)} cache write` : ""}`,
    });
    rows.push({
      label: "Output tokens",
      value: `${formatTokens(t.output)}${t.reasoning ? ` (${formatTokens(t.reasoning)} reasoning)` : ""}`,
    });
    rows.push({ label: "Total tokens", value: formatTokens(t.total) });
  }
  if (meta.costUsd != null) {
    rows.push({
      label: "Cost",
      value: `${formatUsd(meta.costUsd)} at list price${model ? ` ($${model.inputPerM} in, $${model.outputPerM} out per 1M)` : ""}`,
    });
  }
  if (meta.steps != null) {
    rows.push({ label: "Steps", value: `${meta.steps}${meta.toolCalls ? ` (${meta.toolCalls} tool calls)` : ""}` });
  }
  if (meta.finishReason) rows.push({ label: "Finish", value: meta.finishReason });
  return rows;
}

export function StatLine({ meta }: { meta: ChatMessageMetadata | undefined }) {
  const [full, setFull] = useState(false);
  const line = formatStatsLine(meta);
  if (!meta || meta.totalMs == null || !line) return null;
  const rows = full ? statRows(meta) : [];
  return (
    <div className="mr-4 min-w-0 px-1">
      <button
        type="button"
        onClick={() => setFull((v) => !v)}
        aria-expanded={full}
        className="text-left text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {line}
      </button>
      {full && rows.length > 0 && (
        <dl className="mt-1 grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          {rows.map((r) => (
            <Fragment key={r.label}>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">{r.label}</dt>
              <dd className="min-w-0 break-words">{r.value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}
