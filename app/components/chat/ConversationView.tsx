"use client";

/**
 * The transcript and the composer, shared by the floating panel and the inline
 * demo. Both render this against the same `Chat` instance, so a conversation
 * started in the demo continues in the panel and back again.
 *
 * Fit rules that hold on every viewport:
 * - the parent sets the height; this view fills it, scrolls internally, and
 *   never grows the page as the conversation grows,
 * - the composer is pinned and always visible,
 * - every bubble and card carries `min-w-0` and wraps or scrolls inside its
 *   own container, so nothing can push the page sideways.
 */

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  formatChatConfigMessage,
  hasPendingApproval,
  hasStalledApproval,
  lastReplyText,
  prefersReducedMotion,
  sanitizeChips,
  segmentsOf,
  splitSuggestions,
  textFromMessage,
} from "@/app/components/chat/chat-ui";
import { getChat } from "@/app/components/chat/chatStore";
import { ToolPartView } from "@/app/components/chat/ToolPartView";
import type { Attachments } from "@/app/components/chat/DeliveryCard";
import { ASSISTANT_DISCLAIMER, ASSISTANT_INTRO, ASSISTANT_NAME } from "@/lib/chat-persona";
import type { ChatUIMessage } from "@/lib/chat-tools";
import { SITE } from "@/lib/site";

export const QUICK_PROMPTS = [
  "We're exploring where AI fits",
  "We have a project in mind",
  "We want to train our team",
];

export type Conversation = ReturnType<typeof useConversation>;

/** Everything both surfaces need from the shared conversation, derived once. */
export function useConversation() {
  const { messages, sendMessage, status, stop, error, setMessages, clearError, addToolApprovalResponse } =
    useChat<ChatUIMessage>({ chat: getChat() });

  const busy = status === "streaming" || status === "submitted";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const awaitingApproval = hasPendingApproval(lastAssistant);
  const stalledApproval = hasStalledApproval(lastAssistant, busy);
  const inputLocked = busy || awaitingApproval || stalledApproval;

  const usedChips = messages.filter((m) => m.role === "user").map((m) => textFromMessage(m));
  const chips =
    !inputLocked && lastAssistant
      ? sanitizeChips(splitSuggestions(textFromMessage(lastAssistant)).suggestions, usedChips)
      : [];

  const attachments: Attachments = {
    brief: messages.some((m) =>
      m.parts.some((p) => p.type === "tool-draftConsultingBrief" && p.state === "output-available"),
    ),
    readiness: messages.some((m) =>
      m.parts.some((p) => p.type === "tool-assessReadiness" && p.state === "output-available"),
    ),
  };

  return {
    messages,
    status,
    busy,
    error,
    chips,
    attachments,
    lastAssistant,
    awaitingApproval,
    stalledApproval,
    inputLocked,
    send: (text: string) => {
      void sendMessage({ text });
    },
    /** Re-posts the transcript as is; the approved send in its final step is then executed by the server. */
    retry: () => {
      void sendMessage();
    },
    stop: () => {
      void stop();
    },
    respond: (id: string, approved: boolean) => {
      void addToolApprovalResponse({ id, approved });
    },
    reset: () => {
      setMessages([]);
      clearError();
    },
  };
}

