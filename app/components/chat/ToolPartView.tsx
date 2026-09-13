"use client";

/**
 * One tool part, one card. The switch covers the tools this site ships today;
 * anything else renders from its streamed input, so a tool added on the server
 * shows the visitor real content instead of a bare step name, and an
 * approval-gated one still asks before it sends.
 */

import {
  APPROVAL_TOOL_NAMES,
  inputRows,
  phaseOf,
  stepTitle,
  toolNameOf,
  type ChatToolPart,
} from "@/app/components/chat/chat-ui";
import { BriefCard } from "@/app/components/chat/BriefCard";
import { DeliveryCard, type Attachments } from "@/app/components/chat/DeliveryCard";
import { EstimateCard } from "@/app/components/chat/EstimateCard";
import { FactsCard } from "@/app/components/chat/FactsCard";
import { OfficeHoursCard } from "@/app/components/chat/OfficeHoursCard";
import { OutreachCard } from "@/app/components/chat/OutreachCard";
import { ReadinessCard } from "@/app/components/chat/ReadinessCard";
import { WorkshopCard } from "@/app/components/chat/WorkshopCard";
import { CardShell, Row } from "@/app/components/chat/primitives";

function GenericToolCard({ part }: { part: ChatToolPart }) {
  const name = toolNameOf(part);
  const phase = phaseOf(part);
  const rows = inputRows(part.input);
  return (
    <CardShell title={stepTitle(name, phase)} phase={phase}>
      {rows.length > 0 && (
        <dl className="space-y-1 text-xs">
          {rows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </dl>
      )}
      {phase === "failed" && <p>This step did not complete.</p>}
    </CardShell>
  );
}

export function ToolPartView({
  part,
  attachments,
  busy,
  onRespond,
  onRetry,
}: {
  part: ChatToolPart;
  attachments: Attachments;
  busy: boolean;
  onRespond: (id: string, approved: boolean) => void;
  onRetry: () => void;
}) {
  const name = toolNameOf(part);

  // Older or renamed tool ids still get a sensible card.
  if (name === "offerBookingLink") return <OfficeHoursCard phase={phaseOf(part)} />;

  if (APPROVAL_TOOL_NAMES.includes(name) || part.state === "approval-requested") {
    return (
      <DeliveryCard part={part} attachments={attachments} busy={busy} onRespond={onRespond} onRetry={onRetry} />
    );
  }

  switch (part.type) {
    case "tool-lookupSiteFacts":
      return <FactsCard part={part} />;
    case "tool-recommendWorkshop":
      return <WorkshopCard part={part} />;
    case "tool-draftConsultingBrief":
      return <BriefCard part={part} />;
    case "tool-assessReadiness":
      return <ReadinessCard part={part} />;
    case "tool-estimateProject":
      return <EstimateCard part={part} />;
    case "tool-draftOutreachNote":
      return <OutreachCard part={part} />;
    case "tool-offerOfficeHours":
      return <OfficeHoursCard phase={phaseOf(part)} />;
    default:
      return <GenericToolCard part={part} />;
  }
}
