import Link from "next/link";
import { FEATURED_PROJECT_SLUGS, PROJECTS, type Project } from "@/lib/projects";

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="py-4">
      <h3 className="text-lg font-semibold">
        <Link href={`/projects/${project.slug}`} className="inline-flex min-h-11 items-center gap-2 text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">
          {project.name} <span aria-hidden="true">→</span>
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{project.summary}</p>
    </article>
  );
}

export function ProjectShowcase() {
  const featured = PROJECTS.filter((project) => FEATURED_PROJECT_SLUGS.includes(project.slug));
  return (
    <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-10 sm:px-8">
      <div className="border-t border-slate-200 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="projects-heading" className="text-2xl font-semibold tracking-tight">Selected projects</h2>
          <Link href="/projects" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">Explore research →</Link>
        </div>
        <div className="mt-3 divide-y divide-slate-200">
          {featured.map((project) => <ProjectCard key={project.slug} project={project} />)}
        </div>
      </div>
    </section>
  );
}
