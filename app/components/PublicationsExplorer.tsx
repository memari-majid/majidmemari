"use client";

import Link from "next/link";
import { useState } from "react";
import type { Publication, ResearchFocusId } from "@/lib/publications";

export type PublicationView = Omit<Publication, "projectLinks"> & {
  kindLabel: string;
  focusLabels: readonly string[];
  projectLinks: readonly { slug: string; name: string; relationship: "direct" | "related" }[];
};
type Props = {
  publications: readonly PublicationView[];
  focuses: readonly { id: ResearchFocusId; label: string; description: string }[];
};

export function PublicationsExplorer({ publications, focuses }: Props) {
  const [active, setActive] = useState<ResearchFocusId | "all">("all");
  const filtered = active === "all" ? publications : publications.filter((paper) => paper.topics.includes(active));
  const focus = focuses.find((item) => item.id === active);
  const buttonClass = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition";
  return (
    <section aria-labelledby="publication-list-heading" className="mt-9">
      <div className="border-y border-slate-200 py-5">
        <h2 className="text-sm font-medium">Explore by research focus</h2>
        <div role="group" aria-label="Filter publications by research focus" className="mt-3 flex flex-wrap gap-2">
          <button type="button" aria-pressed={active === "all"} aria-controls="publication-results" onClick={() => setActive("all")} className={`${buttonClass} ${active === "all" ? "border-teal-800 bg-teal-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-700"}`}>All work <span className={active === "all" ? "text-white/80" : "text-slate-500"}>{publications.length}</span></button>
          {focuses.map((item) => <button key={item.id} type="button" aria-pressed={active === item.id} aria-controls="publication-results" onClick={() => setActive(item.id)} className={`${buttonClass} ${active === item.id ? "border-teal-800 bg-teal-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-700"}`}>{item.label}<span className={active === item.id ? "text-white/80" : "text-slate-500"}>{publications.filter((paper) => paper.topics.includes(item.id)).length}</span></button>)}
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{focus ? focus.description : "Works can span more than one focus. Journal articles, conference papers, preprints, and graduate research are labeled separately."}</p>
      </div>
      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="publication-list-heading" className="text-2xl font-semibold tracking-tight">{focus ? focus.label : "Publications & graduate research"}</h2>
        <p role="status" aria-live="polite" className="text-sm text-slate-500">{filtered.length} of {publications.length} works</p>
      </div>
      <ol id="publication-results" className="mt-3 max-w-4xl divide-y divide-slate-200">
        {filtered.map((paper) => <li key={paper.id} id={paper.id} className="scroll-mt-28 py-7">
          <article aria-labelledby={`${paper.id}-title`}>
            <p className="text-xs font-medium uppercase tracking-wider text-teal-800">{paper.year} · {paper.kindLabel}</p>
            <h3 id={`${paper.id}-title`} className="mt-2 text-lg font-semibold leading-relaxed tracking-tight text-slate-900"><a href={paper.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline-offset-4 hover:text-teal-800 hover:underline">{paper.title}<span aria-hidden="true" className="ml-1 text-sm text-teal-800">↗</span><span className="sr-only"> (opens the publication record in a new tab)</span></a></h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{paper.authors}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{paper.venue}</p>
            {paper.note && <p className="mt-1 text-sm leading-relaxed text-slate-500">{paper.note}</p>}
            <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">{paper.summary}</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{paper.focusLabels.join(" · ")}</p>
            {paper.projectLinks.length > 0 && <ul className="mt-3 space-y-2">{paper.projectLinks.map((project) => <li key={project.slug} className="text-sm leading-relaxed"><span className="text-slate-500">{project.relationship === "direct" ? "Project study: " : project.slug === "building-ai-solutions" ? "Related course: " : "Related project: "}</span><Link href={`/projects/${project.slug}`} className="inline-flex min-h-8 items-center font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">{project.name} →</Link></li>)}</ul>}
            {paper.otherLinks && <div className="mt-3 flex flex-wrap gap-4 text-sm">{paper.otherLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-8 items-center text-teal-800 underline underline-offset-4">{link.label} ↗<span className="sr-only"> (opens in a new tab)</span></a>)}</div>}
          </article>
        </li>)}
      </ol>
      {filtered.length === 0 && <p className="py-8 text-slate-600">No works are listed for this focus yet. Choose another focus or view all work.</p>}
    </section>
  );
}
