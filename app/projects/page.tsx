import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ResearchArea } from "@/app/components/ResearchArea";
import { PROJECTS } from "@/lib/projects";
import { PUBLICATIONS } from "@/lib/publications";
import { WORK_GROUPS } from "@/lib/work-groups";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Research Interests & Projects",
  description: "Explore Majid Memari’s research interests in computer vision, AI and education, language models and agents, finance and analytics, and computational biology, with related projects and publications together.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "Research interests — Majid Memari", description: "Research interests, applications, and publications organized by focus.", url: "/projects" },
};

export default function ProjectsPage() {
  const items = WORK_GROUPS.flatMap((group) => [
    ...group.projects.map((project) => ({ name: project.name, url: `${SITE_URL}/projects/${project.slug}` })),
    ...group.publications.map((paper) => ({ name: paper.title, url: `${SITE_URL}/projects#${paper.id}` })),
  ]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Research interests, projects, and publications by Majid Memari",
    url: `${SITE_URL}/projects`,
    about: WORK_GROUPS.map((group) => ({ "@type": "Thing", name: group.title })),
    author: { "@type": "Person", name: "Majid Memari", url: SITE_URL },
    mainEntity: { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })) },
  };
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Research &amp; applied work</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Research interests</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">My work explores computational methods in learning, engineering, specialist information, finance, and biology. Explore each focus through its projects and publications.</p>
        <nav aria-label="Research interests" className="mt-7 flex flex-wrap gap-x-6 gap-y-1 border-y border-slate-200 py-3">
          {WORK_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/25 underline-offset-4 hover:decoration-teal-800">{group.title}</a>)}
        </nav>
        <p className="mt-4 text-sm text-slate-500">{WORK_GROUPS.length} research areas · {PROJECTS.length} projects · {PUBLICATIONS.length} publications &amp; graduate works</p>
        {WORK_GROUPS.map((group) => <ResearchArea key={group.id} group={group} />)}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          <Link href="/?chat=open" className="inline-flex min-h-11 items-center font-medium text-teal-800 underline underline-offset-4">Discuss a research interest →</Link>
          <a href={SITE.scholar} target="_blank" rel="me noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center text-teal-800 underline underline-offset-4">All records on Google Scholar ↗<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
