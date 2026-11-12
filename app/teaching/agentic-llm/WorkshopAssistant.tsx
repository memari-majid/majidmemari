"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

const WORKSHOP_CODE_KEY = "workshop-ta-code";

const SUGGESTED_QUESTIONS = [
  "Why did chat fail on the long GTC context in 1e_dataset_chat?",
  "How do I get structured output to follow the Pydantic schema in 2_structuring?",
  "How does the route node work in 3_langgraph?",
  "A service is red in 0_table_of_contents. What should I check?",
  "What does the 4t_assessment grader expect?",
];

function workshopCodeFromSession(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(WORKSHOP_CODE_KEY)?.trim() ?? "";
}

function storeWorkshopCode(value: string) {
  const trimmed = value.trim();
  if (trimmed) sessionStorage.setItem(WORKSHOP_CODE_KEY, trimmed);
  else sessionStorage.removeItem(WORKSHOP_CODE_KEY);
}

async function workshopChatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("x-workshop-code", workshopCodeFromSession());
  const res = await globalThis.fetch(input, { ...init, headers });
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

function textFromMessage(m: { parts: { type: string; text?: string }[] }) {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

const markdownComponents: Components = {
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  pre({ children }) {
    return (
      <pre className="my-2 max-w-full overflow-x-auto whitespace-pre rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-900 [&>code]:block [&>code]:bg-transparent [&>code]:p-0 [&>code]:font-mono [&>code]:text-xs [&>code]:text-inherit">
        {children}
      </pre>
    );
  },
  code({ className, children }) {
    const raw = String(children);
    const isBlock = Boolean(className?.startsWith("language-")) || raw.includes("\n");
    if (isBlock) {
      return <code className={className ? `font-mono ${className}` : "font-mono"}>{children}</code>;
    }
    return (
      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-900">
        {children}
      </code>
    );
  },
};

function MarkdownAnswer({ text }: { text: string }) {
  return (
    <div className="min-w-0 break-words text-sm leading-relaxed [&_a]:break-words [&_a]:text-teal-800 [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  );
}

function SuggestedQuestions({
  disabled,
  onAsk,
  layout,
}: {
  disabled: boolean;
  onAsk: (question: string) => void;
  layout: "wrap" | "scroll";
}) {
  const buttonClass =
    "min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-snug text-slate-800 transition hover:border-teal-700 hover:text-teal-800 disabled:opacity-50";

  if (layout === "scroll") {
    return (
      <div className="min-w-0 overflow-x-auto pb-2">
        <div className="flex w-max gap-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => onAsk(question)}
              className={`${buttonClass} shrink-0 whitespace-nowrap`}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onAsk(question)}
          className={buttonClass}
        >
          {question}
        </button>
      ))}
    </div>
  );
}

export function WorkshopAssistant() {
  const [code, setCode] = useState("");
  const [codeReady, setCodeReady] = useState(false);
  const [codeNote, setCodeNote] = useState("Stored in this browser tab and sent with each question.");
  const [input, setInput] = useState("");
  const codeRef = useRef("");
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/workshop-chat", fetch: workshopChatFetch }),
    [],
  );
  const { messages, sendMessage, status, stop, error } = useChat({ transport });
  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    const stored = sessionStorage.getItem(WORKSHOP_CODE_KEY) ?? "";
    const next = codeRef.current.trim() ? codeRef.current : stored;
    codeRef.current = next;
    setCode(next);
    if (next.trim()) storeWorkshopCode(next);
    setCodeReady(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error]);

  function updateCode(value: string) {
    codeRef.current = value;
    setCode(value);
    storeWorkshopCode(value);
  }

  async function ask(text: string) {
    if (codeReady) storeWorkshopCode(codeRef.current);
    await sendMessage({ text });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    await ask(text);
    setInput("");
  }

  function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateCode(codeRef.current);
    setCodeNote(
      codeRef.current.trim() ? "Saved for this tab." : "Cleared for this tab. You can still ask a question.",
    );
  }

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
      <header className="shrink-0 border-b border-slate-200 pb-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">Workshop</p>
        <h1 className="mt-2 text-2xl font-serif font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Building Agentic AI Applications with LLMs
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          AI Workshop Companion for the NVIDIA DLI live lab (Dr. Majid Memari)
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          This assistant follows the current notebooks (1_basic_chat through 4t_assessment), not the old
          archive names.
        </p>
        <form onSubmit={onCodeSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="workshop-code" className="text-xs font-medium text-slate-600">
              Workshop code
            </label>
            <input
              id="workshop-code"
              value={code}
              onChange={(e) => {
                updateCode(e.target.value);
                setCodeNote("Stored in this browser tab and sent with each question.");
              }}
              onBlur={() => updateCode(codeRef.current)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="From your instructor"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-600 focus:border-teal-700 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:border-teal-700 hover:text-teal-800"
          >
            Save
          </button>
        </form>
        <p className="mt-1.5 text-xs text-slate-600">{codeNote}</p>
      </header>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Ask about a notebook step, an environment error, or a TODO. Common stuck points:
            </p>
            <SuggestedQuestions disabled={busy} onAsk={(question) => void ask(question)} layout="wrap" />
          </div>
        )}
        {messages.map((m) => {
          const text = textFromMessage(m);
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`min-w-0 rounded-lg px-3 py-2 ${
                isUser
                  ? "ml-6 whitespace-pre-wrap break-words bg-slate-950 text-sm text-white"
                  : "mr-4 border border-slate-200 bg-white text-slate-800"
              }`}
            >
              {isUser ? (
                text
              ) : text ? (
                <MarkdownAnswer text={text} />
              ) : (
                <p className="text-sm text-slate-600">Answering…</p>
              )}
            </div>
          );
        })}
        {busy && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="mr-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            Answering…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-slate-200 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {messages.length > 0 && (
          <SuggestedQuestions disabled={busy} onAsk={(question) => void ask(question)} layout="scroll" />
        )}
        {error && (
          <p role="alert" className="mb-2 text-xs text-amber-700">
            {error.message || "Something went wrong. Try again."}
          </p>
        )}
        <form onSubmit={onSubmit} className="flex gap-2">
          <label htmlFor="workshop-question" className="sr-only">
            Question
          </label>
          <input
            id="workshop-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the lab…"
            enterKeyHint="send"
            disabled={busy}
            className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-600 focus:border-teal-700 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 sm:text-sm"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="min-h-[44px] shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:border-slate-400"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="min-h-[44px] shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
