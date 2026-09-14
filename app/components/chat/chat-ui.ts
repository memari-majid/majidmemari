/**
 * Pure view helpers shared by the floating panel and the inline demo.
 *
 * No JSX and no React state, so both surfaces derive exactly the same
 * segments, phases, chips and announcements from one transcript. This site has
 * no test runner, so the structure deliberately mirrors the company site's
 * `lib/chat-ui.ts`: a future reader can diff the two by eye.
 *
 * Client-safe: types and pure functions only.
 */

import type { DeepPartial, ToolUIPart, UIDataTypes, UIMessagePart } from "ai";
import type { ChatTools, ChatUIMessage } from "@/lib/chat-tools";
import type { ReadinessSnapshot } from "@/lib/readiness";

export type ChatPart = UIMessagePart<UIDataTypes, ChatTools>;
export type ChatToolPart = ToolUIPart<ChatTools>;

export type Segment =
  | { kind: "text"; key: string; text: string }
  | { kind: "tool"; key: string; part: ChatToolPart };

export type Phase = "running" | "waiting" | "done" | "failed" | "skipped";

/**
 * What the surface prints next to each tool step while it runs and once it is
 * done. Keyed by the raw tool name rather than by `ChatToolName` so a tool
 * added on the server gets its copy here without a type error in between, and
 * an unknown name still falls back to a readable label.
 */
export const TOOL_STEP_COPY: Record<string, { running: string; done: string }> = {
  lookupSiteFacts: { running: "Looking up what this site states", done: "Grounded facts" },
  recommendWorkshop: { running: "Matching a workshop", done: "Workshop match" },
  draftConsultingBrief: { running: "Drafting your consulting brief", done: "Consulting brief" },
  assessReadiness: { running: "Scoring your AI readiness", done: "Readiness snapshot" },
  estimateProject: { running: "Sizing the work", done: "Project estimate" },
  draftOutreachNote: { running: "Writing the note", done: "Draft note" },
  handOffToMajid: { running: "Preparing the hand-off", done: "Hand-off" },
  emailMajidNote: { running: "Preparing your note", done: "Note" },
  emailBriefToVisitor: { running: "Preparing your copy", done: "Brief by email" },
  offerOfficeHours: { running: "Checking office hours", done: "Office hours" },
};

/** Tools that stop and ask the visitor before anything leaves the browser. */
export const APPROVAL_TOOL_NAMES: readonly string[] = [
  "handOffToMajid",
  "emailMajidNote",
  "emailBriefToVisitor",
];

/**
 * A url out of a tool output is untrusted: outputs echo back from the client
 * on every later request, so a crafted transcript can put anything in one.
 * Only a site-relative path or an http(s) address ever becomes a link; a
 * `javascript:` or `data:` url renders as plain text instead.
 */
export function safeHref(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("//")) return undefined;
  if (trimmed.startsWith("/")) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}

/** Turns `tool-draftConsultingBrief` into `draftConsultingBrief`. */
export function toolNameOf(part: { type: string }): string {
  return part.type.startsWith("tool-") ? part.type.slice("tool-".length) : part.type;
}

/** A readable label for a tool nobody has written copy for yet. */
export function prettyToolName(name: string): string {
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function stepTitle(name: string, phase: Phase): string {
  const copy = TOOL_STEP_COPY[name];
  const done = copy?.done ?? prettyToolName(name);
  switch (phase) {
    case "running":
      return copy?.running ?? `Working on ${prettyToolName(name).toLowerCase()}`;
    case "waiting":
      return `${done}: your call`;
    case "failed":
      return `${done}: failed`;
    case "skipped":
      return `${done}: skipped`;
    default:
      return done;
  }
}

export function isChatToolPart(part: ChatPart): part is ChatToolPart {
  return part.type.startsWith("tool-") && "toolCallId" in part;
}

export function phaseOf(part: ChatToolPart): Phase {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return "running";
    case "approval-requested":
      return "waiting";
    case "approval-responded":
      return part.approval.approved ? "running" : "skipped";
    case "output-available":
      return "done";
    case "output-error":
      return "failed";
    case "output-denied":
      return "skipped";
  }
}

