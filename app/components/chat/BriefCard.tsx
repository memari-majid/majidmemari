"use client";

/** The consulting brief, rendered from the tool input as it streams. */

import {
  phaseOf,
  stepTitle,
  type ChatToolPart,
  type DeepPartial,
} from "@/app/components/chat/chat-ui";
import { CardShell, CopyButton, Field, ListField } from "@/app/components/chat/primitives";
import {
  briefToText,
  consultingBriefSchema,
  EFFORT_LABEL,
  ENGAGEMENT_LABEL,
  type ConsultingBrief,
} from "@/lib/consulting-brief";

export type BriefPart = Extract<ChatToolPart, { type: "tool-draftConsultingBrief" }>;

export function BriefCard({ part }: { part: BriefPart }) {
  const phase = phaseOf(part);
  const brief: DeepPartial<ConsultingBrief> | undefined = part.input;
  const opportunities = (brief?.opportunities ?? []).flatMap((o) => (o ? [o] : []));
  const risks = (brief?.risks ?? []).flatMap((r) => (r ? [r] : []));
  const keepHuman = (brief?.keepHuman ?? []).flatMap((k) => (typeof k === "string" ? [k] : []));
  const questions = (brief?.openQuestions ?? []).flatMap((q) => (typeof q === "string" ? [q] : []));
  const engagement = brief?.engagement ? ENGAGEMENT_LABEL[brief.engagement] : undefined;

  return (
    <CardShell title={stepTitle("draftConsultingBrief", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The brief could not be drafted this time. Ask for it again.</p>
      ) : (
        <>
          {brief?.title && <p className="font-semibold text-zinc-900 dark:text-zinc-100">{brief.title}</p>}
          <Field label="Situation" text={brief?.situation} />
          <Field label="Goal" text={brief?.goal} />
          <ListField
            label="Where AI could help"
            items={opportunities.map(
              (o) =>
                `${o.title ?? ""}${o.effort && EFFORT_LABEL[o.effort] ? ` (${EFFORT_LABEL[o.effort].toLowerCase()})` : ""}${o.why ? `: ${o.why}` : ""}`,
            )}
          />
          <ListField
            label="Risks"
            items={risks.map((r) => `${r.title ?? ""}${r.mitigation ? `: ${r.mitigation}` : ""}`)}
          />
          <ListField label="Keep with people" items={keepHuman} />
          <Field label="First step" text={brief?.firstStep} />
          <ListField label="Open questions" items={questions} />
          {engagement && (
            <Field
              label="Suggested engagement"
              text={`${engagement}${brief?.engagementReason ? `. ${brief.engagementReason}` : ""}`}
            />
          )}
          {phase === "done" && (
            <CopyButton
              text={() => {
                const parsed = consultingBriefSchema.safeParse(part.input);
                return parsed.success ? briefToText(parsed.data) : undefined;
              }}
            />
          )}
        </>
      )}
    </CardShell>
  );
}
