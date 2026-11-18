import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseLearningFeatures } from "@/app/components/CourseLearningFeatures";
import { NavBar } from "@/app/components/NavBar";
import { getProject, PROJECTS } from "@/lib/projects";
import { PUBLICATIONS, publicationKindLabel } from "@/lib/publications";
import { ComputationMethods } from "@/app/components/ResearchArea";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return { title: "Project not found" };
  return { title: `${project.name} — ${project.kind}`, description: project.summary, alternates: { canonical: `/projects/${project.slug}` }, openGraph: { title: `${project.name} — Majid Memari`, description: project.summary, url: `/projects/${project.slug}` } };
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const researchConnections = PUBLICATIONS.flatMap((publication) => {
    const connection = publication.projectLinks?.find((link) => link.slug === project.slug);
    return connection ? [{ publication, relationship: connection.relationship }] : [];
  });
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline underline-offset-4">← Research</Link>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">{project.name}</h1>
        <p className="mt-2 text-sm text-slate-500">{project.kind} · {project.category}</p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{project.summary}</p>

        <div className="mt-8 grid gap-7 border-t border-slate-200 pt-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <aside aria-label="Project access and scope" className="space-y-5 lg:col-start-2 lg:row-start-1">
            <section>
              <h2 className="text-xl font-semibold">{project.publicDemo ? "Sample demonstration" : project.access}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.accessNote}</p>
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-teal-800 underline underline-offset-4">{project.publicDemo ? "View sample demonstration" : project.launchLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Scope &amp; limits</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.limit}</p>
            </section>
          </aside>
          <div className="border-t border-slate-200 pt-6 lg:col-start-1 lg:row-start-1 lg:border-0 lg:pt-0">
            <h2 className="text-2xl font-semibold">The problem &amp; approach</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{project.purpose}</p>
            {project.context && <p className="mt-4 text-sm leading-relaxed text-slate-600">{project.context}</p>}
            <p aria-label="Scientific keywords" className="mt-3 text-sm text-slate-500">{project.keywords.join(" · ")}</p>
            <ComputationMethods methods={project.computationMethods} />
            <h2 className="mt-8 text-2xl font-semibold">{project.publicDemo ? "Design & intended capabilities" : project.context ? "Methods & contributions" : "Inside the experience"}</h2>
            <ul className="mt-3 divide-y divide-slate-200">{project.capabilities.map((capability) => <li key={capability} className="py-3 text-sm leading-relaxed text-slate-600">{capability}</li>)}</ul>
            {project.sources && researchConnections.length === 0 && <section aria-labelledby="project-sources" className="mt-8 border-t border-slate-200 pt-6"><h2 id="project-sources" className="text-2xl font-semibold">{project.unpublished ? "Related literature" : "Published research"}</h2><ul className="mt-4 space-y-4">{project.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="block min-h-11 text-sm leading-relaxed text-teal-800 underline underline-offset-4">{source.title} ↗<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></section>}
          </div>
        </div>
        {project.slug === "building-ai-solutions" && (
          <section aria-labelledby="course-experience" className="mt-8 border-t border-slate-200 pt-6">
            <h2 id="course-experience" className="text-2xl font-semibold">Try the course</h2>
            <p className="mt-3 mb-5 text-sm leading-relaxed text-slate-600">The supplied cases are illustrative practice.</p>
            <CourseLearningFeatures headingLevel={3} />
          </section>
        )}
        {researchConnections.length > 0 && <section id="research" aria-labelledby="research-connections" className="mt-10 scroll-mt-28 border-t border-slate-200 pt-8">
          <h2 id="research-connections" className="text-2xl font-semibold">Research connections</h2>
          <ul className="mt-4 divide-y divide-slate-200">{researchConnections.map(({ publication, relationship }) => <li key={publication.id} className="py-5">
            <p className="text-xs font-medium text-slate-500">{publication.year} · {publicationKindLabel(publication)} · {relationship === "direct" ? "Project publication" : "Related research"}</p>
            <h3 className="mt-2 text-base font-semibold leading-relaxed"><a href={`/projects#${publication.id}`} className="block min-h-11 text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">{publication.title} →</a></h3>
            <a href={publication.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-2 inline-flex min-h-8 items-center text-sm text-teal-800 underline underline-offset-4">Publication record ↗<span className="sr-only"> (opens in a new tab)</span></a>
          </li>)}</ul>
        </section>}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
          <Link href={`/projects/${project.slug}?inquiry=research`} scroll={false} className="inline-flex min-h-11 items-center font-medium text-teal-800 underline underline-offset-4">Discuss this project →</Link>
        </div>
      </main>
    </div>
  );
}
