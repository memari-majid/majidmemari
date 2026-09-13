"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type DeepPartial,
  type ToolUIPart,
  type UIDataTypes,
  type UIMessagePart,
} from "ai";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  chatMessageMetadataSchema,
  formatMs,
  formatStatsLine,
  formatTokens,
  type ChatMessageMetadata,
} from "@/lib/chat-metadata";
import { CHAT_MODELS, DEFAULT_MODEL_ID, findModel, formatUsd, resolveModel, type ChatModel } from "@/lib/chat-models";
import type { ChatToolName, ChatTools, ChatUIMessage } from "@/lib/chat-tools";
import {
  briefToText,
  consultingBriefSchema,
  EFFORT_LABEL,
  ENGAGEMENT_LABEL,
  type ConsultingBrief,
} from "@/lib/consulting-brief";
import { clampScore, READINESS_DIMENSIONS, SCORE_MAX, type ReadinessInput, type ReadinessSnapshot } from "@/lib/readiness";
import { SITE } from "@/lib/site";

const QUICK_PROMPTS = [
  "We're exploring where AI fits",
  "We have a project in mind",
  "We want to train our team",
];

/** Any CTA can open the chat by dispatching this event on window. */
export const OPEN_CHAT_EVENT = "majid:open-chat";

/** The visitor's model choice survives reloads; read after mount so SSR and the first client render agree. */
const MODEL_STORAGE_KEY = "majid:chat-model";

const HOW_IT_WORKS_URL = "https://nexusaisolution.net/how-it-works";

/**
 * The assistant may end a reply with `SUGGESTIONS: a | b | c`. The marker is
 * split off the last text segment so it never reaches the visitor, and the
 * pieces become tappable chips.
 */
const SUGGESTION_MARKER = "SUGGESTIONS:";

/** What the widget prints next to each tool step while it runs and once it is done. */
const TOOL_STEP_LABEL: Record<ChatToolName, { running: string; done: string }> = {
  draftConsultingBrief: { running: "Drafting your consulting brief", done: "Consulting brief" },
  assessReadiness: { running: "Scoring your AI readiness", done: "Readiness snapshot" },
  handOffToMajid: { running: "Preparing the hand-off to Majid", done: "Hand-off to Majid" },
  offerOfficeHours: { running: "Checking office hours", done: "Office hours" },
};

type HandOffInput = ChatTools["handOffToMajid"]["input"];
type HandOffOutput = { delivered: boolean; briefAttached: boolean; reason?: string };

/** What the hand-off email will carry; the server picks the latest brief and snapshot from the transcript. */
type Attachments = { brief: boolean; readiness: boolean };

/*
 * Tool outputs echo back from the client on later requests, so render code
 * never trusts their shape: a crafted output gets a generic sentence, not a throw.
 */
function isHandOffOutput(x: unknown): x is HandOffOutput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.delivered === "boolean" && typeof o.briefAttached === "boolean";
}

function isReadinessSnapshot(x: unknown): x is ReadinessSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.dimensions) &&
    typeof o.overall === "number" &&
    typeof o.label === "string" &&
    typeof o.nextStep === "string"
  );
}

type ChatPart = UIMessagePart<UIDataTypes, ChatTools>;
type ChatToolPart = ToolUIPart<ChatTools>;
type BriefPart = Extract<ChatToolPart, { type: "tool-draftConsultingBrief" }>;
type ReadinessPart = Extract<ChatToolPart, { type: "tool-assessReadiness" }>;
type HandOffPart = Extract<ChatToolPart, { type: "tool-handOffToMajid" }>;

type Segment =
  | { kind: "text"; key: string; text: string }
  | { kind: "tool"; key: string; part: ChatToolPart };

type Phase = "running" | "waiting" | "done" | "failed" | "skipped";

function isChatToolPart(part: ChatPart): part is ChatToolPart {
  return part.type.startsWith("tool-") && "toolCallId" in part;
}

/**
 * True while a hand-off card is waiting for Send or Not now. Typing or tapping
 * a chip at that point would post a transcript with an unanswered approval,
 * which the server cannot turn into a model call, so the widget holds input
 * until the card is answered.
 */
