"use client";

/** The training pick, from the real catalog. Titles the tool did not return never appear. */

import { phaseOf, safeHref, stepTitle, type ChatToolPart } from "@/app/components/chat/chat-ui";
import { CardShell } from "@/app/components/chat/primitives";

export type WorkshopPart = Extract<ChatToolPart, { type: "tool-recommendWorkshop" }>;

type Pick = { title: string; url?: string; track?: string; taught?: boolean; why?: string; alternatives: string[] };

function pickOf(output: unknown): Pick | undefined {
  if (!output || typeof output !== "object") return undefined;
  const o = output as Record<string, unknown>;
  if (typeof o.title !== "string" || !o.title) return undefined;
  return {
    title: o.title,
    url: safeHref(o.url),
    track: typeof o.track === "string" ? o.track : undefined,
    taught: o.taught === true,
    why: typeof o.why === "string" ? o.why : undefined,
    alternatives: Array.isArray(o.alternatives)
      ? o.alternatives.filter((a): a is string => typeof a === "string")
      : [],
  };
}

export function WorkshopCard({ part }: { part: WorkshopPart }) {
  const phase = phaseOf(part);
  const pick = part.state === "output-available" ? pickOf(part.output) : undefined;

  return (
    <CardShell title={stepTitle("recommendWorkshop", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The match did not complete. Tell me a bit more about the team and I will try again.</p>
      ) : !pick ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Matching the catalog to what you described.</p>
      ) : (
        <>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{pick.title}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {[pick.track, pick.taught ? "taught in person" : "can be arranged"].filter(Boolean).join(" · ")}
          </p>
          {pick.why && <p className="whitespace-pre-wrap break-words">{pick.why}</p>}
          {pick.url && (
            <a
              href={pick.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-compact inline-flex text-xs"
            >
              Course page
            </a>
          )}
          {pick.alternatives.length > 0 && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Also worth a look: {pick.alternatives.join(", ")}
            </p>
          )}
        </>
      )}
    </CardShell>
  );
}
