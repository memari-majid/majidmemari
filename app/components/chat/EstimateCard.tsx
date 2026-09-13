"use client";

/**
 * How long a first useful version takes. Effort in calendar weeks, the phases
 * behind the range, and what moved it. Never a price and never a quote: the
 * caveat travels with the card.
 */

import { phaseOf, stepTitle, type ChatToolPart } from "@/app/components/chat/chat-ui";
import { CardShell, CopyButton, Field, ListField } from "@/app/components/chat/primitives";

export type EstimatePart = Extract<ChatToolPart, { type: "tool-estimateProject" }>;

type Phase = { title: string; weeksLow: number; weeksHigh: number };

type Estimate = {
  weeksLow: number;
  weeksHigh: number;
  bandLabel: string;
  shapeLabel: string;
  phases: Phase[];
  drivers: string[];
  caveat: string;
};

/** Outputs echo back from the client on later requests, so the shape is checked, never trusted. */
function estimateOf(output: unknown): Estimate | undefined {
  if (!output || typeof output !== "object") return undefined;
  const o = output as Record<string, unknown>;
  if (typeof o.weeksLow !== "number" || typeof o.weeksHigh !== "number") return undefined;
  const phases = Array.isArray(o.phases)
    ? o.phases.flatMap((p): Phase[] => {
        if (!p || typeof p !== "object") return [];
        const row = p as Record<string, unknown>;
        return typeof row.title === "string" &&
          typeof row.weeksLow === "number" &&
          typeof row.weeksHigh === "number"
          ? [{ title: row.title, weeksLow: row.weeksLow, weeksHigh: row.weeksHigh }]
          : [];
      })
    : [];
  return {
    weeksLow: o.weeksLow,
    weeksHigh: o.weeksHigh,
    bandLabel: typeof o.bandLabel === "string" ? o.bandLabel : "",
    shapeLabel: typeof o.shapeLabel === "string" ? o.shapeLabel : "",
    phases,
    drivers: Array.isArray(o.drivers) ? o.drivers.filter((d): d is string => typeof d === "string") : [],
    caveat: typeof o.caveat === "string" ? o.caveat : "",
  };
}

function estimateToClipboard(e: Estimate): string {
  const lines = [
    `Estimate: ${e.weeksLow} to ${e.weeksHigh} weeks to a first useful version`,
    e.shapeLabel ? `Shape: ${e.shapeLabel}` : "",
    e.bandLabel ? `Size: ${e.bandLabel}` : "",
    ...e.phases.map((p) => `- ${p.title}: ${p.weeksLow} to ${p.weeksHigh} weeks`),
    ...(e.drivers.length > 0 ? [`What drives it: ${e.drivers.join("; ")}`] : []),
    e.caveat,
  ];
  return lines.filter(Boolean).join("\n");
}

export function EstimateCard({ part }: { part: EstimatePart }) {
  const phase = phaseOf(part);
  const estimate = part.state === "output-available" ? estimateOf(part.output) : undefined;
  const objective =
    part.input && typeof part.input === "object" && typeof part.input.objective === "string"
      ? part.input.objective
      : undefined;

  return (
    <CardShell title={stepTitle("estimateProject", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The estimate did not complete. Ask for it again.</p>
      ) : (
        <>
          <Field label="Scope" text={objective} />
          {!estimate ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Sizing the first useful version.</p>
          ) : (
            <>
              <p>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {estimate.weeksLow} to {estimate.weeksHigh} weeks
                </span>{" "}
                to a first version people actually use
                {estimate.bandLabel ? `, ${estimate.bandLabel.toLowerCase()}` : ""}.
              </p>
              {estimate.shapeLabel && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{estimate.shapeLabel}</p>
              )}
              {estimate.phases.length > 0 && (
                <dl className="space-y-1">
                  {estimate.phases.map((p) => (
                    <div key={p.title} className="grid min-w-0 grid-cols-[1fr_auto] gap-x-3">
                      <dt className="min-w-0 break-words">{p.title}</dt>
                      <dd className="shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {p.weeksLow} to {p.weeksHigh} w
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <ListField label="What drives the range" items={estimate.drivers} />
              {estimate.caveat && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{estimate.caveat}</p>
              )}
              <CopyButton text={() => estimateToClipboard(estimate)} />
            </>
          )}
        </>
      )}
    </CardShell>
  );
}
