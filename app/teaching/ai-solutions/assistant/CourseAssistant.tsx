"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { prepareCourseHistory } from "@/lib/course-kb/history";
import { courseCompletionNotice } from "@/lib/course-kb/completion";
import { courseEvidenceLink, courseEvidenceNavigation, coursePageLabel, normalizeCoursePage, courseAssistantInitialMode } from "@/lib/course-kb/context";
import { COURSE_SESSION_KEY, parseCourseSession, serializeCourseSession, shouldPersistCourseSession } from "@/lib/course-kb/session";
import type { CourseChatMessage } from "@/lib/course-kb/types";
import remarkGfm from "remark-gfm";
import { LEARNING_ACTIVITIES, learningActivity, type LearningRequest } from "@/lib/course-kb/learning";
import { LearningLab } from "./LearningLab";
import { checkpointCourseConversation } from "@/lib/course-kb/conversation-checkpoint";

const LAB_STEP_NAMES = { decide: "Decide", investigate: "Investigate", revise: "Revise", transfer: "Apply" } as const;

const QUESTIONS = [
  "How do I turn a partner’s problem into a practical capstone?",
  "How can I test whether customers actually need my solution?",
  "Explain the difference between time saved and cash savings.",
  "What evidence should I include in my pilot plan?",
];
function courseLink(href: string | undefined): string | undefined {
  // The TA can explain how to contact Majid, but cannot send an inquiry itself.
  if (href === "https://www.majidmemari.com/?chat=open" || href === "/?chat=open") return "/?chat=open";
  return courseEvidenceLink(href);
}

const markdownComponents: Components = {
  img() { return null; },
  table({ children }) {
    return <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200" tabIndex={0} role="region" aria-label="Assistant comparison table"><table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 [&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold">{children}</table></div>;
  },
};

function groundedMarkdownComponents(sources: ReadonlySet<string>, canvasDelivery: boolean): Components {
  return { ...markdownComponents, a({ href, children }) {
    const safe = canvasDelivery ? undefined : courseLink(href);
    // Inline citations must match this answer's server-selected evidence, not
    // merely a plausible course URL invented in model prose.
    return safe && (safe === "/?chat=open" || sources.has(safe)) ? <a href={safe} target="_top">{children}</a> : <span>{children}</span>;
  } };
}

