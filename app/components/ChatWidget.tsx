"use client";

/**
 * The floating launcher and the dialog it opens. The transcript, the cards and
 * the composer come from the shared view, so this panel and the inline demo on
 * the homepage are the same conversation: open the panel mid-demo and it
 * continues where it was.
 *
 * Fit rules, non negotiable:
 * - the panel never exceeds the viewport: its height is capped in `dvh` minus
 *   its own insets, the composer is pinned, and the transcript scrolls inside,
 * - below `sm` it is a full-screen sheet measured in `dvh` with safe-area
 *   padding, so the composer clears the browser chrome and the keyboard,
 * - nothing inside may widen the page: every bubble and card carries
 *   `min-w-0`.
 *
 * Accessibility kept intact: focus moves in and back out, Escape closes, Tab
 * cycles inside, one polite live region announces each finished reply once,
 * the input is labelled, and the page behind the sheet is locked in a way iOS
 * Safari respects.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ConversationView,
  useConversation,
} from "@/app/components/chat/ConversationView";
import {
  OPEN_CHAT_EVENT,
  setPanelOpen,
  useInlineDemoInView,
} from "@/app/components/chat/chatStore";
import { ASSISTANT_BADGE, ASSISTANT_BLURB, ASSISTANT_NAME } from "@/lib/chat-persona";

export { OPEN_CHAT_EVENT };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Tabbable elements inside the dialog in DOM order, skipping anything not rendered. */
function focusableIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("hidden") && el.getClientRects().length > 0,
  );
}

/** Mirrors Tailwind's `sm`: below it the dialog is a full-screen sheet, above it a floating panel. */
const SHEET_PANEL_QUERY = "(min-width: 40rem)";

/**
 * Inline styles that freeze the page behind the full-screen sheet, including on
 * iOS Safari, which scrolls straight through `overflow: hidden`. The negative
 * top keeps the page where it was; the widget puts the offset back on release.
 */
function lockedBodyStyle(scrollY: number): Record<string, string> {
  const top = Number.isFinite(scrollY) && scrollY > 0 ? Math.round(scrollY) : 0;
  return {
    position: "fixed",
    top: `-${top}px`,
    left: "0",
    right: "0",
    width: "100%",
    overflow: "hidden",
  };
}

export function ChatWidget() {
  const chat = useConversation();
  const [open, setOpen] = useState(false);
  // On a phone the launcher sat on the inline demo's Send button (`chatStore.ts`).
  const demoInView = useInlineDemoInView();
  const [announcement, setAnnouncement] = useState<{ key: string; text: string } | undefined>(undefined);
  const prefix = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  /**
   * Whatever had focus when the dialog opened: the launcher, or a page CTA that
   * dispatched the open-chat event. Focus goes back there on close.
   */
  const openerRef = useRef<HTMLElement | null>(null);

  const openDialog = useCallback(() => {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setOpen(true);
  }, []);

  // The inline demo keeps its live region mounted and silent while this panel
  // is open, so a finished reply is announced once, by one region. Closing also
  // drops whatever this panel last announced: the view remounts with the dialog
  // and seeds itself quiet, so a stale reply left in the region would be read
  // out again the next time the panel opens.
  useEffect(() => {
    setPanelOpen(open);
    if (!open) setAnnouncement(undefined);
    return () => setPanelOpen(false);
  }, [open]);

  // Focus follows the dialog: the input takes it on open (the first control
  // when the input is locked), and on close it goes back to whatever opened the
  // dialog, falling back to the launcher when that element is gone or hidden.
  // A keyboard or screen-reader visitor is never dropped at the top of the page.
  useEffect(() => {
    if (open) {
      const field = inputRef.current;
      if (field && !field.disabled) field.focus({ preventScroll: true });
      else focusableIn(dialogRef.current)[0]?.focus({ preventScroll: true });
    } else if (wasOpenRef.current) {
      const opener = openerRef.current;
      const usable = !!opener && opener.isConnected && opener.getClientRects().length > 0;
      (usable ? opener : launcherRef.current)?.focus({ preventScroll: true });
      openerRef.current = null;
    }
    wasOpenRef.current = open;
  }, [open]);

  // Escape closes; Tab and Shift+Tab cycle inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (e.isComposing) return;
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusableIn(dialogRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && dialogRef.current?.contains(active);
      if (!inside) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Below `sm` the dialog is a full-screen sheet, so the page behind it is
  // pinned while it is open: iOS Safari scrolls straight through
  // `overflow: hidden`, so the body is fixed in place at its current offset and
  // restored, inline styles and scroll position both, on close. The floating
  // panel on wider screens leaves the page alone, which keeps the desktop
  // layout from jumping sideways when the scrollbar disappears.
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(SHEET_PANEL_QUERY);
    const body = document.body;
    let lock: { scrollY: number; previous: [string, string][] } | undefined;
    const release = () => {
      if (!lock) return;
      for (const [name, value] of lock.previous) {
        if (value) body.style.setProperty(name, value);
        else body.style.removeProperty(name);
      }
      window.scrollTo({ top: lock.scrollY, behavior: "instant" });
      lock = undefined;
    };
    const sync = () => {
      if (media.matches) {
        release();
        return;
      }
      if (lock) return;
      const scrollY = window.scrollY;
      const style = lockedBodyStyle(scrollY);
      lock = {
        scrollY,
        previous: Object.keys(style).map((name): [string, string] => [name, body.style.getPropertyValue(name)]),
      };
      for (const [name, value] of Object.entries(style)) body.style.setProperty(name, value);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      release();
    };
  }, [open]);

  // Any CTA (for example the hero "Start a conversation" button) can open the chat.
  useEffect(() => {
    const onOpen = () => openDialog();
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, [openDialog]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={openDialog}
        className={`fixed z-[60] flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-zinc-50 motion-reduce:transition-none dark:focus:ring-offset-zinc-950 ${open ? "hidden" : ""} ${demoInView ? "max-sm:hidden" : ""} bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]`}
        aria-label={`Open the ${ASSISTANT_NAME}`}
        aria-haspopup="dialog"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m9.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[70] flex h-[100dvh] items-stretch justify-end overflow-hidden bg-black/50 p-0 pt-[env(safe-area-inset-top)] sm:items-end sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${prefix}-title`}
        >
          <div className="flex h-full max-h-full w-full min-w-0 max-w-[100vw] flex-col overflow-hidden rounded-none border-0 border-zinc-200 bg-white shadow-2xl sm:h-[min(640px,calc(100dvh-2rem))] sm:max-w-md sm:rounded-2xl sm:border dark:border-zinc-800 dark:bg-zinc-950 md:h-[min(640px,calc(100dvh-3rem))]">
            <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`${prefix}-title`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {ASSISTANT_NAME}
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
                    {ASSISTANT_BADGE}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{ASSISTANT_BLURB}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label="Close chat"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/*
              The panel's own live region lives here, beside the view rather
              than inside it. Same shape as the inline chat: keyed by reply, so
              two replies that happen to use the same words are two different
              elements and the second one is announced too.
            */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {announcement && <p key={announcement.key}>{announcement.text}</p>}
            </div>

            <ConversationView
              chat={chat}
              idPrefix={`${prefix}-panel`}
              onAnnounce={setAnnouncement}
              variant="panel"
              inputRef={inputRef}
            />
          </div>
        </div>
      )}
    </>
  );
}
