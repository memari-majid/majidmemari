import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ProjectCard } from "@/app/components/ProjectShowcase";
import { PublicationsExplorer, type PublicationView } from "@/app/components/PublicationsExplorer";
import { getProject, PROJECTS, PROJECT_GROUPS } from "@/lib/projects";
import { PUBLICATIONS, RESEARCH_FOCUSES, publicationKindLabel } from "@/lib/publications";
import { SITE, SITE_URL } from "@/lib/site";

type Props = { searchParams: Promise<{ view?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const publicationsView = (await searchParams).view === "publications";
  const canonical = publicationsView ? "/projects?view=publications" : "/projects";
  return {
    title: publicationsView ? "Publications · Projects & Research" : "Projects & Research",
    description: "Applications, learning experiences, research projects, and publications by Majid Memari. Explore the work and its research connections.",
    alternates: { canonical },
    openGraph: { title: "Projects & Research — Majid Memari", description: "Projects, publications, and the connections between them.", url: canonical },
  };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const publicationsView = (await searchParams).view === "publications";
  const viewUrl = publicationsView ? "/projects?view=publications" : "/projects";
  const publications: PublicationView[] = publicationsView ? PUBLICATIONS.map((paper) => ({
    ...paper,
    kindLabel: publicationKindLabel(paper),
    focusLabels: paper.topics.map((topic) => RESEARCH_FOCUSES.find((focus) => focus.id === topic)!.label),
    projectLinks: (paper.projectLinks ?? []).map((connection) => {
      const project = getProject(connection.slug);
      if (!project) throw new Error(`Unknown research project: ${connection.slug}`);
      return { ...connection, name: project.name };
    }),
  })) : [];
  const items = publicationsView
    ? PUBLICATIONS.map((paper) => ({ name: paper.title, url: `${SITE_URL}/projects?view=publications#${paper.id}` }))
    : PROJECTS.map((project) => ({ name: project.name, url: `${SITE_URL}/projects/${project.slug}` }));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Projects & research by Majid Memari",
    url: `${SITE_URL}${viewUrl}`,
    author: { "@type": "Person", name: "Majid Memari", url: SITE_URL },
    mainEntity: { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })) },
  };
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Selected work</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Projects &amp; research</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">Explore applications, courses, research projects, and the publications behind them.</p>
        <nav aria-label="Browse projects and publications" className="mt-7 flex flex-wrap gap-7 border-b border-slate-200">
          <Link href="/projects" aria-current={!publicationsView ? "page" : undefined} className={`inline-flex min-h-12 items-center gap-2 border-b-2 py-3 text-sm font-semibold ${!publicationsView ? "border-teal-800 text-teal-800" : "border-transparent text-slate-600 hover:text-teal-800"}`}>Projects <span className="text-xs font-normal">{PROJECTS.length}</span></Link>
          <Link href="/projects?view=publications" aria-current={publicationsView ? "page" : undefined} className={`inline-flex min-h-12 items-center gap-2 border-b-2 py-3 text-sm font-semibold ${publicationsView ? "border-teal-800 text-teal-800" : "border-transparent text-slate-600 hover:text-teal-800"}`}>Publications <span className="text-xs font-normal">{PUBLICATIONS.length}</span></Link>
        </nav>
        {publicationsView ? (
          <>
            <p className="mt-6 max-w-3xl leading-relaxed text-slate-600">My research spans AI and language models, education, computer vision, engineering, and data governance. Explore the summaries by focus, or follow a paper to its related project.</p>
            <PublicationsExplorer publications={publications} focuses={RESEARCH_FOCUSES} />
            <p className="mt-8 text-sm leading-relaxed text-slate-600">Additional records and current citation information are on <a href={SITE.scholar} target="_blank" rel="me noopener noreferrer" referrerPolicy="no-referrer" className="text-teal-800 underline underline-offset-4">Google Scholar ↗<span className="sr-only"> (opens in a new tab)</span></a>.</p>
          </>
        ) : (
          <>
            <nav aria-label="Project categories" className="mt-6 flex flex-wrap gap-3">
              {PROJECT_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-teal-800 hover:border-teal-700">{group.title}</a>)}
            </nav>
            {PROJECT_GROUPS.map((group) => (
              <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-28 pt-10">
                <h2 id={`${group.id}-heading`} className="text-3xl font-semibold tracking-tight">{group.title}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{group.description}</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PROJECTS.filter((project) => project.group === group.id).map((project) => <ProjectCard key={project.slug} project={project} index={PROJECTS.indexOf(project)} />)}</div>
              </section>
            ))}
          </>
        )}
        <div className="mt-12 border-t border-slate-200 pt-6">
          <Link href="/?chat=open" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline underline-offset-4">Discuss a project or research question →</Link>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
