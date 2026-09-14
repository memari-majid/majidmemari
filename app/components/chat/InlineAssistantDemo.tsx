"use client";

/**
 * The assistant on the page, not only a bubble in the corner.
 *
 * It runs the same agent against the same route as the floating panel, on
 * the same transcript: start here, open the panel, and the conversation
 * continues. One chat view at a fixed height. The body never grows with the
 * conversation, so the section below it never moves while a visitor is
 * reading.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  ConversationView,
  useConversation,
} from "@/app/components/chat/ConversationView";
import { INLINE_DEMO_BODY_HEIGHT } from "@/app/components/chat/chat-ui";
import { setInlineDemoInView, usePanelOpen } from "@/app/components/chat/chatStore";
import { ASSISTANT_BADGE, ASSISTANT_NAME } from "@/lib/chat-persona";

function AssistantMark() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m9.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  );
}

export function InlineAssistantDemo() {
  const chat = useConversation();
  const panelOpen = usePanelOpen();
  const prefix = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState<{ key: string; text: string } | undefined>(undefined);

  // While any part of this card is on screen the fixed launcher and the
  // scroll-to-top button hide below `sm` (`chatStore.ts` says why). Cleared
  // on unmount so leaving the page never leaves them hidden.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInlineDemoInView(entry?.isIntersecting === true));
    observer.observe(el);
    return () => {
      observer.disconnect();
      setInlineDemoInView(false);
    };
  }, []);

  return (
    <div ref={cardRef} className="card flex min-w-0 flex-col overflow-hidden">
      <div className="flex min-w-0 items-start gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
          <AssistantMark />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Consulting agent
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{ASSISTANT_NAME}</h3>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
              {ASSISTANT_BADGE}
            </span>
          </div>
          {/*
            Hidden below `sm`: on a 360x640 phone the header has to stay short
            or the composer drops below the fold while the card header is in
            view. The section heading above the card already says what this is.
          */}
          <p className="mt-2 hidden text-sm leading-relaxed text-zinc-600 sm:block dark:text-zinc-400">
            Ask it a real question about AI for your team. It gives straight guidance and asks before
            it sends anything.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          {chat.busy && (
            <button
              type="button"
              onClick={chat.stop}
              className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Stop
            </button>
          )}
          {chat.messages.length > 0 && (
            <button
              type="button"
              onClick={chat.reset}
              disabled={chat.busy}
              className="text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              New
            </button>
          )}
        </div>
      </div>

      {/*
        The chat live region for this surface, mounted beside the view. The
        text is keyed by reply, so two replies that happen to use the same
        words are two different elements and the second one is announced too.
        It goes quiet, rather than unmounting, while the floating panel is open
        and announcing for both.
      */}
      <div
        role="status"
        aria-live={panelOpen ? "off" : "polite"}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement && <p key={announcement.key}>{announcement.text}</p>}
      </div>

      {/*
        Fixed, predictable height, capped against the viewport at every
        breakpoint: the transcript scrolls inside it, the composer stays above
        the fold on a short laptop, and the page below never moves as the
        conversation grows.
      */}
      <div className={`flex min-w-0 flex-col ${INLINE_DEMO_BODY_HEIGHT}`}>
        <ConversationView
          chat={chat}
          idPrefix={`${prefix}-inline`}
          onAnnounce={setAnnouncement}
          variant="inline"
        />
      </div>
    </div>
  );
}