export function textFromMessage(m: ChatUIMessage): string {
  return m.parts
    .filter((p): p is Extract<ChatPart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Parts in message order: consecutive text parts merge into one bubble, tool parts become cards. */
export function segmentsOf(m: ChatUIMessage): Segment[] {
  const out: Segment[] = [];
  m.parts.forEach((part, i) => {
    if (part.type === "text") {
      const last = out[out.length - 1];
      if (last && last.kind === "text") last.text += part.text;
      else out.push({ kind: "text", key: `${m.id}-t${i}`, text: part.text });
    } else if (isChatToolPart(part)) {
      out.push({ kind: "tool", key: `${m.id}-${part.toolCallId}`, part });
    }
  });
  return out;
}

/**
 * The assistant may end a reply with `SUGGESTIONS: a | b`, or with
 * `SUGGESTIONS: none` when it has just asked the visitor a question. The
 * marker is split off the last text segment so it never reaches the visitor,
 * and the pieces become tappable chips: at most two, and none for `none`.
 */
export const SUGGESTION_MARKER = "SUGGESTIONS:";

/** The prompt's explicit no-chips line, compared case-insensitively. */
const NO_SUGGESTIONS = "none";

/** Chips shown under one reply. The prompt asks for at most this many; the parser enforces it. */
export const MAX_CHIPS = 2;

export function splitSuggestions(raw: string): { body: string; suggestions: string[] } {
  const i = raw.lastIndexOf(SUGGESTION_MARKER);
  if (i === -1) return { body: raw, suggestions: [] };
  const body = raw.slice(0, i).trimEnd();
  const suggestions = raw
    .slice(i + SUGGESTION_MARKER.length)
    .split("|")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 1 && s.length <= 42 && s.toLowerCase() !== NO_SUGGESTIONS)
    .slice(0, MAX_CHIPS);
  return { body, suggestions };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Up to `MAX_CHIPS` chips the visitor has not already sent. */
export function sanitizeChips(chips: string[], used: string[]): string[] {
  const usedNorm = used.map(norm);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chip of chips) {
    const key = norm(chip);
    if (!key || seen.has(key) || usedNorm.includes(key)) continue;
    seen.add(key);
    out.push(chip);
    if (out.length === MAX_CHIPS) break;
  }
  return out;
}

/**
 * True while an approval card is waiting for Send or Not now. Typing or
 * tapping a chip at that point would post a transcript with an unanswered
 * approval, which the server cannot turn into a model call, so both surfaces
 * hold input until the card is answered.
 */
export function hasPendingApproval(m: ChatUIMessage | undefined): boolean {
  return !!m && m.parts.some((p) => isChatToolPart(p) && p.state === "approval-requested");
}

/**
 * True when the visitor approved a send but the request that carries the
 * approval to the server did not complete (rate limit, body cap, network,
 * Stop). The server executes an approval only when it sits in the final step
 * of the last message, so a new visitor message would turn it into a denial;
 * the card's Retry re-posts the transcript as is instead.
 */
export function hasStalledApproval(m: ChatUIMessage | undefined, busy: boolean): boolean {
  return (
    !busy &&
    !!m &&
    m.parts.some((p) => isChatToolPart(p) && p.state === "approval-responded" && p.approval.approved)
  );
}

/**
 * The last text of a reply, the part a screen reader hears once the reply is
 * complete. Keyed by message id and position so the continuation after an
 * approval card (same message, new text after the card) is announced as well,
 * while the same text is never read twice.
 */
export function lastReplyText(m: ChatUIMessage): { key: string; text: string } | undefined {
  const segments = segmentsOf(m);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.kind === "text") return { key: `${m.id}:${i}`, text: splitSuggestions(seg.text).body.trim() };
  }
  return undefined;
}

