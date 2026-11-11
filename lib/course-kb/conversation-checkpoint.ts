import type { CourseChatMessage } from './types';
import { parseCourseSession, serializeCourseSession } from './session';

export type ConversationCheckpoint = {
  sessionReady: boolean;
  messages: readonly CourseChatMessage[];
  lesson: string;
  interrupted: ReadonlySet<string>;
  busy: boolean;
  failed?: boolean;
};

/** Save the visible request before aborting it. Unmounting a useChat view only
 * unsubscribes from its state; it does not stop an in-flight request itself. */
export function checkpointCourseConversation(
  state: ConversationCheckpoint,
  save: (serialized: string) => void,
  stop: () => void | Promise<void>,
): { saved: boolean; messages: CourseChatMessage[] } {
  if (!state.sessionReady) return { saved: true, messages: [] };
  const serialized = serializeCourseSession(state.messages, state.lesson, state.interrupted, state.busy || state.failed === true);
  let saved = true;
  try { save(serialized); } catch { saved = false; }
  // Aborting must still happen if storage is blocked or full.
  if (state.busy) {
    try { void Promise.resolve(stop()).catch(() => {}); } catch { /* The saved interruption remains recoverable. */ }
  }
  return { saved, messages: parseCourseSession(serialized).messages };
}
