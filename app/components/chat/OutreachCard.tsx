"use client";

/**
 * The note the visitor takes away: written in their voice, for their manager
 * or their team, theirs to copy and edit. It is a draft, not a send: nothing
 * here goes to a third party.
 */

import {
  phaseOf,
  stepTitle,
  type ChatToolPart,
  type DeepPartial,
} from "@/app/components/chat/chat-ui";
import { CardShell, CopyButton, ListField } from "@/app/components/chat/primitives";
import { AUDIENCE_LABEL, outreachNoteSchema, type OutreachNote } from "@/lib/outreach-note";

export type OutreachPart = Extract<ChatToolPart, { type: "tool-draftOutreachNote" }>;

export function OutreachCard({ part }: { part: OutreachPart }) {
  const phase = phaseOf(part);
  const note: DeepPartial<OutreachNote> | undefined = part.input;
  const asks = (note?.asks ?? []).flatMap((a) => (typeof a === "string" ? [a] : []));
  const audience = note?.audience ? AUDIENCE_LABEL[note.audience] : undefined;

  return (
    <CardShell title={stepTitle("draftOutreachNote", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The draft did not finish. Ask for it again.</p>
      ) : (
        <>
          {audience && <p className="text-xs text-zinc-600 dark:text-zinc-400">For: {audience.toLowerCase()}</p>}
          {note?.subject && (
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{note.subject}</p>
          )}
          {note?.body && (
            <p className="min-w-0 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/60">
              {note.body}
            </p>
          )}
          <ListField label="What it asks for" items={asks} />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            This is yours to copy and edit. Nothing was sent to anyone.
          </p>
          {phase === "done" && (
            <CopyButton
              text={() => {
                const parsed = outreachNoteSchema.safeParse(part.input);
                if (!parsed.success) return undefined;
                return `${parsed.data.subject}\n\n${parsed.data.body}`;
              }}
            />
          )}
        </>
      )}
    </CardShell>
  );
}
