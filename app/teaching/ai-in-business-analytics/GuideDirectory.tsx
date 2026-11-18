"use client";

import Link from "next/link";
import { useState } from "react";
import type { GuideGroup } from "./reference";

export function GuideDirectory({ groups }: { groups: GuideGroup[] }) {
  const [query, setQuery] = useState("");
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visibleGroups = groups.map(({ title, guides }) => ({
    title,
    guides: guides.filter(({ label, description }) => {
      const searchText = (title + " " + label + " " + description).toLowerCase();
      return terms.every((term) => searchText.includes(term));
    }),
  })).filter(({ guides }) => guides.length > 0);
  const count = visibleGroups.reduce((total, { guides }) => total + guides.length, 0);

  return (
    <section id="guides" aria-labelledby="guides-heading" className="mt-10 border-t border-slate-200 pt-7 sm:mt-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <h2 id="guides-heading" className="text-2xl font-semibold tracking-tight">Browse the reference</h2>
        <label className="w-full max-w-70 sm:w-64">
          <span className="sr-only">Filter guides by title or topic</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title or topic"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white/45 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600"
          />
        </label>
      </div>
      <p role="status" className={terms.length > 0 ? "mb-4 text-sm text-slate-600" : "sr-only"}>
        {terms.length > 0 ? count + (count === 1 ? " guide matches" : " guides match") : ""}
      </p>
      {count > 0 ? (
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {visibleGroups.map((group) => (
            <details key={group.title} open={terms.length > 0 ? true : undefined} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-medium hover:text-teal-800 [&::-webkit-details-marker]:hidden">
                {group.title}
                <span aria-hidden="true" className="shrink-0 text-lg text-teal-800 group-open:rotate-45">+</span>
              </summary>
              <ul className="space-y-1 pb-4 pl-3 sm:pl-4">
                {group.guides.map((guide) => (
                  <li key={guide.href}>
                    <Link href={guide.href} className="group/guide block py-2">
                      <span className="flex items-baseline justify-between gap-3 text-sm font-semibold text-teal-800 group-hover/guide:underline group-hover/guide:underline-offset-4">
                        {guide.label}
                        <span aria-hidden="true" className="shrink-0">→</span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{guide.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-200 p-5 text-sm leading-relaxed text-slate-600">Try a topic such as forecasting, finance, or teaching.</p>
      )}
    </section>
  );
}
