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
    <section id="guides" aria-labelledby="guides-heading" className="mt-12 border-t border-slate-200 pt-8 sm:mt-16 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h2 id="guides-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">Browse the reference</h2>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleGroups.map((group) => (
            <section key={group.title} className="min-w-0 rounded-2xl border border-slate-200 bg-white/50 p-5 sm:p-6">
              <h3 className="font-serif text-xl font-semibold tracking-tight">{group.title}</h3>
              <ul className="mt-3 divide-y divide-slate-200">
                {group.guides.map((guide) => (
                  <li key={guide.href}>
                    <Link href={guide.href} className="group block rounded-sm py-3 last:pb-2">
                      <span className="flex items-baseline justify-between gap-3 font-semibold text-teal-800 group-hover:underline group-hover:underline-offset-4">
                        {guide.label}
                        <span aria-hidden="true" className="shrink-0">→</span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600">{guide.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-200 p-5 text-sm leading-relaxed text-slate-600">Try a topic such as forecasting, finance, or teaching.</p>
      )}
    </section>
  );
}
