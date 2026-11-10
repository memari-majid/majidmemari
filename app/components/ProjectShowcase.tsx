import Link from "next/link";
import { DEMO_GUIDES } from "@/lib/demo-guides";
import { FEATURED_PROJECT_SLUGS, PROJECTS, type Project } from "@/lib/projects";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-700/40 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">{project.kind}</p>
        <span aria-hidden="true" className="font-serif text-xl text-slate-400">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">
        <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:text-teal-800 hover:underline">{project.name}</Link>
      </h3>
      <p className="mt-2 text-xs text-slate-500">{project.category}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.summary}</p>
      {DEMO_GUIDES[project.slug] && <p className="mt-4 border-l-2 border-teal-700/40 pl-3 text-sm leading-relaxed text-slate-600"><strong className="font-semibold text-slate-900">Try this:</strong> {DEMO_GUIDES[project.slug].preview}</p>}
      <div className="mt-auto pt-6">
        <p className="inline-flex rounded-full border border-slate-200 bg-[#f7f6f2] px-3 py-1 text-xs font-medium text-slate-600">{project.access}</p>
        <a href={project.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`${project.publicDemo ? "Try public demo" : project.launchLabel}: ${project.name}`} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-900">
          {project.publicDemo ? "Try public demo" : project.launchLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
        </a>
        <Link href={`/projects/${project.slug}`} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">
          About this project <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function ProjectShowcase() {
  const featured = PROJECTS.filter((project) => FEATURED_PROJECT_SLUGS.includes(project.slug));
  return (
    <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-10 sm:px-8">
      <div className="border-t border-slate-200 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="projects-heading" className="text-2xl font-normal">Selected projects</h2>
          <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-normal text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">All {PROJECTS.length} projects →</Link>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Try a guided demo with fictional or public samples. No sign-in required.</p>
        <div className="mt-5 divide-y divide-slate-200">{featured.map((project) => (
          <article key={project.slug} className="flex flex-col gap-3 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="max-w-2xl">
              <h3 className="text-lg font-normal"><Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:text-teal-800 hover:underline">{project.name}</Link></h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{project.summary}</p>
            </div>
            <a href={project.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Try public demo: ${project.name}`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-normal text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">Try demo ↗<span className="sr-only"> (opens in a new tab)</span></a>
          </article>
        ))}</div>
      </div>
    </section>
  );
}