function CourseConversation({ embedded = false, lesson = "", canvasDelivery = false, learning }: { embedded?: boolean; lesson?: string; canvasDelivery?: boolean; learning?: LearningRequest }) {
  const currentLesson = normalizeCoursePage(lesson);
  const sessionKey = learning ? `${COURSE_SESSION_KEY}:lab:${currentLesson}` : COURSE_SESSION_KEY;
  const learningRef = useRef(learning);
  learningRef.current = learning;
  const [sessionReady, setSessionReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [input, setInput] = useState("");
  const [contextNotice, setContextNotice] = useState("");
  const [code, setCode] = useState("");
  const [interruptedMessages, setInterruptedMessages] = useState<Set<string>>(() => new Set());
  const codeRef = useRef("");
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport<CourseChatMessage>({
    api: "/api/course-chat",
    prepareSendMessagesRequest: ({ messages }) => ({ body: { ...(learningRef.current ? { learning: learningRef.current } : {}), messages: prepareCourseHistory(messages, { ...(learningRef.current ? { learning: learningRef.current } : {}), lesson: currentLesson, ...(canvasDelivery ? { delivery: "canvas" as const } : {}) }), lesson: currentLesson, ...(canvasDelivery ? { delivery: "canvas" } : {}) } }),
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
  }), [currentLesson, canvasDelivery]);
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
  const restored = useRef(false);
  const busy = status === "submitted" || status === "streaming";
  // A snapshot belongs to the request/view that produced it. Keep it current for
  // cleanup without making every streamed token replace the cleanup callback.
  const checkpointRef = useRef({ sessionReady, messages, lesson: currentLesson, interrupted: interruptedMessages, busy, failed: status === "error", sessionKey, stop });
  checkpointRef.current = { sessionReady, messages, lesson: currentLesson, interrupted: interruptedMessages, busy, failed: status === "error", sessionKey, stop };
  const previousPhase = useRef(learning?.phase);
  useEffect(() => () => {
    const snapshot = checkpointRef.current;
    checkpointCourseConversation(snapshot, raw => sessionStorage.setItem(snapshot.sessionKey, raw), snapshot.stop);
  }, []);
  useEffect(() => {
    if (previousPhase.current === learning?.phase) return;
    previousPhase.current = learning?.phase;
    const snapshot = checkpointRef.current;
    if (!snapshot.busy) return;
    const result = checkpointCourseConversation(snapshot, raw => sessionStorage.setItem(snapshot.sessionKey, raw), snapshot.stop);
    if (!result.saved) setStorageAvailable(false);
    const marked = new Map(result.messages.map(message => [message.id, message.metadata]));
    setMessages(current => current.map(message => marked.has(message.id) ? { ...message, metadata: marked.get(message.id) } : message));
    setContextNotice("The previous step’s coaching was stopped. Its question and any partial reply are kept below with their original step. Ask again for feedback on your current step.");
  }, [learning?.phase, setMessages]);
  // Read first, then let React commit both the restored messages and ready state.
  // A ref alone would let the initial empty render overwrite saved conversation.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try { setMessages(parseCourseSession(sessionStorage.getItem(sessionKey)).messages); }
    catch { setStorageAvailable(false); }
    setSessionReady(true);
  }, [setMessages, sessionKey]);
  useEffect(() => {
    if (!shouldPersistCourseSession(sessionReady, status)) return;
    try { sessionStorage.setItem(sessionKey, serializeCourseSession(messages, currentLesson, interruptedMessages, status === "error")); }
    catch { setStorageAvailable(false); }
  }, [messages, status, sessionReady, currentLesson, interruptedMessages, sessionKey]);
  useEffect(() => {
    if (!sessionReady) return;
    const saveBeforeLeaving = () => {
      try { sessionStorage.setItem(sessionKey, serializeCourseSession(messages, currentLesson, interruptedMessages, busy || status === "error")); }
      catch { /* A blocked storage API must not interrupt study. */ }
    };
    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => window.removeEventListener("pagehide", saveBeforeLeaving);
  }, [sessionReady, messages, currentLesson, interruptedMessages, busy, status, sessionKey]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && embedded) window.parent.postMessage({ type: "course-ta-close" }, window.location.origin);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [embedded]);

  function clearConversation() {
    if (busy || !sessionReady) return;
    try { sessionStorage.removeItem(sessionKey); } catch { setStorageAvailable(false); }
    setMessages([]); setInterruptedMessages(new Set()); clearError(); setInput(""); setContextNotice("");
    questionRef.current?.focus();
  }

  async function ask(text: string) {
    if (!text.trim() || busy || !sessionReady) return;
    clearError();
    setInput(""); setContextNotice("");
    const phase = learningRef.current?.phase;
    await sendMessage({ text: text.trim(), ...(phase ? { metadata: { learningPhase: phase } } : {}) });
  }

  const lastMessage = messages.at(-1);
  const lastCompletionNotice = lastMessage?.role === "assistant" ? courseCompletionNotice(lastMessage.metadata, interruptedMessages.has(lastMessage.id)) : null;

  return (
    <section aria-label="AI coaching conversation" className={embedded ? "course-assistant-embedded px-4 py-5" : "mx-auto max-w-3xl px-5 py-10"}>

      {!embedded && <header className="mb-8 border-b border-zinc-200 pb-6"><a href="/teaching/ai-solutions/index.html" className="text-sm font-semibold text-teal-800">← Building AI Solutions · Majid Memari</a><h1 className="mt-5 text-4xl">Your course teaching assistant.</h1><p className="mt-3 text-zinc-600">Study support grounded in the course materials. Open it from any lesson to keep your place.</p></header>}
      {currentLesson && <p className="mb-4 text-xs font-medium text-teal-800">Helping with {coursePageLabel(currentLesson)}</p>}
      {canvasDelivery && <p className="mb-4 rounded-lg bg-teal-50 p-3 text-xs leading-relaxed text-teal-900">Stay in Canvas while you study. Source titles below identify the material used; ask the TA to explain a source here. Submit your check-in and review instructor feedback in Canvas.</p>}
      <div>
        <section aria-label="Conversation with the course teaching assistant" className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <h2 className="text-lg">{learning ? "Lab coaching conversation" : "Let’s work through it."}</h2>
            <button disabled={busy || !sessionReady || messages.length === 0} onClick={clearConversation} className="min-h-11 rounded-md px-3 text-sm text-zinc-600 underline underline-offset-4 disabled:opacity-40">New conversation</button>
          </div>
          {learning && <p className="mt-3 text-xs leading-5 text-teal-900">Current step: <strong>{LAB_STEP_NAMES[learning.phase]}</strong>. Each message below identifies the step recorded when it was sent; earlier feedback is not a new assessment of your current response.</p>}
          {contextNotice && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{contextNotice}</p>}
          <div className="space-y-4 py-5" aria-label="Messages" aria-busy={busy}>
            {!sessionReady && <p role="status" className="text-sm text-zinc-600">Restoring this tab’s conversation…</p> }
            {sessionReady && messages.length === 0 && <div><p className="text-sm leading-relaxed text-zinc-600">{learning ? "Try your own reasoning first. The coach can offer a hint or respond to the attempt you have recorded above." : "Ask for a simpler explanation, help with the numbers, or a hint for your next step."}</p><div className="mt-4 flex flex-col gap-2">{(learning ? ["Give me feedback on my current decision-lab attempt and ask one question to help me improve it."] : currentLesson ? ["What should I learn and do on this course page?", "Help me understand the numbers on this course page."] : QUESTIONS.slice(0,2)).map(question => <button key={question} disabled={busy} onClick={() => void ask(question)} className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm hover:border-teal-600 disabled:opacity-50">{question}</button>)}</div></div>}
            {messages.map(message => {
              const text = message.parts.filter(part => part.type === "text").map(part => part.type === "text" ? part.text : "").join("");
              const sources = message.parts.filter(part => part.type === "source-url" && courseEvidenceLink(part.url));
              const completionNotice = message.role === "assistant" ? courseCompletionNotice(message.metadata, interruptedMessages.has(message.id)) : null;
              const seen = new Set<string>();
              return <article key={message.id} aria-label={message.role === "user" ? "Your question" : "Assistant response"} className={message.role === "user" ? "ml-4 rounded-xl bg-slate-950 p-4 text-white" : "rounded-xl border border-zinc-200 bg-white p-4"}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${message.role === "user" ? "text-sky-200" : "text-teal-800"}`}>{message.role === "user" ? "You" : "Course teaching assistant"}</p>
                {learning && <p className={`mb-2 text-xs ${message.role === "user" ? "text-sky-100" : "text-slate-600"}`}>{message.metadata?.learningPhase ? `${LAB_STEP_NAMES[message.metadata.learningPhase]} · recorded attempt` : 'Earlier lab conversation · step not recorded'}</p>}
                <div className="min-w-0 break-words text-sm leading-7 [&_a]:text-teal-800 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600 [&_blockquote]:pl-3 [&_h1]:my-3 [&_h1]:text-xl [&_h2]:my-3 [&_h2]:text-lg [&_h3]:my-3 [&_h3]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-auto [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
                  {message.role === "user" ? <p className="whitespace-pre-wrap">{text}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={groundedMarkdownComponents(new Set(sources.map(source => source.type === "source-url" ? courseEvidenceLink(source.url) ?? "" : "")), canvasDelivery)}>{text}</ReactMarkdown>}
                </div>
                {message.role === "user" && message.metadata?.requestInterrupted && <p className="mt-3 text-xs leading-5 text-sky-100">This coaching request was interrupted. Any partial reply is kept below. <button type="button" disabled={busy} onClick={() => void ask(text)} className="min-h-11 font-semibold underline underline-offset-4 disabled:opacity-50">Ask this question again{learning ? ' about the current step' : ''}</button></p>}
                {completionNotice && <p role="status" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{completionNotice}</p>}
                {sources.length > 0 && <div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Course material consulted</p><ul className="mt-2 space-y-2">{sources.map(source => {
                  if (source.type !== "source-url") return null;
                  const href = courseEvidenceLink(source.url);
                  if (!href || seen.has(href)) return null;
                  seen.add(href);
                  const destination = courseEvidenceNavigation(source.url, canvasDelivery);
                  if (!destination) return <li key={href}><span className="text-sm text-zinc-600">{source.title || "Course source"}</span></li>;
                  return <li key={href}><a href={destination} target="_top" className="text-sm text-teal-800 underline underline-offset-4">{source.title || "Read the course source"}<span className="sr-only"> (opens in the course)</span></a></li>;
                })}</ul></div>}
              </article>;
            })}
            <p role="status" aria-live="polite" className="text-sm text-teal-800">{status === "submitted" ? "Finding relevant course material…" : status === "streaming" ? "Writing an explanation…" : lastCompletionNotice ? "This reply is incomplete. Review the notice above before using it." : lastMessage?.role === "assistant" ? "Response ready. Review the explanation and sources above." : lastMessage?.metadata?.requestInterrupted ? "Your interrupted question is saved above. Ask it again when you are ready." : ""}</p>
            {error && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><p>{error.message}</p><button type="button" disabled={busy} onClick={() => void regenerate()} className="mt-3 min-h-11 font-semibold underline underline-offset-4">Try the last question again</button></div>}
          </div>
          <form onSubmit={event => { event.preventDefault(); void ask(input); }} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label htmlFor="course-question" className="text-sm font-semibold">{learning ? "A question about this step" : "Your question"}</label>
            <textarea ref={questionRef} id="course-question" disabled={!sessionReady} value={input} onChange={event => setInput(event.target.value)} maxLength={4000} rows={2} placeholder="What would you like help with?" className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-base leading-relaxed" />
            <div className="mt-3 flex items-center justify-between gap-4"><span className="text-xs text-zinc-600">{input.length.toLocaleString()} / 4,000 characters</span>{busy ? <button type="button" onClick={() => void stop()} className="min-h-11 rounded-md border border-zinc-200 px-5 py-2 text-sm font-semibold">Stop response</button> : <button type="submit" disabled={!sessionReady || !input.trim()} className="min-h-11 rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40">Ask the assistant →</button>}</div>
          </form>
          {!storageAvailable && <p role="status" className="mt-4 text-xs text-amber-900">This browser is blocking conversation storage. You can still ask questions, but your conversation may not survive a reload.</p>}
          <details className="mt-5 text-xs text-zinc-600"><summary className="cursor-pointer">Privacy, limits &amp; access code</summary><p className="mt-3 leading-relaxed">The TA can explain and coach; it cannot grade, submit work, or contact Majid. It sees this course page and what you share, including your current lab choice and written lab responses when coaching a decision lab, not your saved workbook notes. Check its sources and calculations.</p><label htmlFor="course-access-code" className="mt-3 block">Course code (only if your instructor supplies one)</label><input id="course-access-code" type="password" autoComplete="off" value={code} onChange={event => { setCode(event.target.value); codeRef.current = event.target.value; }} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white p-2" /><p className="mt-4 text-xs leading-relaxed text-zinc-600">This optional assistant needs an internet connection. Your current course page, questions, recent conversation, relevant course passages, and current decision-lab responses when coaching are sent to an AI service through Vercel. Do not enter confidential partner information or personal student records. The most recent conversation is saved in this browser tab so you can continue across units. Use New conversation to clear this tab’s saved conversation. The access code is not saved. Service-provider processing and logs may still apply.</p></details>
        </section>
      </div>
    </section>
  );
}

export function CourseAssistant({ embedded = false, lesson = "", canvasDelivery = false }: { embedded?: boolean; lesson?: string; canvasDelivery?: boolean }) {
  const [mode, setMode] = useState<'lab' | 'help'>(() => courseAssistantInitialMode(lesson));
  const [selectedPage, setSelectedPage] = useState(learningActivity(lesson)?.page ?? 'unit-01.html');
  const activity = learningActivity(selectedPage)!;
  return <main id="main-content" className={embedded ? 'px-3 py-4 sm:px-5' : 'mx-auto max-w-3xl px-4 py-8 sm:px-6'}>
    <header className="mb-5">
      {!embedded && <a href="/teaching/ai-solutions/index.html" className="text-sm font-semibold text-teal-800">← Building AI Solutions · Majid Memari</a>}
      <h1 className={embedded ? 'text-xl' : 'mt-5 text-3xl sm:text-4xl'}>Learn by making the next decision.</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Decide, investigate, revise, apply. The course TA coaches your reasoning as you work through each unit.</p>
    </header>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="Study mode">
      <button type="button" aria-pressed={mode === 'lab'} onClick={() => setMode('lab')} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold ${mode === 'lab' ? 'border-teal-800 bg-teal-50 text-teal-950' : 'border-slate-200 text-slate-600'}`}>Decision lab</button>
      <button type="button" aria-pressed={mode === 'help'} onClick={() => setMode('help')} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold ${mode === 'help' ? 'border-teal-800 bg-teal-50 text-teal-950' : 'border-slate-200 text-slate-600'}`}>Course questions</button>
    </div>
    {mode === 'lab' && <>
      {!learningActivity(lesson) && <div className="mb-5"><label htmlFor="lab-unit" className="text-sm font-semibold">Choose your current unit</label><select id="lab-unit" value={selectedPage} onChange={e => setSelectedPage(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm">{LEARNING_ACTIVITIES.map(a => <option key={a.page} value={a.page}>Unit {a.unit} · {a.title}</option>)}</select></div>}
      <LearningLab key={activity.page} activity={activity} canvasDelivery={canvasDelivery} renderCoach={learning => <CourseConversation key={activity.page} embedded lesson={activity.page} canvasDelivery={canvasDelivery} learning={learning} />} />
    </>}
    {mode === 'help' && <CourseConversation key={`general-help:${normalizeCoursePage(lesson) || activity.page}`} embedded lesson={normalizeCoursePage(lesson) || activity.page} canvasDelivery={canvasDelivery} />}
  </main>;
}
