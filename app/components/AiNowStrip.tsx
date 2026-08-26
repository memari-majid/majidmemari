"use client";

import { useCallback, useEffect, useState } from "react";
import { AiMarketPulse } from "@/app/components/AiMarketPulse";

type Headline = { title: string; url: string; source: string };
type ApiOk = { ok: true; updatedAt: number; headlines: Headline[] };
type ApiErr = { ok: false; error: string };

export function AiNowStrip() {
  const [data, setData] = useState<ApiOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const json = (await res.json()) as ApiOk | ApiErr;
      if (!json.ok) {
        setError(json.error);
        setData(null);
        return;
      }
      setError(null);
      setData(json);
    } catch {
      setError("Could not load AI headlines.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div id="ai-now" className="mt-20 scroll-mt-20 border-t border-zinc-200/80 pt-16 dark:border-zinc-800/40">
      <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        AI now
      </p>
      <h3 className="mt-3 text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Current practice &amp; public headlines
      </h3>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Headlines from public feeds (arXiv cs.AI and Hugging Face). Titles are not written here.
        Market quotes below are indicative only — not investment advice.
      </p>

      {loading && !data && (
        <div className="flex justify-center py-8">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"
            role="status"
            aria-label="Loading AI headlines"
          />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load().finally(() => setLoading(false));
            }}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </p>
      )}

      {data?.headlines && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.headlines.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card block h-full p-5 transition hover:border-sky-300 dark:hover:border-sky-800"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {item.source}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {item.title}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}

      <AiMarketPulse variant="embedded" />
    </div>
  );
}
