"use client";

/**
 * Grounded facts, with the module each one came from. This is the card that
 * shows the agent is answering from the site rather than from memory, so the
 * source label is part of the content, not a footnote.
 */

import { phaseOf, safeHref, stepTitle, type ChatToolPart } from "@/app/components/chat/chat-ui";
import { CardShell } from "@/app/components/chat/primitives";

export type FactsPart = Extract<ChatToolPart, { type: "tool-lookupSiteFacts" }>;

type Fact = { label: string; text: string; source: string; url?: string };

/** Outputs echo back from the client on later requests, so the shape is checked, never trusted. */
function factsOf(output: unknown): Fact[] {
  if (!output || typeof output !== "object") return [];
  const raw = (output as { facts?: unknown }).facts;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): Fact[] => {
    if (!item || typeof item !== "object") return [];
    const f = item as Record<string, unknown>;
    if (typeof f.label !== "string" || typeof f.text !== "string") return [];
    return [
      {
        label: f.label,
        text: f.text,
        source: typeof f.source === "string" ? f.source : "",
        ...(safeHref(f.url) ? { url: safeHref(f.url) } : {}),
      },
    ];
  });
}

export function FactsCard({ part }: { part: FactsPart }) {
  const phase = phaseOf(part);
  const facts = part.state === "output-available" ? factsOf(part.output) : [];

  return (
    <CardShell title={stepTitle("lookupSiteFacts", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The lookup did not complete, so nothing here is grounded. Ask again.</p>
      ) : facts.length === 0 ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {phase === "done" ? "Nothing on this site covers that." : "Checking what this site states."}
        </p>
      ) : (
        <ul className="space-y-2">
          {facts.map((fact, i) => (
            <li key={`${fact.label}-${i}`} className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{fact.label}</p>
              <p className="whitespace-pre-wrap break-words">{fact.text}</p>
              {fact.source && (
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                  Source: {fact.url ? (
                    <a
                      href={fact.url}
                      className="underline decoration-zinc-300 underline-offset-4 dark:decoration-zinc-600"
                    >
                      {fact.source}
                    </a>
                  ) : (
                    fact.source
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
