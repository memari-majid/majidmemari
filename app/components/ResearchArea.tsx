import Link from "next/link";
import type { Project } from "@/lib/projects";
import { publicationKindLabel, type Publication } from "@/lib/publications";
import type { WorkGroup } from "@/lib/work-groups";

export function ComputationMethods({ methods }: { methods?: readonly string[] }) {
  return methods && methods.length > 0 ? <ul aria-label="Computational methods" className="mt-3 flex flex-wrap gap-2">{methods.map((method) => <li key={method} className="rounded-full border border-teal-800/20 px-3 py-1 text-xs text-teal-800">{method}</li>)}</ul> : null;
}

function PublicationEntry({ paper, project }: { paper: Publication; project?: Project }) {
  const relationship = project && paper.projectLinks?.find((connection) => connection.slug === project.slug)?.relationship;
  const Heading = project ? "h4" : "h3";
  return (
    <article id={paper.id} data-publication-id={paper.id} className="scroll-mt-28 py-6">
      <p className="text-xs font-medium text-teal-800">{paper.year} · {publicationKindLabel(paper)}{relationship ? ` · ${relationship === "direct" ? "Project publication" : "Related research"}` : ""}</p>
      <Heading className="mt-2 text-base font-medium leading-relaxed text-slate-900 sm:text-lg"><a href={paper.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline-offset-4 hover:text-teal-800 hover:underline">{paper.title}<span aria-hidden="true" className="ml-1 text-sm text-teal-800">↗</span><span className="sr-only"> (opens the publication record in a new tab)</span></a></Heading>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{paper.authors}<span aria-hidden="true"> · </span>{paper.venue}</p>
      {paper.note && <p className="mt-1 text-sm leading-relaxed text-slate-500">{paper.note}</p>}
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{paper.summary}</p>
      <ComputationMethods methods={paper.computationMethods?.filter((method) => !project?.computationMethods?.includes(method))} />
      {paper.otherLinks && <div className="mt-2 flex flex-wrap gap-4 text-sm">{paper.otherLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-9 items-center text-teal-800 underline underline-offset-4">{link.label} ↗<span className="sr-only"> (opens in a new tab)</span></a>)}</div>}
    </article>
  );
}

function ProjectWork({ project, papers }: { project: Project; papers: Publication[] }) {
  return (
    <div id={`work-${project.slug}`} data-project-slug={project.slug} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white">
      <article className="p-6 sm:p-7">
        <p className="text-xs font-medium text-teal-800">{project.kind} · {project.category}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight"><Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:text-teal-800 hover:underline">{project.name}</Link></h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{project.summary}</p>
        {project.context && <p className="mt-2 text-xs leading-relaxed text-slate-500">{project.context}</p>}
        <ComputationMethods methods={project.computationMethods} />
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href={`/projects/${project.slug}`} className="inline-flex min-h-11 items-center text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">About the {project.group === "learning" && !project.publicDemo ? "course" : "project"} →</Link>
        </div>
      </article>
      {papers.length > 0 && <div role="group" aria-label={`Publications connected to ${project.name}`} className="border-t border-slate-200 px-6 sm:px-7">
        <div className="divide-y divide-slate-200">{papers.map((paper) => <PublicationEntry key={paper.id} paper={paper} project={project} />)}</div>
      </div>}
    </div>
  );
}

export function ResearchArea({ group }: { group: WorkGroup }) {
  // Give each paper one home beside its first related project in this focus.
  const projectForPaper = new Map(group.publications.map((paper) => [paper.id, paper.projectLinks?.find((connection) => group.projects.some((project) => project.slug === connection.slug))?.slug]));
  const standalone = group.publications.filter((paper) => !projectForPaper.get(paper.id));
  return (
    <section id={group.id} aria-labelledby={`${group.id}-heading`} className="mt-12 scroll-mt-28 border-t border-slate-300 pt-8 sm:mt-14 sm:pt-10">
      {group.id === "big-data" && <><span id="finance-analytics" className="block scroll-mt-28" aria-hidden="true" /><span id="computational-biology" className="block scroll-mt-28" aria-hidden="true" /></>}
      <h2 id={`${group.id}-heading`} className="text-3xl font-semibold tracking-tight sm:text-4xl">{group.title}</h2>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{group.description}</p>
      <ul aria-label={`Topics in ${group.title}`} className="mt-4 flex flex-wrap gap-2">{group.subtopics.map((topic) => <li key={topic} className="rounded-full bg-teal-900/[0.06] px-3 py-1 text-xs text-teal-800">{topic}</li>)}</ul>
      <p className="mt-3 text-xs text-slate-500">{group.projects.length > 0 ? `${group.projects.length} ${group.projects.length === 1 ? "project" : "projects"} · ` : ""}{group.publications.length} {group.publications.length === 1 ? "publication" : "publications & graduate works"}</p>
      <div className="mt-6 space-y-5">
        {group.projects.map((project) => <ProjectWork key={project.slug} project={project} papers={group.publications.filter((paper) => projectForPaper.get(paper.id) === project.slug)} />)}
        {standalone.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white px-6 sm:px-7">
          {group.projects.length > 0 && <p className="pt-6 text-xs font-medium uppercase tracking-wider text-teal-800">Further research in this area</p>}
          <div className="divide-y divide-slate-200">{standalone.map((paper) => <PublicationEntry key={paper.id} paper={paper} />)}</div>
        </div>}
      </div>
    </section>
  );
}
