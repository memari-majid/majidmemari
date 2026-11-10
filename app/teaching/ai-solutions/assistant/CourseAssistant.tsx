"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { prepareCourseHistory } from "@/lib/course-kb/history";
import { courseCompletionNotice } from "@/lib/course-kb/completion";
import type { CourseChatMessage } from "@/lib/course-kb/types";
import remarkGfm from "remark-gfm";

const QUESTIONS = [
  "How do I turn a partner’s problem into a practical capstone?",
  "How can I test whether customers actually need my solution?",
  "Explain the difference between time saved and cash savings.",
  "What evidence should I include in my pilot plan?",
];
const COURSE_PREFIX = "/teaching/ai-solutions/";

function courseLink(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href, "https://www.majidmemari.com");
    if (url.origin !== "https://www.majidmemari.com" || !url.pathname.startsWith(COURSE_PREFIX)) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return undefined; }
}

const markdownComponents: Components = {
  a({ href, children }) {
    const safe = courseLink(href);
    return safe ? <a href={safe} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
  },
  img() { return null; },
  table({ children }) {
    return <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200" tabIndex={0} role="region" aria-label="Assistant comparison table"><table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 [&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold">{children}</table></div>;
  },
};

export function CourseAssistant() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [interruptedMessages, setInterruptedMessages] = useState<Set<string>>(() => new Set());
  const codeRef = useRef("");
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport<CourseChatMessage>({
    api: "/api/course-chat",
    prepareSendMessagesRequest: ({ messages }) => ({ body: { messages: prepareCourseHistory(messages) } }),
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (codeRef.current.trim()) headers.set("x-course-code", codeRef.current.trim());
      const response = await fetch(url, { ...init, headers });
      if (!response.ok) {
        let message = "The assistant could not answer. Please try again shortly.";
        try {
          const body = await response.json() as { error?: string };
          if (typeof body.error === "string") message = body.error;
        } catch { /* Keep the readable fallback for non-JSON service errors. */ }
        throw new Error(message);
      }
      return response;
    },
  }), []);
  const { messages, sendMessage, status, stop, error, regenerate, setMessages, clearError } = useChat<CourseChatMessage>({
    transport,
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      setInterruptedMessages(current => {
        const next = new Set(current);
        if (isAbort || isDisconnect || isError) next.add(message.id);
        else next.delete(message.id);
        return next;
      });
    },
  });
  const busy = status === "submitted" || status === "streaming";

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    clearError();
    setInput("");
    await sendMessage({ text: text.trim() });
  }

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6">
      <a href="/teaching/ai-solutions/index.html" className="text-sm font-medium text-sky-700 underline underline-offset-4">← Back to the course</a>
      <header className="mt-7 border-b border-zinc-200 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Building AI Solutions · Majid Memari</p>
        <h1 className="mt-3 text-4xl font-normal tracking-tight sm:text-5xl">A little help with your next step.</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">Ask the AI teaching assistant about a concept, a simulation, or your project. It looks up the course materials and brings the relevant sources into the conversation.</p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-6 text-sm">
          <div>
            <h2 className="text-xl">Start with a question</h2>
            <div className="mt-4 flex flex-col gap-2">
              {QUESTIONS.map(question => <button key={question} disabled={busy} onClick={() => void ask(question)} className="rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm leading-relaxed transition hover:border-teal-600 disabled:opacity-50">{question}</button>)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 leading-relaxed text-zinc-600">
            <p className="font-semibold text-zinc-900">Use it as a study partner.</p>
            <p className="mt-2">Check the linked lessons and important calculations. The assistant can help you reason and revise; it does not grade your work or replace your instructor.</p>
          </div>
          <details className="rounded-lg border border-zinc-200 p-4">
            <summary className="cursor-pointer font-medium">Have a course access code?</summary>
            <label htmlFor="course-access-code" className="mt-3 block text-xs text-zinc-600">Only needed if your instructor enables one.</label>
            <input id="course-access-code" type="password" autoComplete="off" value={code} onChange={event => { setCode(event.target.value); codeRef.current = event.target.value; }} className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2" />
            <p className="mt-2 text-xs text-zinc-600">Used for this conversation. Reloading clears it.</p>
          </details>
        </aside>
        <section aria-label="Conversation with the course teaching assistant" className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <h2 className="text-xl">Your conversation</h2>
            <button disabled={busy || messages.length === 0} onClick={() => { setMessages([]); setInterruptedMessages(new Set()); clearError(); setInput(""); questionRef.current?.focus(); }} className="min-h-11 rounded-md px-3 text-sm text-zinc-600 underline underline-offset-4 disabled:opacity-40">New conversation</button>
          </div>
          <div className="min-h-52 space-y-5 py-6" aria-label="Messages">
            {messages.length === 0 && <div className="rounded-xl border border-zinc-200 bg-white p-6"><p className="text-lg font-medium">Bring a question. Leave with a next step.</p><p className="mt-3 leading-relaxed text-zinc-600">Try “Help me choose a useful outcome measure for a customer-support pilot.” You can follow up, ask for a simpler explanation, or compare an idea with the course rubric.</p></div>}
            {messages.map(message => {
              const text = message.parts.filter(part => part.type === "text").map(part => part.type === "text" ? part.text : "").join("");
              const sources = message.parts.filter(part => part.type === "source-url");
              const completionNotice = message.role === "assistant" ? courseCompletionNotice(message.metadata, interruptedMessages.has(message.id)) : null;
              const seen = new Set<string>();
              return <article key={message.id} aria-label={message.role === "user" ? "Your question" : "Assistant response"} className={message.role === "user" ? "ml-6 rounded-xl bg-slate-950 p-5 text-white" : "rounded-xl border border-zinc-200 bg-white p-5 sm:p-6"}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${message.role === "user" ? "text-sky-200" : "text-teal-600"}`}>{message.role === "user" ? "You" : "Course teaching assistant"}</p>
                <div className="min-w-0 break-words text-sm leading-7 [&_a]:text-sky-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600 [&_blockquote]:pl-3 [&_h1]:my-3 [&_h1]:text-xl [&_h2]:my-3 [&_h2]:text-lg [&_h3]:my-3 [&_h3]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-auto [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
                  {message.role === "user" ? <p className="whitespace-pre-wrap">{text}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>}
                </div>
                {completionNotice && <p role="status" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{completionNotice}</p>}
                {sources.length > 0 && <div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Course material consulted</p><ul className="mt-2 space-y-2">{sources.map(source => {
                  if (source.type !== "source-url") return null;
                  const href = courseLink(source.url);
                  if (!href || seen.has(href)) return null;
                  seen.add(href);
                  return <li key={source.sourceId}><a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-700 underline underline-offset-4">{source.title || "Read the course source"}<span className="sr-only"> (opens in a new tab)</span></a></li>;
                })}</ul></div>}
              </article>;
            })}
            <p role="status" aria-live="polite" className="text-sm text-teal-600">{status === "submitted" ? "Finding relevant course material…" : status === "streaming" ? "Writing an explanation…" : ""}</p>
            {error && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><p>{error.message}</p><button type="button" disabled={busy} onClick={() => void regenerate()} className="mt-3 min-h-11 font-semibold underline underline-offset-4">Try the last question again</button></div>}
          </div>
          <form onSubmit={event => { event.preventDefault(); void ask(input); }} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label htmlFor="course-question" className="text-sm font-semibold">Your question</label>
            <textarea ref={questionRef} id="course-question" value={input} onChange={event => setInput(event.target.value)} maxLength={4000} rows={3} placeholder="Ask about a lesson, business decision, or your next project step…" className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-base leading-relaxed" />
            <div className="mt-3 flex items-center justify-between gap-4"><span className="text-xs text-zinc-600">{input.length.toLocaleString()} / 4,000 characters</span>{busy ? <button type="button" onClick={() => void stop()} className="min-h-11 rounded-md border border-zinc-200 px-5 py-2 text-sm font-semibold">Stop response</button> : <button type="submit" disabled={!input.trim()} className="min-h-11 rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40">Ask the assistant →</button>}</div>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-zinc-600">This optional assistant needs an internet connection. Your questions, recent conversation, and relevant course passages are sent to an AI service through Vercel. Do not enter confidential partner information or personal student records. The conversation is not saved by this page and clears when you reload; service-provider processing and logs may still apply.</p>
        </section>
      </div>
    </main>
  );
}
