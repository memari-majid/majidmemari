/**
 * The short note the assistant drafts for the visitor to send to someone
 * else: a manager, a director, a client, or their own team.
 *
 * The model writes it, the card renders it, and the visitor copies it. It is
 * never sent from here: this site does not email a third party on a visitor's
 * say-so. The only addresses the assistant can ever send to are the visitor's
 * own and the founder's inbox.
 *
 * Client-safe: zod and pure functions.
 */

import { z } from "zod";

export const OUTREACH_AUDIENCES = ["manager", "executive", "team", "client", "peer"] as const;

export type OutreachAudience = (typeof OUTREACH_AUDIENCES)[number];

export const AUDIENCE_LABEL: Record<OutreachAudience, string> = {
  manager: "Their manager",
  executive: "An executive sponsor",
  team: "Their own team",
  client: "A client or partner",
  peer: "A peer in another team",
};

export const outreachNoteSchema = z.object({
  audience: z
    .enum(OUTREACH_AUDIENCES)
    .describe("Who the visitor has to convince, from what they said in this conversation"),
  subject: z
    .string()
    .max(160)
    .describe("Subject line, under 70 characters, no trailing period"),
  body: z
    .string()
    .max(1400)
    .describe(
      "The note itself, in the visitor's voice, plain text, three short paragraphs at most. Target 700 characters. State the problem, what is being proposed, and what it needs. No markdown, no em dashes, no invented numbers, and never a price.",
    ),
  asks: z
    .array(z.string().max(200).describe("One concrete thing being asked for, under 100 characters"))
    .min(1)
    .max(3)
    .describe("What the reader is actually being asked to approve, fund, or decide"),
});

export type OutreachNote = z.infer<typeof outreachNoteSchema>;

/** Keys in render order; the card walks this list. */
export const OUTREACH_KEYS = ["audience", "subject", "body", "asks"] as const satisfies readonly (keyof OutreachNote)[];

export function outreachWordCount(note: OutreachNote): number {
  return note.body.trim().split(/\s+/).filter(Boolean).length;
}

/** Compact text for the model after the card is shown. */
export function outreachToText(note: OutreachNote): string {
  return `A note to ${AUDIENCE_LABEL[note.audience].toLowerCase()} was drafted and shown as a card, subject "${note.subject.trim()}", about ${outreachWordCount(note)} words, asking for: ${note.asks.map((a) => a.trim()).join("; ")}. Do not repeat it in text. Tell the visitor it is theirs to copy and edit, and ask whether the ask is right.`;
}
