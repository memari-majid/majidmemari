"use client";

/**
 * The small pieces every tool card is built from. One card shell, one dot
 * scale, one copy button, so the panel and the inline demo cannot drift.
 *
 * Every card gets `min-w-0` and wraps or scrolls inside its own container:
 * nothing here may widen the page.
 */

import { useState, type ReactNode } from "react";
import { copyText, type Phase } from "@/app/components/chat/chat-ui";
import { FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import { SITE } from "@/lib/site";

export const DOT: Record<Phase, string> = {
  running: "bg-sky-500 animate-pulse motion-reduce:animate-none",
  waiting: "bg-amber-500",
  done: "bg-emerald-500",
  failed: "bg-red-500",
  skipped: "bg-zinc-400 dark:bg-zinc-600",
};

export function CardShell({ title, phase, children }: { title: string; phase: Phase; children?: ReactNode }) {
  return (
    <div className="mr-4 min-w-0 space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-300">
      <div
        role={phase === "running" ? "status" : undefined}
        className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
      >
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT[phase]}`} />
        <span className="min-w-0 break-words">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <p className="min-w-0 whitespace-pre-wrap break-words">
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}: </span>
      {text}
    </p>
  );
}

export function ListField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="whitespace-pre-wrap break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid min-w-0 grid-cols-[auto_1fr] gap-x-2">
      <dt className="font-medium text-zinc-900 dark:text-zinc-100">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

export function CopyButton({ text, disabled }: { text: () => string | undefined; disabled?: boolean }) {
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

const FALLBACK_LINK_CLASS =
  "underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:decoration-zinc-600 dark:hover:text-zinc-100";

/**
 * Where else to reach him. The contact form goes through the same email path
 * as every chat send, so while email is off it only logs on the server too and
 * the copy must not promise it is reliable. The mailbox is the one route that
 * lands in his inbox today.
 */
export function ContactFallback({ emailOff }: { emailOff: boolean }) {
  return (
    <p className="min-w-0 break-words">
      The{" "}
      <a href="/contact" className={FALLBACK_LINK_CLASS}>
        contact form
      </a>{" "}
      {emailOff
        ? `goes through the same email path, so right now it also only logs your message on the server. To be sure ${FOUNDER_CHAT_NAME} sees this, email `
        : `is the other way to reach ${FOUNDER_CHAT_NAME}, or email `}
      <a href={`mailto:${SITE.email}`} className={FALLBACK_LINK_CLASS}>
        {SITE.email}
      </a>{" "}
      directly.
    </p>
  );
}
