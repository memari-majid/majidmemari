"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { prepareCourseHistory } from "@/lib/course-kb/history";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const QUICK_PROMPTS = [
  "Who is Building AI Solutions for?",
  "Tell me about the AI workshops",
  "How can I ask about mentorship?",
];

function textFromMessage(m: { parts: { type: string; text?: string }[] }) {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
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

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const activate = () => setOpen(true); if(new URLSearchParams(window.location.search).get("chat") === "open") activate(); window.addEventListener("open-website-chat",activate); return () => window.removeEventListener("open-website-chat",activate); }, []);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", fetch: chatFetch, prepareSendMessagesRequest: ({ messages }) => ({ body: { messages: prepareCourseHistory(messages) } }) }),
    [],
  );
  const { messages, sendMessage, status, stop, error } = useChat({ transport });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const returnFocusTarget = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
      );
      const visible = [...(elements ?? [])].filter(element => element.getClientRects().length > 0);
      if (!visible.length) return;
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      returnFocusTarget?.focus();
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    await sendMessage({ text: input.trim() });
    setInput("");
  }

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed z-[60] flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-zinc-50 ${open ? "hidden" : ""} bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]`}
        aria-label="Open website chatbot"
        aria-expanded={open}
        aria-controls={open ? "site-assistant-dialog" : undefined}
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
          id="site-assistant-dialog"
          className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/50 p-0 pt-[env(safe-area-inset-top)] sm:items-end sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <div className="flex h-full w-full min-w-0 max-w-[100vw] flex-col rounded-none border-0 border-zinc-200 bg-zinc-50 sm:h-[min(560px,85vh)] sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-200">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="chat-title" className="text-sm font-semibold text-zinc-900">
                    Website assistant
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                    AI
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {busy && (
                  <button
                    type="button"
                    onClick={() => void stop()}
                    className="text-xs text-zinc-600 hover:text-zinc-900"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  aria-label="Close chat"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <p className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">AI chat uses an external service. Keep questions general. Chat messages are not sent to Majid.</p>
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        disabled={busy}
                        onClick={() => void sendMessage({ text: q })}
                        className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-800 transition hover:border-teal-500 hover:text-teal-800 disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-6 border border-slate-900 bg-slate-900 text-white"
                      : "mr-4 border border-zinc-200 bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {m.role === "user" ? textFromMessage(m) : <ReactMarkdown components={{ a: ({href,children}) => href && /^(https:\/\/|\/)/.test(href) ? <a href={href} className="text-teal-800 underline underline-offset-4">{children}</a> : <span>{children}</span>, img: () => null }}>{textFromMessage(m)}</ReactMarkdown>}
                </div>
              ))}
              {error && (
                <p role="alert" className="text-xs text-amber-700">
                  The website assistant is temporarily unavailable. You can still open the contact form.
                </p>
              )}
              <Link href="/?inquiry=general" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline underline-offset-4">Contact Majid →</Link>
              <div ref={endRef} />
            </div>

            <div className="border-t border-zinc-200 p-3">
              <form onSubmit={onSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  aria-label="Message to the site assistant"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-teal-600 focus:outline-none sm:min-h-0 sm:text-sm"
                  disabled={busy}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
