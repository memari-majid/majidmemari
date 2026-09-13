"use client";

/** The five-dimension readiness snapshot, with the streamed scores until the final one lands. */

import {
  isReadinessSnapshot,
  phaseOf,
  stepTitle,
  type ChatToolPart,
  type DeepPartial,
} from "@/app/components/chat/chat-ui";
import { CardShell, CopyButton, Field } from "@/app/components/chat/primitives";
import {
  clampScore,
  READINESS_DIMENSIONS,
  SCORE_MAX,
  type ReadinessInput,
  type ReadinessSnapshot,
} from "@/lib/readiness";

export type ReadinessPart = Extract<ChatToolPart, { type: "tool-assessReadiness" }>;

type ReadinessRow = { key: string; label: string; score: number; note: string };

function snapshotToText(snapshot: ReadinessSnapshot, rows: ReadinessRow[]): string {
  const lines = [`AI readiness: ${snapshot.label} (${snapshot.overall} of ${SCORE_MAX})`];
  if (typeof snapshot.context === "string" && snapshot.context) lines.push(`Use case: ${snapshot.context}`);
  for (const r of rows) lines.push(`- ${r.label}: ${r.score}/${SCORE_MAX}${r.note ? `. ${r.note}` : ""}`);
  if (typeof snapshot.summary === "string") lines.push(snapshot.summary);
  lines.push(`Next step: ${snapshot.nextStep}`);
  return lines.join("\n");
}

export function ReadinessCard({ part }: { part: ReadinessPart }) {
  const phase = phaseOf(part);
  const snapshot =
    part.state === "output-available" && isReadinessSnapshot(part.output) ? part.output : undefined;
  const input: DeepPartial<ReadinessInput> | undefined = part.input;

  // The finished snapshot wins; while the model is still streaming scores, show what has arrived.
  const rows: ReadinessRow[] = snapshot
    ? snapshot.dimensions.flatMap((d) =>
        d && typeof d.label === "string"
          ? [
              {
                key: String(d.key),
                label: d.label,
                score: clampScore(d.score),
                note: typeof d.note === "string" ? d.note : "",
              },
            ]
          : [],
      )
    : READINESS_DIMENSIONS.flatMap((d) => {
        const item = input?.[d.key];
        if (!item || typeof item.score !== "number") return [];
        return [{ key: d.key, label: d.label, score: clampScore(item.score), note: item.note ?? "" }];
      });

  const percent =
    snapshot && typeof snapshot.percent === "number"
      ? Math.min(100, Math.max(0, Math.round(snapshot.percent)))
      : undefined;

  return (
    <CardShell title={stepTitle("assessReadiness", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The readiness check did not complete. Ask for it again.</p>
      ) : (
        <>
          {typeof input?.context === "string" && input.context && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{input.context}</p>
          )}
          {snapshot && (
            <p>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.label}</span>,{" "}
              {snapshot.overall} of {SCORE_MAX}.
              {typeof snapshot.summary === "string" ? ` ${snapshot.summary}` : ""}
            </p>
          )}
          {percent !== undefined && (
            <div aria-hidden="true" className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
            </div>
          )}
          {rows.length > 0 && (
            <dl className="space-y-1.5">
              {rows.map((r) => (
                <div key={r.key} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="min-w-0 break-words text-zinc-900 dark:text-zinc-100">{r.label}</dt>
                    <dd className="shrink-0 font-mono tracking-wider text-sky-700 dark:text-sky-400">
                      <span aria-hidden="true">
                        {"●".repeat(r.score)}
                        {"○".repeat(SCORE_MAX - r.score)}
                      </span>
                      <span className="sr-only">
                        {r.score} of {SCORE_MAX}
                      </span>
                    </dd>
                  </div>
                  {r.note && <dd className="text-xs text-zinc-600 dark:text-zinc-400">{r.note}</dd>}
                </div>
              ))}
            </dl>
          )}
          {snapshot && <Field label="Next step" text={snapshot.nextStep} />}
          {snapshot && <CopyButton text={() => snapshotToText(snapshot, rows)} />}
        </>
      )}
    </CardShell>
  );
}
