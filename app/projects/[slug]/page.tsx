import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_GUIDES } from "@/lib/demo-guides";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { getProject, PROJECTS } from "@/lib/projects";
import { PUBLICATIONS, publicationKindLabel } from "@/lib/publications";

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
  const guide = DEMO_GUIDES[project.slug];
  const researchConnections = PUBLICATIONS.flatMap((publication) => {
    const connection = publication.projectLinks?.find((link) => link.slug === project.slug);
    return connection ? [{ publication, relationship: connection.relationship }] : [];
  });
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline underline-offset-4">← All projects</Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">{project.kind} · {project.category}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">{project.name}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{project.summary}</p>
        {project.context && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{project.context}</p>}

        {guide && <section aria-labelledby="demo-guide" className="mt-9 rounded-2xl border border-teal-900/15 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">Your first walkthrough</p>
          <h2 id="demo-guide" className="mt-3 text-2xl font-semibold">How the demo works</h2>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">{guide.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600"><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-900/[0.07] font-semibold text-teal-800">{index + 1}</span><span>{step}</span></li>)}</ol>
          <a href={project.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900">Try this walkthrough ↗<span className="sr-only"> (opens in a new tab)</span></a>
        </section>}
        <div className="mt-10 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">The problem &amp; approach</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{project.purpose}</p>
            <h2 className="mt-9 text-2xl font-semibold">{project.context ? "Methods & contributions" : "Inside the experience"}</h2>
            <ul className="mt-4 divide-y divide-slate-200">{project.capabilities.map((capability, index) => <li key={capability} className="flex gap-4 py-4"><span aria-hidden="true" className="pt-0.5 text-xs font-semibold text-teal-800">0{index + 1}</span><span className="text-sm leading-relaxed text-slate-600">{capability}</span></li>)}</ul>
            {project.sources && researchConnections.length === 0 && <section aria-labelledby="project-sources" className="mt-8 border-t border-slate-200 pt-6"><h2 id="project-sources" className="text-2xl font-semibold">Published research</h2><ul className="mt-4 space-y-4">{project.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="text-sm leading-relaxed text-teal-800 underline underline-offset-4">{source.title} ↗<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></section>}
          </div>
          <aside aria-label="Project access and scope" className="space-y-5">
            <section className="rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">Explore</p>
              <h2 className="mt-3 text-xl font-semibold">{project.access}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.accessNote}</p>
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-900">{project.publicDemo ? "Launch public demo" : project.launchLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{project.publicDemo ? "No account required. Uses public or fictional sample data." : project.group === "research" ? "Opens the public research source." : "Opens the public project experience."}</p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Scope &amp; limits</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.limit}</p>
            </section>
          </aside>
        </div>
        {researchConnections.length > 0 && <section id="research" aria-labelledby="research-connections" className="mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="research-connections" className="text-2xl font-semibold">Research connections</h2>
          <ul className="mt-4 divide-y divide-slate-200">{researchConnections.map(({ publication, relationship }) => <li key={publication.id} className="py-5">
            <p className="text-xs font-medium text-slate-500">{publication.year} · {publicationKindLabel(publication)} · {relationship === "direct" ? "Project publication" : "Related research"}</p>
            <h3 className="mt-2 text-base font-semibold leading-relaxed"><a href={`/publications#${publication.id}`} className="text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">{publication.title} →</a></h3>
            <a href={publication.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-2 inline-flex min-h-8 items-center text-sm text-teal-800 underline underline-offset-4">Publication record ↗<span className="sr-only"> (opens in a new tab)</span></a>
          </li>)}</ul>
        </section>}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
          <Link href="/projects" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Explore the full collection</Link>
          <Link href="/?chat=open" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Discuss this project</Link>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