export function ConversationView({
  chat,
  idPrefix,
  onAnnounce,
  variant,
  inputRef,
  intro,
  footer,
}: {
  chat: Conversation;
  idPrefix: string;
  /**
   * Handed each finished reply once. The live region itself belongs to the
   * frame, not to this view: inside the inline demo this view sits in a
   * tabpanel that is hidden with `display: none` whenever another tab is
   * selected, and a hidden region is out of the accessibility tree, so a reply
   * that lands while the visitor is reading another tab would be announced
   * nowhere. The frame renders one region outside the panels instead.
   */
  onAnnounce?: (announcement: { key: string; text: string }) => void;
  variant: "panel" | "inline";
  inputRef?: RefObject<HTMLInputElement | null>;
  intro?: ReactNode;
  footer?: ReactNode;
}) {
  const { messages, status, busy, error, chips, attachments, lastAssistant, inputLocked } = chat;
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** The panel passes its own ref so it can focus the composer on open; the inline demo keeps this one. */
  const localInputRef = useRef<HTMLInputElement>(null);
  const fieldRef = inputRef ?? localInputRef;
  /** Measured while the visitor scrolls, never in the message effect where the new content is already in the DOM. */
  const nearBottomRef = useRef(true);
  const firstRunRef = useRef(true);
  /** Whether the last thing focused was inside this surface, and whether it was when the composer locked. */
  const focusInsideRef = useRef(false);
  const hadFocusRef = useRef(false);

  /*
   * What this surface has already announced. Seeded during the first render
   * with whatever is already on screen, so opening the panel onto an existing
   * conversation does not read the last reply out again. `null` means not yet
   * seeded; `undefined` means seeded with nothing to announce.
   */
  const announcedRef = useRef<string | null | undefined>(null);
  if (announcedRef.current === null) {
    announcedRef.current = lastAssistant ? lastReplyText(lastAssistant)?.key : undefined;
  }

  /*
   * `scrollIntoView` scrolls every scrollable ancestor including the document,
   * which would yank the page to the inline demo on mount and on every
   * message. The scroller moves itself instead.
   */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = firstRunRef.current;
    firstRunRef.current = false;
    if (first) {
      if (messages.length > 0) el.scrollTop = el.scrollHeight;
      return;
    }
    if (!nearBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages]);

  // Each completed reply reaches the frame's polite live region once, after the
  // stream has finished, so a screen reader hears the whole answer rather than
  // every streamed fragment. The ref advances whether or not anyone is
  // listening, so a surface that was silent does not replay its backlog.
  useEffect(() => {
    if (status !== "ready" || !lastAssistant) return;
    const reply = lastReplyText(lastAssistant);
    if (!reply || !reply.text || announcedRef.current === reply.key) return;
    announcedRef.current = reply.key;
    onAnnounce?.(reply);
  }, [status, lastAssistant, onAnnounce]);

  // Whether the last thing focused was inside this surface. `focusin` is the
  // only reliable signal: when the composer is disabled mid-stream the browser
  // drops focus to the body without firing anything useful.
  useEffect(() => {
    const onFocusIn = () => {
      const el = containerRef.current;
      focusInsideRef.current = !!el && el.contains(document.activeElement);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  // Disabling the composer while a reply streams drops focus to the page. Once
  // it is usable again, and only if this surface held focus when it locked,
  // bring it back so the next message can be typed straight away. Never scrolls,
  // and never steals focus from a control the visitor moved to in the meantime.
  useEffect(() => {
    if (inputLocked) {
      hadFocusRef.current = focusInsideRef.current;
      return;
    }
    if (!hadFocusRef.current) return;
    const active = document.activeElement;
    if (active && active !== document.body && containerRef.current?.contains(active)) return;
    fieldRef.current?.focus({ preventScroll: true });
  }, [inputLocked, fieldRef]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || inputLocked) return;
    chat.send(text);
    setInput("");
  }

  const composerPad =
    variant === "panel"
      ? "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      : "p-3";

  return (
    <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/*
        Announcing a reply is still the frame's job: it keeps a status region
        mounted outside anything that can be hidden, so assistive tech has
        registered it before a reply lands and still hears the reply when this
        view is the tab the visitor is not looking at. So this scroller takes
        role="log" for its name and role, with `aria-live="off"` so a streaming
        reply is not read out twice.

        The rest of it is reachability. The transcript scrolls but holds no
        focusable descendant, so without `tabIndex` a keyboard or switch-access
        visitor can send a message and then never scroll back to read the reply.
        tabIndex 0 makes it a tab stop the arrow keys and PageUp can scroll, and
        the inset ring says where focus went.
      */}
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="log"
        aria-live="off"
        aria-label={`Conversation with the ${ASSISTANT_NAME}`}
        onScroll={() => {
          const el = scrollerRef.current;
          if (!el) return;
          nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
        }}
        className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{intro ?? ASSISTANT_INTRO}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy}
                  onClick={() => chat.send(q)}
                  className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-800 transition hover:border-sky-500 hover:text-sky-800 disabled:opacity-50 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-sky-700 dark:hover:text-sky-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === "user") {
            const text = textFromMessage(m);
            if (!text.trim()) return null;
            return (
              <div
                key={m.id}
                className="ml-6 min-w-0 whitespace-pre-wrap break-words rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-zinc-900 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-zinc-100"
              >
                {text}
              </div>
            );
          }
          const segments = segmentsOf(m);
          if (segments.length === 0) return null;
          let lastTextIdx = -1;
          for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i].kind === "text") {
              lastTextIdx = i;
              break;
            }
          }
          return (
            <div key={m.id} className="min-w-0 space-y-2">
              {segments.map((seg, i) => {
                if (seg.kind === "tool") {
                  return (
                    <ToolPartView
                      key={seg.key}
                      part={seg.part}
                      attachments={attachments}
                      busy={busy}
                      onRespond={chat.respond}
                      onRetry={chat.retry}
                    />
                  );
                }
                const body = i === lastTextIdx ? splitSuggestions(seg.text).body : seg.text;
                if (!body.trim()) return null;
                return (
                  <div
                    key={seg.key}
                    className="mr-4 min-w-0 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300"
                  >
                    {body}
                  </div>
                );
              })}
            </div>
          );
        })}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => chat.send(s)}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:border-sky-500 hover:text-sky-700 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-700 dark:hover:text-sky-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="min-w-0 break-words text-xs text-amber-700 dark:text-amber-400">
            {formatChatConfigMessage(error.message) ||
              "Something went wrong. Try again or use the contact form."}
          </p>
        )}
      </div>

      <div className={`shrink-0 space-y-2 border-t border-zinc-200 dark:border-zinc-800 ${composerPad}`}>
        <form onSubmit={onSubmit} className="flex min-w-0 gap-2">
          <input
            ref={fieldRef}
            id={`${idPrefix}-input`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={`Message the ${ASSISTANT_NAME}`}
            placeholder={
              chat.awaitingApproval
                ? "Answer the card above to continue"
                : chat.stalledApproval
                  ? "Retry the send above, or start a new chat"
                  : "Type a message…"
            }
            className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-sky-600 focus:outline-none sm:min-h-0 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            disabled={inputLocked}
          />
          <button
            type="submit"
            disabled={inputLocked || !input.trim()}
            className="btn-primary btn-compact shrink-0 disabled:opacity-50"
          >
            Send
          </button>
        </form>
        {footer ?? (
          <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500">
            {ASSISTANT_DISCLAIMER} Trouble with chat? Email{" "}
            <a href={`mailto:${SITE.email}`} className="underline hover:text-zinc-800 dark:hover:text-zinc-300">
              {SITE.email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
