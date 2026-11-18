"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Publication } from "@/lib/publications";

type ProjectSummary = { slug: string; name: string; summary: string; unpublished?: boolean; historical?: boolean; searchText: string };
export type DirectoryPublication = Publication & { kindLabel: string; searchText: string };
export type DirectoryGroup = { id: string; title: string; description: string; searchText: string; projects: ProjectSummary[]; publications: DirectoryPublication[] };
type ProjectResult = { project: ProjectSummary; papers: DirectoryPublication[]; expand: boolean };

function normalize(text: string) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Paper({ paper, projectSlug }: { paper: DirectoryPublication; projectSlug?: string }) {
  const relationship = paper.projectLinks?.find((link) => link.slug === projectSlug)?.relationship;
  const Heading = projectSlug ? "h4" : "h3";
  return (
    <article id={paper.id} data-publication-id={paper.id} tabIndex={-1} className="scroll-mt-28 py-4">
      <p className="text-xs text-slate-500">{paper.year} · {paper.kindLabel}{relationship ? ` · ${relationship === "direct" ? "Project publication" : "Related research"}` : ""}</p>
      <Heading className="mt-1 text-sm font-medium leading-relaxed text-slate-900"><a href={paper.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="block min-h-11 underline-offset-4 hover:text-teal-800 hover:underline">{paper.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens the publication record in a new tab)</span></a></Heading>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{paper.authors} · {paper.venue}</p>
      {paper.note && <p className="mt-1 text-xs leading-relaxed text-slate-500">{paper.note}</p>}
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{paper.summary}</p>
      <p aria-label="Scientific keywords" className="mt-2 text-xs leading-relaxed text-slate-500">{paper.keywords.join(" · ")}</p>
      {paper.computationMethods && <p className="mt-2 text-xs text-slate-500">{paper.computationMethods.join(" · ")}</p>}
      {paper.otherLinks && <div className="mt-1 flex flex-wrap gap-4 text-sm">{paper.otherLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center text-teal-800 underline underline-offset-4">{link.label} ↗<span className="sr-only"> (opens in a new tab)</span></a>)}</div>}
    </article>
  );
}

function Publications({ papers, label, expand, revealKey, projectSlug }: { papers: DirectoryPublication[]; label: string; expand: boolean; revealKey: string; projectSlug?: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (details.current) details.current.open = expand; }, [expand, revealKey]);
  return (
    <details ref={details} className="mt-1">
      <summary className="w-fit min-h-11 cursor-pointer py-3 text-sm text-teal-800 hover:underline">{label}</summary>
      <div className="ml-1 divide-y divide-slate-200 border-l border-slate-200 pl-4 sm:pl-5">{papers.map((paper) => <Paper key={paper.id} paper={paper} projectSlug={projectSlug} />)}</div>
    </details>
  );
}

export function ResearchDirectory({ groups }: { groups: DirectoryGroup[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [pendingHash, setPendingHash] = useState("");
  const tokens = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const matches = (text: string) => {
    const normalized = normalize(text);
    return tokens.every((token) => ["ai", "ml", "cv", "nlp", "llm", "llms", "rag", "hpc", "ocr"].includes(token)
      ? new RegExp(`\\b${token}\\b`).test(normalized)
      : normalized.includes(token));
  };
  const results = groups.flatMap((group) => {
    if (active !== "all" && active !== group.id) return [];
    const matchesArea = tokens.length > 0 && matches(group.searchText);
    const owner = (paper: DirectoryPublication) => paper.projectLinks?.find((link) => group.projects.some((project) => project.slug === link.slug))?.slug;
    const projects: ProjectResult[] = group.projects.flatMap((project) => {
      const related = group.publications.filter((paper) => owner(paper) === project.slug);
      const matchedPapers = related.filter((paper) => matches(paper.searchText));
      const projectMatches = matchesArea || matches(project.searchText);
      if (!projectMatches && matchedPapers.length === 0) return [];
      return [{ project, papers: projectMatches ? related : matchedPapers, expand: tokens.length > 0 && matchedPapers.length > 0 }];
    });
    const standalone = group.publications.filter((paper) => !owner(paper) && (matchesArea || matches(paper.searchText)));
    return projects.length || standalone.length ? [{ group, projects, standalone }] : [];
  });
  const projectCount = results.reduce((sum, result) => sum + result.projects.length, 0);
  const paperCount = results.reduce((sum, result) => sum + result.standalone.length + result.projects.reduce((count, project) => count + project.papers.length, 0), 0);

  useEffect(() => {
    const followHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (id === "finance-analytics" || id === "computational-biology") id = "big-data";
      const group = groups.find((item) => item.id === id || item.projects.some((project) => `work-${project.slug}` === id) || item.publications.some((paper) => paper.id === id));
      if (!group) return;
      setQuery("");
      setActive(group.id);
      setPendingHash(id);
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [groups]);

  useEffect(() => {
    if (!pendingHash) return;
    const target = document.getElementById(pendingHash);
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    target.scrollIntoView({ block: "start" });
    if (target.matches("[data-publication-id]")) target.focus({ preventScroll: true });
    setPendingHash("");
  }, [pendingHash, active, query]);

  return (
    <div className="mt-7">
      <div className="relative max-w-md">
        <label htmlFor="research-search" className="sr-only">Search research</label>
        <input id="research-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search research" className="[&::-webkit-search-cancel-button]:hidden min-h-11 w-full rounded-lg border border-slate-300 bg-white/45 px-4 pr-16 text-sm text-slate-900 placeholder:text-slate-500" />
        {query && <button type="button" onClick={() => setQuery("")} className="absolute inset-y-0 right-1 min-h-11 px-3 text-sm text-teal-800">Clear</button>}
      </div>
      <div role="group" aria-label="Filter by research area" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-200">
        {[{ id: "all", title: "All areas" }, ...groups].map((group) => <button key={group.id} type="button" aria-pressed={active === group.id} onClick={() => setActive(group.id)} className={`min-h-11 border-b-2 px-1 text-sm ${active === group.id ? "border-teal-800 font-medium text-teal-800" : "border-transparent text-slate-600 hover:text-teal-800"}`}>{group.title}</button>)}
      </div>
      <p role="status" className={tokens.length > 0 || active !== "all" ? "mt-3 text-xs text-slate-500" : "sr-only"}>
        {projectCount} {projectCount === 1 ? "project" : "projects"} · {paperCount} {paperCount === 1 ? "publication" : "publications & graduate works"}
      </p>
      {results.map(({ group, projects, standalone }) => (
        <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-28 pt-8">
          <h2 id={`${group.id}-heading`} className="text-2xl font-semibold tracking-tight">{group.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{group.description}</p>
          <div className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
            {projects.map(({ project, papers, expand }) => (
              <article key={project.slug} id={`work-${project.slug}`} data-project-slug={project.slug} className="scroll-mt-28 pb-4 pt-1">
                <h3 className="font-semibold">
                  <Link href={`/projects/${project.slug}`} className="group flex min-h-11 items-center justify-between gap-4 py-2 hover:text-teal-800">
                    <span className="group-hover:underline group-hover:underline-offset-4">{project.name}</span>
                    <span aria-hidden="true" className="shrink-0 text-teal-800">→</span>
                  </Link>
                </h3>
                {project.unpublished && <p className="mb-1 text-xs text-slate-500">Unpublished Ph.D. research</p>}
                {project.historical && !project.unpublished && project.slug === "grideye" && <p className="mb-1 text-xs text-slate-500">Historical concept</p>}
                <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{project.summary}</p>
                {papers.length > 0 && <Publications papers={papers} label="Related publications" expand={expand} revealKey={query} projectSlug={project.slug} />}
              </article>
            ))}
            {standalone.length > 0 && <div className="pt-1"><Publications papers={standalone} label={projects.length ? "Other publications" : "Publications"} expand={tokens.length > 0} revealKey={query} /></div>}
          </div>
        </section>
      ))}
      {results.length === 0 && <div className="py-12"><p className="text-slate-600">No matching research. Try another topic or view all areas.</p><button type="button" onClick={() => { setQuery(""); setActive("all"); }} className="mt-3 min-h-11 text-sm text-teal-800 underline underline-offset-4">Reset search and filters</button></div>}
    </div>
  );
}
