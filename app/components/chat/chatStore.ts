"use client";

/**
 * One conversation, two surfaces.
 *
 * The inline demo on the homepage and the floating panel render the same
 * transcript: open the panel mid-demo and the conversation continues where it
 * was. That only works if both call `useChat({ chat })` against a single
 * `Chat` instance, which lives here.
 *
 * `@ai-sdk/react` builds its `ChatInit` only when `chat` is absent from the
 * hook options (`@ai-sdk/react/dist/index.js:202`), so passing an instance
 * makes the hook ignore `transport`, `messageMetadataSchema`,
 * `sendAutomaticallyWhen`, `onData`, `onFinish`, `onError` and `onToolCall`.
 * They typecheck and are dropped at runtime. Everything therefore goes on the
 * `new Chat({...})` call below, and `Chat` comes from `@ai-sdk/react`: `ai`
 * does not export it.
 *
 * The page opens on the cheaper model and the picker still offers all four.
 * Changing that seed is a cost decision, not a style one.
 */

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useSyncExternalStore } from "react";
import { chatMessageMetadataSchema } from "@/lib/chat-metadata";
import { FALLBACK_MODEL_ID, resolveModel } from "@/lib/chat-models";
import type { ChatUIMessage } from "@/lib/chat-tools";
import { chatFetch } from "@/app/components/chat/chat-ui";

/** The visitor's model choice survives reloads; read after mount so SSR and the first client render agree. */
const MODEL_STORAGE_KEY = "majid:chat-model";

/** Any CTA can open the panel by dispatching this event on window. */
export const OPEN_CHAT_EVENT = "majid:open-chat";

/* ---------- model ---------- */

let currentModel: string = FALLBACK_MODEL_ID;
const modelListeners = new Set<() => void>();

function emitModel() {
  for (const listener of modelListeners) listener();
}

export function getModelId(): string {
  return currentModel;
}

export function setModelId(id: string) {
  const resolved = resolveModel(id).id;
  if (resolved === currentModel) return;
  currentModel = resolved;
  emitModel();
  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, resolved);
  } catch {
    /* storage unavailable (private mode, blocked); the pick still holds for this visit */
  }
}

/** Reads the saved pick once, after mount, so the server and the first client render agree. */
export function hydrateModelFromStorage() {
  try {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (!saved) return;
    const resolved = resolveModel(saved).id;
    if (resolved === currentModel) return;
    currentModel = resolved;
    emitModel();
  } catch {
    /* keep the seeded model */
  }
}

function subscribeModel(listener: () => void) {
  modelListeners.add(listener);
  return () => {
    modelListeners.delete(listener);
  };
}

/** The picker in the panel and the picker in the inline demo always agree. */
export function useModelId(): string {
  return useSyncExternalStore(subscribeModel, getModelId, () => FALLBACK_MODEL_ID);
}

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

/* ---------- the conversation ---------- */

function createChat(): Chat<ChatUIMessage> {
  return new Chat<ChatUIMessage>({
    transport: new DefaultChatTransport<ChatUIMessage>({
      api: "/api/chat",
      fetch: chatFetch,
      // Read on every request, including the automatic re-send after an approval.
      body: () => ({ model: currentModel }),
    }),
    messageMetadataSchema: chatMessageMetadataSchema,
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