function hasPendingApproval(m: ChatUIMessage | undefined): boolean {
  return !!m && m.parts.some((p) => isChatToolPart(p) && p.state === "approval-requested");
}

/**
 * True when the visitor approved the hand-off but the request that carries
 * the approval to the server did not complete (rate limit, body cap, network,
 * Stop). The server executes an approval only when it sits in the final step
 * of the last message, so a new visitor message would turn it into a denial;
 * the card's Retry re-posts the transcript as is instead, and input stays
 * held until then. New remains the way out.
 */
function hasStalledApproval(m: ChatUIMessage | undefined, busy: boolean): boolean {
  return (
    !busy &&
    !!m &&
    m.parts.some((p) => isChatToolPart(p) && p.state === "approval-responded" && p.approval.approved)
  );
}

function textFromMessage(m: ChatUIMessage): string {
  return m.parts
    .filter((p): p is Extract<ChatPart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Parts in message order: consecutive text parts merge into one bubble, tool parts become cards. */
function segmentsOf(m: ChatUIMessage): Segment[] {
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

function splitSuggestions(raw: string): { body: string; suggestions: string[] } {
  const i = raw.lastIndexOf(SUGGESTION_MARKER);
  if (i === -1) return { body: raw, suggestions: [] };
  const body = raw.slice(0, i).trimEnd();
  const suggestions = raw
    .slice(i + SUGGESTION_MARKER.length)
    .split("|")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 1 && s.length <= 42);
  return { body, suggestions };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Up to three chips the visitor has not already sent. */
function sanitizeChips(chips: string[], used: string[]): string[] {
  const usedNorm = used.map(norm);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chip of chips) {
    const key = norm(chip);
    if (!key || seen.has(key) || usedNorm.includes(key)) continue;
    seen.add(key);
    out.push(chip);
    if (out.length === 3) break;
  }
  return out;
}

function phaseOf(part: ChatToolPart): Phase {
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

function stepTitle(name: ChatToolName, phase: Phase): string {
  const label = TOOL_STEP_LABEL[name];
  switch (phase) {
    case "running":
      return label.running;
    case "waiting":
      return `${label.done}: your call`;
    case "failed":
      return `${label.done}: failed`;
    case "skipped":
      return `${label.done}: skipped`;
    default:
      return label.done;
  }
}

function priceLabel(m: ChatModel): string {
  return `${m.label} ($${m.inputPerM} in, $${m.outputPerM} out per 1M tokens)`;
}

function formatChatConfigMessage(error: string) {
  if (
    error.includes("OIDC") ||
    error.includes("AI_GATEWAY_API_KEY") ||
    error.includes("AI Gateway") ||
    error.toLowerCase().includes("unauthorized")
  ) {
    return "Chat isn’t configured: enable AI Gateway in Vercel → Project → AI Gateway, then redeploy. You can still reach me via the contact form below.";
  }
  return error;
}

async function chatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
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

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Visitors who asked for less motion get an instant scroll instead of the smooth one. */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

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
 * Escape closes the dialog unless focus sits on a native select. There the key
 * closes the open option list first, and the dialog has to stay put, or picking
 * a model would throw the visitor out of the chat.
 */
function escapeClosesDialog(targetTagName: string | undefined | null): boolean {
  return (targetTagName ?? "").toUpperCase() !== "SELECT";
}

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

/**
 * The last text of a reply, the part a screen reader hears once the reply is
 * complete. Keyed by message id and position so the continuation after an
 * approval card (same message, new text after the card) is announced as well,
 * while the same text is never read twice.
 */
function lastReplyText(m: ChatUIMessage): { key: string; text: string } | undefined {
  const segments = segmentsOf(m);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.kind === "text") return { key: `${m.id}:${i}`, text: splitSuggestions(seg.text).body.trim() };
  }
  return undefined;
}

/* ---------- Presentational pieces ---------- */

const DOT: Record<Phase, string> = {
  running: "bg-sky-500 animate-pulse motion-reduce:animate-none",
  waiting: "bg-amber-500",
  done: "bg-emerald-500",
  failed: "bg-red-500",
  skipped: "bg-zinc-400 dark:bg-zinc-600",
};

function CardShell({ title, phase, children }: { title: string; phase: Phase; children?: ReactNode }) {
  return (
    <div className="mr-4 space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-300">
      <div
        role={phase === "running" ? "status" : undefined}
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
      >
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT[phase]}`} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <p className="whitespace-pre-wrap">
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}: </span>
      {text}
    </p>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="whitespace-pre-wrap">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ text, disabled }: { text: () => string | undefined; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const t = text();
        if (!t) return;
        void copyText(t).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-xs text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-100"
    >
      {copied ? "Copied" : "Copy as text"}
    </button>
  );
}

function BriefCard({ part }: { part: BriefPart }) {
  const phase = phaseOf(part);
  const brief: DeepPartial<ConsultingBrief> | undefined = part.input;
  const opportunities = (brief?.opportunities ?? []).flatMap((o) => (o ? [o] : []));
  const risks = (brief?.risks ?? []).flatMap((r) => (r ? [r] : []));
  const keepHuman = (brief?.keepHuman ?? []).flatMap((k) => (typeof k === "string" ? [k] : []));
  const questions = (brief?.openQuestions ?? []).flatMap((q) => (typeof q === "string" ? [q] : []));
  const engagement = brief?.engagement ? ENGAGEMENT_LABEL[brief.engagement] : undefined;

  return (
    <CardShell title={stepTitle("draftConsultingBrief", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The brief could not be drafted this time. Ask Dr. MJ to try again.</p>
      ) : (
        <>
          {brief?.title && <p className="font-semibold text-zinc-900 dark:text-zinc-100">{brief.title}</p>}
          <Field label="Situation" text={brief?.situation} />
          <Field label="Goal" text={brief?.goal} />
          <ListField
            label="Where AI could help"
            items={opportunities.map(
              (o) =>
                `${o.title ?? ""}${o.effort && EFFORT_LABEL[o.effort] ? ` (${EFFORT_LABEL[o.effort].toLowerCase()})` : ""}${o.why ? `: ${o.why}` : ""}`,
            )}
          />
          <ListField
            label="Risks"
            items={risks.map((r) => `${r.title ?? ""}${r.mitigation ? `: ${r.mitigation}` : ""}`)}
          />
          <ListField label="Keep with people" items={keepHuman} />
          <Field label="First step" text={brief?.firstStep} />
          <ListField label="Open questions" items={questions} />
          {engagement && (
            <Field
              label="Suggested engagement"
              text={`${engagement}${brief?.engagementReason ? `. ${brief.engagementReason}` : ""}`}
            />
          )}
          {phase === "done" && (
            <CopyButton
              text={() => {
                const parsed = consultingBriefSchema.safeParse(part.input);
                return parsed.success ? briefToText(parsed.data) : undefined;
              }}
            />
          )}
        </>
      )}
    </CardShell>
  );
}

type ReadinessRow = { key: string; label: string; score: number; note: string };

function snapshotToText(snapshot: ReadinessSnapshot, rows: ReadinessRow[]): string {
  const lines = [`AI readiness: ${snapshot.label} (${snapshot.overall} of ${SCORE_MAX})`];
  if (typeof snapshot.context === "string" && snapshot.context) lines.push(`Use case: ${snapshot.context}`);
  for (const r of rows) lines.push(`- ${r.label}: ${r.score}/${SCORE_MAX}${r.note ? `. ${r.note}` : ""}`);
  if (typeof snapshot.summary === "string") lines.push(snapshot.summary);
  lines.push(`Next step: ${snapshot.nextStep}`);
  return lines.join("\n");
}

function ReadinessCard({ part }: { part: ReadinessPart }) {
  const phase = phaseOf(part);
  const snapshot =
    part.state === "output-available" && isReadinessSnapshot(part.output) ? part.output : undefined;
  const input: DeepPartial<ReadinessInput> | undefined = part.input;

  // The finished snapshot wins; while the model is still streaming scores, show what has arrived.
  const rows: ReadinessRow[] = snapshot
    ? snapshot.dimensions.flatMap((d) =>
        d && typeof d.label === "string"
          ? [
              {
                key: String(d.key),
                label: d.label,
                score: clampScore(d.score),
                note: typeof d.note === "string" ? d.note : "",
              },
            ]
          : [],
      )
    : READINESS_DIMENSIONS.flatMap((d) => {
        const item = input?.[d.key];
        if (!item || typeof item.score !== "number") return [];
        return [{ key: d.key, label: d.label, score: clampScore(item.score), note: item.note ?? "" }];
      });

  const percent =
    snapshot && typeof snapshot.percent === "number" ? Math.min(100, Math.max(0, Math.round(snapshot.percent))) : undefined;

  return (
    <CardShell title={stepTitle("assessReadiness", phase)} phase={phase}>
      {phase === "failed" ? (
        <p>The readiness check did not complete. Ask Dr. MJ to try again.</p>
      ) : (
        <>
          {typeof input?.context === "string" && input.context && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{input.context}</p>
          )}
          {snapshot && (
            <p>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.label}</span>, {snapshot.overall} of{" "}
              {SCORE_MAX}.{typeof snapshot.summary === "string" ? ` ${snapshot.summary}` : ""}
            </p>
          )}
          {percent !== undefined && (
            <div aria-hidden="true" className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
            </div>
          )}
          {rows.length > 0 && (
            <dl className="space-y-1.5">
              {rows.map((r) => (
                <div key={r.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-zinc-900 dark:text-zinc-100">{r.label}</dt>
                    <dd className="font-mono tracking-wider text-sky-700 dark:text-sky-400">
                      <span aria-hidden="true">
                        {"●".repeat(r.score)}
                        {"○".repeat(SCORE_MAX - r.score)}
                      </span>
                      <span className="sr-only">
                        {r.score} of {SCORE_MAX}
                      </span>
                    </dd>
                  </div>
                  {r.note && <dd className="text-xs text-zinc-600 dark:text-zinc-400">{r.note}</dd>}
                </div>
              ))}
            </dl>
          )}
          {snapshot && <Field label="Next step" text={snapshot.nextStep} />}
          {snapshot && <CopyButton text={() => snapshotToText(snapshot, rows)} />}
        </>
      )}
    </CardShell>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2">
      <dt className="font-medium text-zinc-900 dark:text-zinc-100">{label}</dt>
      <dd className="whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

/** Human in the loop: the card shows exactly what will be sent, and nothing goes out until the visitor says so. */
function ApprovalCard({
  input,
  attachments,
  disabled,
  onRespond,
}: {
  input: DeepPartial<HandOffInput> | undefined;
  attachments: Attachments;
  disabled: boolean;
  onRespond: (approved: boolean) => void;
}) {
  const attached = [
    (attachments.brief || Boolean(input?.briefToolCallId)) && "your consulting brief",
    attachments.readiness && "your readiness snapshot",
  ].filter((s): s is string => typeof s === "string");
  return (
    <div className="space-y-2">
      <p>Send this to Majid? Nothing goes out until you say so.</p>
      <dl className="space-y-1 text-xs">
        <Row label="To" value={`Majid Memari (${SITE.email})`} />
        <Row label="Your name" value={input?.name} />
        <Row label="Your email" value={input?.email} />
        <Row label="Organization" value={input?.organization} />
        <Row label="What you need" value={input?.topic} />
        {attached.length > 0 && <Row label="Attached" value={attached.join(" and ")} />}
      </dl>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRespond(true)}
          className="btn-primary btn-compact text-xs disabled:opacity-50"
        >
          Send to Majid
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRespond(false)}
          className="btn-secondary btn-compact text-xs disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

const NOT_SENT_REASON: Record<string, string> = {
  "not-configured":
    "Email is not switched on for this site yet, so your request was noted on the server but no email went out.",
  "invalid-email": "That email address did not look valid, so nothing was sent.",
  quota: "This connection has used today's hand-off allowance, so nothing was sent.",
  "send-failed": "The email service did not accept the message, so nothing was sent.",
};

const FALLBACK_LINK_CLASS =
  "underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:decoration-zinc-600 dark:hover:text-zinc-100";

/**
 * Where else to reach Majid. The contact form goes through the same email
 * path as the hand-off, so while email is off it only logs on the server too;
 * the copy must not promise it is reliable. The mailto is the one route that
 * lands in his inbox today.
 */
function ContactFallback({ emailOff }: { emailOff: boolean }) {
  return (
    <p>
      The{" "}
      <a href="/contact" className={FALLBACK_LINK_CLASS}>
        contact form
      </a>{" "}
      {emailOff
        ? "goes through the same email path, so right now it also only logs your message on the server. To be sure Majid sees this, email "
        : "is the other way to reach Majid, or email "}
      <a href={`mailto:${SITE.email}`} className={FALLBACK_LINK_CLASS}>
        {SITE.email}
      </a>{" "}
      directly.
    </p>
  );
}

function HandOffCard({
  part,
  attachments,
  busy,
  onRespond,
  onRetry,
}: {
  part: HandOffPart;
  attachments: Attachments;
  busy: boolean;
  onRespond: (id: string, approved: boolean) => void;
  onRetry: () => void;
}) {
  const input: DeepPartial<HandOffInput> | undefined = part.input;
  const output = part.state === "output-available" && isHandOffOutput(part.output) ? part.output : undefined;
  // The dot, the title, and the body must agree: a hand-off that came back
  // undelivered (or unreadable) is a failed step, never a green "done".
  const notSent = part.state === "output-available" && (!output || !output.delivered);
  // Approved, but the request that carries the approval to the server did not
  // run or failed (rate limit, body cap, network, Stop). Nothing is being sent
  // now. Retry re-posts the transcript unchanged, which is the only request
  // the server will execute the approval from; a new message would deny it.
  const stalled = part.state === "approval-responded" && part.approval.approved && !busy;
  const phase: Phase = notSent ? "failed" : stalled ? "waiting" : phaseOf(part);
  const title = notSent
    ? `${TOOL_STEP_LABEL.handOffToMajid.done}: not sent`
    : stalled
      ? `${TOOL_STEP_LABEL.handOffToMajid.done}: not sent yet`
      : stepTitle("handOffToMajid", phase);

  if (part.state === "approval-requested") {
    return (
      <CardShell title={title} phase={phase}>
        <ApprovalCard
          input={input}
          attachments={attachments}
          disabled={busy}
          onRespond={(approved) => onRespond(part.approval.id, approved)}
        />
      </CardShell>
    );
  }

  if (part.state === "approval-responded") {
    return (
      <CardShell title={title} phase={phase}>
        <p>
          {!part.approval.approved
            ? "Not sent. Nothing was shared with Majid."
            : stalled
              ? "Approved, but the send did not go through. Nothing has been shared with Majid yet."
              : "Sending your summary to Majid."}
        </p>
        {stalled && (
          <button type="button" onClick={onRetry} className="btn-secondary btn-compact text-xs">
            Retry
          </button>
        )}
      </CardShell>
    );
  }

  if (part.state === "output-denied") {
    return (
      <CardShell title={title} phase={phase}>
        <p>Not sent. Nothing was shared with Majid. Say the word if you change your mind.</p>
      </CardShell>
    );
  }

  if (part.state === "output-error") {
    return (
      <CardShell title={title} phase={phase}>
        <p>The hand-off step failed, so nothing was sent.</p>
        <ContactFallback emailOff={false} />
      </CardShell>
    );
  }

  if (part.state === "output-available") {
    if (!output) {
      return (
        <CardShell title={title} phase={phase}>
          <p>The hand-off finished, but the result could not be read, so treat it as not sent.</p>
          <ContactFallback emailOff={false} />
        </CardShell>
      );
    }
    if (output.delivered) {
      return (
        <CardShell title={title} phase={phase}>
          <p>Sent to Majid at {SITE.email}. He will follow up with you by email.</p>
          {output.briefAttached && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Your consulting brief was attached.</p>
          )}
        </CardShell>
      );
    }
    return (
      <CardShell title={title} phase={phase}>
        <p>Not sent. {NOT_SENT_REASON[output.reason ?? ""] ?? "Nothing was sent."}</p>
        <ContactFallback emailOff={output.reason === "not-configured"} />
      </CardShell>
    );
  }

  // input-streaming or input-available: the model is still filling in the summary.
  return (
    <CardShell title={title} phase={phase}>
      <dl className="space-y-1 text-xs">
        <Row label="Organization" value={input?.organization} />
        <Row label="What you need" value={input?.topic} />
      </dl>
    </CardShell>
  );
}

function OfficeHoursCard({ phase }: { phase: Phase }) {
  return (
    <CardShell title={stepTitle("offerOfficeHours", phase)} phase={phase}>
      <p>For students and academic contacts, the quickest route is Majid&apos;s office hours at UVU.</p>
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
        Consulting questions go through the hand-off to Majid instead.
      </p>
    </CardShell>
  );
}

function GenericToolCard({ name, phase }: { name: string; phase: Phase }) {
  const pretty = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return (
    <CardShell title={phase === "running" ? `Working on ${pretty}` : pretty} phase={phase}>
      {phase === "failed" && <p>This step did not complete.</p>}
    </CardShell>
  );
}

function ToolCard({
  part,
  attachments,
  busy,
  onRespond,
  onRetry,
}: {
  part: ChatToolPart;
  attachments: Attachments;
  busy: boolean;
  onRespond: (id: string, approved: boolean) => void;
  onRetry: () => void;
}) {
  const rawType: string = part.type;
  // Older or renamed tool ids still get a sensible card.
  if (rawType === "tool-offerBookingLink") return <OfficeHoursCard phase={phaseOf(part)} />;
  switch (part.type) {
    case "tool-draftConsultingBrief":
      return <BriefCard part={part} />;
    case "tool-assessReadiness":
      return <ReadinessCard part={part} />;
    case "tool-handOffToMajid":
      return <HandOffCard part={part} attachments={attachments} busy={busy} onRespond={onRespond} onRetry={onRetry} />;
    case "tool-offerOfficeHours":
      return <OfficeHoursCard phase={phaseOf(part)} />;
    default:
      return <GenericToolCard name={rawType.slice("tool-".length)} phase={phaseOf(part as ChatToolPart)} />;
  }
}

function statRows(meta: ChatMessageMetadata): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const model = findModel(meta.model);
  if (meta.model) rows.push({ label: "Model", value: model ? `${model.label} (${meta.model})` : meta.model });
  if (meta.budgetFallback) {
    rows.push({
      label: "Why this model",
      value: `The daily budget was reached, so ${findModel(meta.requestedModel)?.label ?? "the model you picked"} was swapped for the fallback.`,
    });
  }
  if (meta.ttftMs != null) rows.push({ label: "First token", value: formatMs(meta.ttftMs) });
  if (meta.totalMs != null) rows.push({ label: "Total time", value: formatMs(meta.totalMs) });
  if (meta.tokens) {
    const t = meta.tokens;
    rows.push({
      label: "Input tokens",
      value: `${formatTokens(t.input)} new${t.cacheRead ? `, ${formatTokens(t.cacheRead)} cached` : ""}${t.cacheWrite ? `, ${formatTokens(t.cacheWrite)} cache write` : ""}`,
    });
    rows.push({
      label: "Output tokens",
      value: `${formatTokens(t.output)}${t.reasoning ? ` (${formatTokens(t.reasoning)} reasoning)` : ""}`,
    });
    rows.push({ label: "Total tokens", value: formatTokens(t.total) });
  }
  if (meta.costUsd != null) {
    rows.push({
      label: "Cost",
      value: `${formatUsd(meta.costUsd)} at list price${model ? ` ($${model.inputPerM} in, $${model.outputPerM} out per 1M)` : ""}`,
    });
  }
  if (meta.steps != null) {
    rows.push({ label: "Steps", value: `${meta.steps}${meta.toolCalls ? ` (${meta.toolCalls} tool calls)` : ""}` });
  }
  if (meta.finishReason) rows.push({ label: "Finish", value: meta.finishReason });
  return rows;
}

/**
 * Compact by default; click for the full breakdown. Renders only once the
 * finish metadata (totalMs) has landed, so a bare model name never sits under
 * a reply that is still streaming and the line does not change width later.
 */
function StatLine({ meta }: { meta: ChatMessageMetadata | undefined }) {
  const [full, setFull] = useState(false);
  const line = formatStatsLine(meta);
  if (!meta || meta.totalMs == null || !line) return null;
  const rows = full ? statRows(meta) : [];
  return (
    <div className="mr-4 px-1">
      <button
        type="button"
        onClick={() => setFull((v) => !v)}
        aria-expanded={full}
        className="text-left text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {line}
      </button>
      {full && rows.length > 0 && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          {rows.map((r) => (
            <Fragment key={r.label}>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">{r.label}</dt>
              <dd className="break-words">{r.value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}

/* ---------- Widget ---------- */

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const modelRef = useRef<string>(DEFAULT_MODEL_ID);
  const endRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  /**
   * Whatever had focus when the dialog opened: the launcher, or a page CTA that
   * dispatched the open-chat event. Focus goes back there on close.
   */
  const openerRef = useRef<HTMLElement | null>(null);
  /** Key of the reply the live region last announced, so each completed reply is read once. */
  const announcedRef = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const openDialog = useCallback(() => {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setOpen(true);
  }, []);

  // The transport is created once; the body callback reads the current pick on every request,
  // including the automatic re-send after an approval.
  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        fetch: chatFetch,
        body: () => ({ model: modelRef.current }),
      }),
    [],
  );
  const { messages, sendMessage, status, stop, error, setMessages, clearError, addToolApprovalResponse } =
    useChat<ChatUIMessage>({
      transport,
      messageMetadataSchema: chatMessageMetadataSchema,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, open]);

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
        if (!escapeClosesDialog(e.target instanceof Element ? e.target.tagName : undefined)) return;
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

  // Any CTA (e.g. the hero "Start a conversation" button) can open the chat.
  useEffect(() => {
    const onOpen = () => openDialog();
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, [openDialog]);

  // Hydration-safe: the server and the first client render both use the default; the saved pick lands after mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
      if (saved) {
        const id = resolveModel(saved).id;
        modelRef.current = id;
        setModelId(id);
      }
    } catch {
      /* storage unavailable (private mode, blocked); keep the default */
    }
  }, []);

  function chooseModel(id: string) {
    const resolved = resolveModel(id).id;
    modelRef.current = resolved;
    setModelId(resolved);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, resolved);
    } catch {
      /* ignore */
    }
  }

  function startNewChat() {
    setMessages([]);
    clearError();
  }

  function respond(id: string, approved: boolean) {
    void addToolApprovalResponse({ id, approved });
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const awaitingApproval = hasPendingApproval(lastAssistant);
  const stalledApproval = hasStalledApproval(lastAssistant, busy);
  const inputLocked = busy || awaitingApproval || stalledApproval;

  // Each completed reply reaches the polite live region once, after the
  // stream has finished, so a screen reader hears the whole answer rather
  // than every streamed fragment.
  useEffect(() => {
    if (!open || status !== "ready" || !lastAssistant) return;
    const reply = lastReplyText(lastAssistant);
    if (!reply || !reply.text || announcedRef.current === reply.key) return;
    announcedRef.current = reply.key;
    setAnnouncement(reply.text);
  }, [open, status, lastAssistant]);

  /** Re-posts the transcript as is; the approved hand-off in its final step is then executed by the server. */
  function retrySend() {
    void sendMessage();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || inputLocked) return;
    await sendMessage({ text: input.trim() });
    setInput("");
  }

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

  return (
    <>
      {/* Always mounted so assistive tech registers the region before a reply lands in it. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <button
        ref={launcherRef}
        type="button"
        onClick={openDialog}
        className={`fixed z-[60] flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-zinc-50 motion-reduce:transition-none dark:focus:ring-offset-zinc-950 ${open ? "hidden" : ""} bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]`}
        aria-label="Open chat"
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
          className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/50 p-0 pt-[env(safe-area-inset-top)] sm:items-end sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <div className="flex h-full w-full min-w-0 max-w-[100vw] flex-col rounded-none border-0 border-zinc-200 bg-white shadow-2xl sm:h-[min(600px,85vh)] sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="chat-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Dr. MJ
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
                    AI agent
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Ask about consulting, team training, teaching, or internships</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {busy && (
                  <button
                    type="button"
                    onClick={() => void stop()}
                    className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Stop
                  </button>
                )}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    disabled={busy}
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

            {/* Toolbar row: the picker gets its own line so 360 px phones never overflow. */}
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <label htmlFor="chat-model" className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
                Model
              </label>
              <select
                id="chat-model"
                value={modelId}
                onChange={(e) => chooseModel(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-sky-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id} title={m.note}>
                    {priceLabel(m)}
                  </option>
                ))}
              </select>
              <a
                href={HOW_IT_WORKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="The Nexus site explains the agent and runs a larger tool set; this site runs four tools."
                className="shrink-0 text-xs text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-100"
              >
                How Dr. MJ works at Nexus
              </a>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-500">
                    Hi, I&apos;m Dr. MJ, the AI agent on Majid&apos;s site (an AI, not Majid himself). Tell me what you&apos;re working on and where you want to go with AI. I&apos;ll give you straight guidance, and when it helps I can draft a consulting brief, score your readiness, and hand you off to Majid, with your OK first.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        disabled={busy}
                        onClick={() => void sendMessage({ text: q })}
                        className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-800 transition hover:border-sky-500 hover:text-sky-800 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-sky-700 dark:hover:text-sky-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-600">
                    The link above, How Dr. MJ works at Nexus, describes the agent as it runs on the Nexus site, which has
                    more tools. Here it has four: consulting brief, readiness score, hand-off to Majid, and office hours
                    for UVU students.
                  </p>
                </div>
              )}
              {messages.map((m) => {
                if (m.role === "user") {
                  const text = textFromMessage(m);
                  if (!text.trim()) return null;
                  return (
                    <div
                      key={m.id}
                      className="ml-6 whitespace-pre-wrap break-words rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-zinc-900 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-zinc-100"
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
                  <div key={m.id} className="space-y-2">
                    {segments.map((seg, i) => {
                      if (seg.kind === "tool") {
                        return (
                          <ToolCard
                            key={seg.key}
                            part={seg.part}
                            attachments={attachments}
                            busy={busy}
                            onRespond={respond}
                            onRetry={retrySend}
                          />
                        );
                      }
                      const body = i === lastTextIdx ? splitSuggestions(seg.text).body : seg.text;
                      if (!body.trim()) return null;
                      return (
                        <div
                          key={seg.key}
                          className="mr-4 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300"
                        >
                          {body}
                        </div>
                      );
                    })}
                    <StatLine meta={m.metadata} />
                  </div>
                );
              })}
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chips.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage({ text: s })}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:border-sky-500 hover:text-sky-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-700 dark:hover:text-sky-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {error && (
                <p role="alert" className="text-xs text-amber-700 dark:text-amber-400">
                  {formatChatConfigMessage(error.message) ||
                    "Something went wrong. Try again or use the contact form."}
                </p>
              )}
              <div ref={endRef} />
            </div>

            <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <form onSubmit={onSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Message Dr. MJ"
                  placeholder={
                    awaitingApproval
                      ? "Choose Send to Majid or Not now above"
                      : stalledApproval
                        ? "Retry the send above, or tap New"
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
              <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-600">
                Dr. MJ is an AI and can be wrong. Trouble with chat? Email{" "}
                <a href={`mailto:${SITE.email}`} className="underline hover:text-zinc-800 dark:hover:text-zinc-300">
                  {SITE.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
