"use client";

/** UVU students and academic contacts get office hours; consulting goes through the hand-off. */

import { stepTitle, type Phase } from "@/app/components/chat/chat-ui";
import { CardShell } from "@/app/components/chat/primitives";
import { FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import { SITE } from "@/lib/site";

export function OfficeHoursCard({ phase }: { phase: Phase }) {
  return (
    <CardShell title={stepTitle("offerOfficeHours", phase)} phase={phase}>
      <p>
        For students and academic contacts, the quickest route is {FOUNDER_CHAT_NAME}&apos;s office hours at
        UVU.
      </p>
      {phase !== "failed" && (
        <a
          href={SITE.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary btn-compact inline-flex text-xs"
        >
          Book office hours
        </a>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Consulting questions go through the hand-off instead.
      </p>
    </CardShell>
  );
}