/*
 * Tool outputs echo back from the client on later requests, so render code
 * never trusts their shape: a crafted output gets a generic sentence, not a throw.
 */
export type HandOffOutput = { delivered: boolean; briefAttached: boolean; reason?: string };

export function isHandOffOutput(x: unknown): x is HandOffOutput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.delivered === "boolean" && typeof o.briefAttached === "boolean";
}

/** Any send tool that reports whether the message actually went out. */
export type DeliveryOutput = { delivered: boolean; reason?: string };

export function isDeliveryOutput(x: unknown): x is DeliveryOutput {
  return !!x && typeof x === "object" && typeof (x as { delivered?: unknown }).delivered === "boolean";
}

export function isReadinessSnapshot(x: unknown): x is ReadinessSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.dimensions) &&
    typeof o.overall === "number" &&
    typeof o.label === "string" &&
    typeof o.nextStep === "string"
  );
}

/** Readable label and value rows out of a partly streamed tool input. */
export function inputRows(input: unknown, skip: readonly string[] = []): { label: string; value: string }[] {
  if (!input || typeof input !== "object") return [];
  const rows: { label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (skip.includes(key) || raw == null) continue;
    let value = "";
    if (typeof raw === "string") value = raw;
    else if (typeof raw === "number" || typeof raw === "boolean") value = String(raw);
    else if (Array.isArray(raw)) value = raw.filter((v) => typeof v === "string").join(", ");
    if (!value.trim()) continue;
    rows.push({ label: prettyToolName(key), value: value.length > 600 ? `${value.slice(0, 600)}…` : value });
  }
  return rows;
}

export function formatChatConfigMessage(error: string): string {
  if (
    error.includes("OIDC") ||
    error.includes("AI_GATEWAY_API_KEY") ||
    error.includes("AI Gateway") ||
    error.toLowerCase().includes("unauthorized")
  ) {
    return "Chat is not configured: enable AI Gateway in Vercel, Project, AI Gateway, then redeploy. The contact form still reaches me.";
  }
  return error;
}

export async function chatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await globalThis.fetch(input, init);
  if (!res.ok) {
    const text = await res.text();
    try {
      const j = JSON.parse(text) as { error?: string };
      if (typeof j.error === "string") throw new Error(j.error);
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Height of the inline chat body: fixed and predictable, so the section never
 * grows as the conversation does. The `max-h` is the part that matters on a
 * short laptop: it caps every breakpoint, not just the phone one, so the card
 * header and the composer both stay inside the viewport instead of pushing
 * the composer below the fold. The subtracted `18rem` covers the card header
 * above the body plus a margin above the card. The floor keeps the box usable
 * when `dvh` is tiny; the page scrolls there rather than clipping, because
 * the card itself sets no height.
 *
 * Below `sm` the subtraction is `20rem`, not `18rem`: measured 2026-09-13 at
 * 360x640, when the header still carried a model picker and a tab strip, the
 * two came to about 300 px and the composer sat 11 px below the fold. The
 * header is shorter now and the blurb is still hidden there
 * (`InlineAssistantDemo`), so the card fits under the nav with the composer
 * on screen and room to spare.
 *
 * The company site caps the whole frame instead (`INLINE_DEMO_HEIGHT` in its
 * `lib/chat-ui.ts`), because its header sits inside the frame. Same rule, one
 * value each, so the two can be diffed by eye.
 */
export const INLINE_DEMO_BODY_HEIGHT =
  "h-[min(70dvh,520px)] min-h-[320px] max-h-[calc(100dvh-20rem)] sm:h-[580px] sm:max-h-[calc(100dvh-18rem)] lg:h-[620px]";

/** Visitors who asked for less motion get an instant scroll instead of the smooth one. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Re-exported so card files do not each import from `ai` for one type. */
export type { DeepPartial };
