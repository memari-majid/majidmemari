"use client";

/**
 * One conversation, two surfaces.
 *
 * The inline chat on the homepage and the floating panel render the same
 * transcript: open the panel mid-conversation and it continues where it was.
 * That only works if both call `useChat({ chat })` against a single `Chat`
 * instance, which lives here.
 *
 * `@ai-sdk/react` builds its `ChatInit` only when `chat` is absent from the
 * hook options (`@ai-sdk/react/dist/index.js:202`), so passing an instance
 * makes the hook ignore `transport`, `sendAutomaticallyWhen`, `onData`,
 * `onFinish`, `onError` and `onToolCall`. They typecheck and are dropped at
 * runtime. Everything therefore goes on the `new Chat({...})` call below, and
 * `Chat` comes from `@ai-sdk/react`: `ai` does not export it.
 *
 * The client sends no model and reads no per-reply metadata: the route picks
 * the model and keeps its accounting in the server log (owner decision,
 * 2026-09-13).
 */

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useSyncExternalStore } from "react";
import type { ChatUIMessage } from "@/lib/chat-tools";
import { chatFetch } from "@/app/components/chat/chat-ui";

/** Any CTA can open the panel by dispatching this event on window. */
export const OPEN_CHAT_EVENT = "majid:open-chat";

/* ---------- panel ---------- */

let panelOpen = false;
const panelListeners = new Set<() => void>();

export function setPanelOpen(open: boolean) {
  if (open === panelOpen) return;
  panelOpen = open;
  for (const listener of panelListeners) listener();
}

function subscribePanel(listener: () => void) {
  panelListeners.add(listener);
  return () => {
    panelListeners.delete(listener);
  };
}

/**
 * Both surfaces keep a live region mounted. Unmounting the inline one while
 * the panel is open makes several screen readers re-announce the last reply
 * when the panel closes and the region is re-inserted with content, so the
 * inline region stays mounted and goes quiet instead.
 */
export function usePanelOpen(): boolean {
  return useSyncExternalStore(
    subscribePanel,
    () => panelOpen,
    () => false,
  );
}

/* ---------- inline chat visibility ---------- */

let inlineDemoInView = false;
const demoListeners = new Set<() => void>();

/**
 * Set by the inline chat from an IntersectionObserver on its card. The fixed
 * launcher and the scroll-to-top button hide below `sm` while it is true:
 * measured 2026-09-13 at 390x844 and 360x640, both sat on top of the card's
 * Send button and its right-hand chips whenever the composer was in the
 * bottom 140 px of the viewport, so a thumb on Send opened the panel instead
 * of sending. On a phone the inline card is the chat, so the launcher has
 * nothing to add while it is on screen.
 */
export function setInlineDemoInView(inView: boolean) {
  if (inView === inlineDemoInView) return;
  inlineDemoInView = inView;
  for (const listener of demoListeners) listener();
}

function subscribeDemo(listener: () => void) {
  demoListeners.add(listener);
  return () => {
    demoListeners.delete(listener);
  };
}

export function useInlineDemoInView(): boolean {
  return useSyncExternalStore(
    subscribeDemo,
    () => inlineDemoInView,
    () => false,
  );
}

/* ---------- the conversation ---------- */

function createChat(): Chat<ChatUIMessage> {
  return new Chat<ChatUIMessage>({
    transport: new DefaultChatTransport<ChatUIMessage>({
      api: "/api/chat",
      fetch: chatFetch,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
}

let chat: Chat<ChatUIMessage> | undefined;

/**
 * The one conversation, on the client. Server renders get a throwaway instance
 * instead of the module singleton, which would otherwise be shared across
 * requests in a long-lived serverless container.
 */
export function getChat(): Chat<ChatUIMessage> {
  if (typeof window === "undefined") return createChat();
  chat ??= createChat();
  return chat;
}
