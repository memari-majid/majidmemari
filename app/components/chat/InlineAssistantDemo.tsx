"use client";

/**
 * The assistant as a product on the page, not a bubble in the corner.
 *
 * It runs the real agent against the real route: same transcript as the
 * floating panel, same tools, same per-reply cost line. Three tabs, one fixed
 * height. The body never grows with the conversation, so the section below it
 * never moves while a visitor is reading.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  ConversationView,
  useConversation,
} from "@/app/components/chat/ConversationView";
import {
  APPROVAL_TOOL_NAMES,
  INLINE_DEMO_BODY_HEIGHT,
  TOOL_CAPABILITY_COPY,
} from "@/app/components/chat/chat-ui";
import {
  hydrateModelFromStorage,
  OPEN_CHAT_EVENT,
  usePanelOpen,
} from "@/app/components/chat/chatStore";
import { EvalPanel } from "@/app/components/chat/EvalPanel";
import { ModelPicker } from "@/app/components/chat/ModelPicker";
import {
  ASSISTANT_BADGE,
  ASSISTANT_NAME,
  FOUNDER_CHAT_NAME,
} from "@/lib/chat-persona";
import {
  EMAIL_PER_IP_PER_DAY,
  IP_DAILY_BUDGET_USD,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/chat-limits";

const TABS = [
  { key: "chat", label: "Chat" },
  { key: "tools", label: "What it does" },
  { key: "evals", label: "Evaluations" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
  const [tab, setTab] = useState<TabKey>("chat");
  const prefix = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState<{ key: string; text: string } | undefined>(undefined);

  // The saved model pick lands after mount, so the server and the first client
  // render agree on the seeded one.
  useEffect(() => {
    hydrateModelFromStorage();
  }, []);

  function onTabKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.key);
    const buttons = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[TABS.findIndex((t) => t.key === next.key)]?.focus();
  }

  return (
    <div className="card flex min-w-0 flex-col overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-start gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
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
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            The first product I ship, running live on this page. Ask it a real question: it consults,
            drafts, scores, and asks before it sends anything.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-64">
          <ModelPicker id={`${prefix}-model`} />
        </div>
      </div>

      {/* The tablist holds tabs and nothing else; the run controls sit beside it. */}
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label={`${ASSISTANT_NAME} demo`}
          onKeyDown={onTabKeyDown}
          className="flex min-w-0 gap-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${prefix}-tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`${prefix}-panel-${t.key}`}
              tabIndex={tab === t.key ? 0 : -1}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition motion-reduce:transition-none ${
                tab === t.key
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/*
          The one live region for this surface, mounted here rather than inside
          the chat tabpanel: an unselected tabpanel is hidden with
          `display: none`, which takes it out of the accessibility tree, so a
          reply that finishes while the visitor is reading another tab would be
          announced nowhere. The text is keyed by reply, so two replies that
          happen to use the same words are two different elements and the
          second one is announced too. It goes quiet, rather than unmounting,
          while the floating panel is open and announcing for both.
        */}
        <div
          role="status"
          aria-live={panelOpen ? "off" : "polite"}
          aria-atomic="true"
          className="sr-only"
        >
          {announcement && <p key={announcement.key}>{announcement.text}</p>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
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
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
            className="hidden text-xs text-zinc-600 hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Open in the corner
          </button>
        </div>
      </div>

      {/*
        Fixed, predictable height, capped against the viewport at every
        breakpoint: the transcript scrolls inside it, the composer stays above
        the fold on a short laptop, and the page below never moves as the
        conversation grows.
      */}
      <div className={`flex min-w-0 flex-col ${INLINE_DEMO_BODY_HEIGHT}`}>
        <div
          role="tabpanel"
          id={`${prefix}-panel-chat`}
          aria-labelledby={`${prefix}-tab-chat`}
          className={tab === "chat" ? "flex min-h-0 min-w-0 flex-1 flex-col" : "hidden"}
        >
          <ConversationView
            chat={chat}
            idPrefix={`${prefix}-inline`}
            /* Handed to the region above the panels; the panel takes over announcing while it is open. */
            onAnnounce={setAnnouncement}
            variant="inline"
          />
        </div>

        <div
          role="tabpanel"
          id={`${prefix}-panel-tools`}
          aria-labelledby={`${prefix}-tab-tools`}
          /* Scrollable and, unlike the chat panel, with nothing focusable inside: without a tab stop there is no way in and no way to scroll it from the keyboard. */
          tabIndex={tab === "tools" ? 0 : -1}
          className={tab === "tools" ? "min-h-0 min-w-0 flex-1 overflow-y-auto" : "hidden"}
        >
          <div className="min-w-0 space-y-4 px-4 py-4">
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Tools it can actually run in this window. Anything that leaves the browser shows you the
              exact contents first and waits for your tap.
            </p>
            <ul className="space-y-3">
              {Object.entries(TOOL_CAPABILITY_COPY).map(([name, copy]) => (
                <li key={name} className="min-w-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{copy.title}</p>
                    {APPROVAL_TOOL_NAMES.includes(name) && (
                      <span className="rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-900/60 dark:text-amber-400">
                        Your approval
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{copy.line}</p>
                </li>
              ))}
            </ul>
            <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">What it costs and what it will not do</p>
              <p>
                Every reply prints its own model, latency, tokens and cost. Each visitor gets{" "}
                {RATE_LIMIT_PER_MINUTE} requests a minute and about ${IP_DAILY_BUDGET_USD.toFixed(2)} of model
                spend a day, and the site falls back to the cheaper model once the daily budget is reached.
              </p>
              <p>
                Email is not switched on in production, so a send reports that nothing went out rather
                than pretending it did, and a hand-off is capped at {EMAIL_PER_IP_PER_DAY} a day per visitor.
                It is an AI, not {FOUNDER_CHAT_NAME}, and it will not quote a price or promise a date.
              </p>
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${prefix}-panel-evals`}
          aria-labelledby={`${prefix}-tab-evals`}
          /* Same rule: the panel scrolls, so it gets a tab stop of its own rather than relying on the controls that happen to sit inside it. */
          tabIndex={tab === "evals" ? 0 : -1}
          className={tab === "evals" ? "min-h-0 min-w-0 flex-1 overflow-y-auto" : "hidden"}
        >
          <EvalPanel />
        </div>
      </div>
    </div>
  );
}
