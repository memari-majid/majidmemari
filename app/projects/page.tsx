import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ResearchArea } from "@/app/components/ResearchArea";
import { WORK_GROUPS } from "@/lib/work-groups";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Research" },
  description: "Explore Majid Memari’s research in Computer Vision, Education, Language Models, and Big Data, with related projects and publications together.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "Research", description: "Research interests, applications, and publications organized by focus.", url: "/projects" },
};

export default function ProjectsPage() {
  const items = WORK_GROUPS.flatMap((group) => [
    ...group.projects.map((project) => ({ name: project.name, url: `${SITE_URL}/projects/${project.slug}` })),
    ...group.publications.map((paper) => ({ name: paper.title, url: `${SITE_URL}/projects#${paper.id}` })),
  ]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Research",
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
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Research</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">My work spans AI and machine learning, high-performance computing, Big Data, and data analytics. Explore the related projects and publications in four research areas.</p>
        <nav aria-labelledby="research-areas" className="mt-8">
          <h2 id="research-areas" className="text-base font-medium text-slate-600">Browse by research area</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORK_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="flex h-full flex-col rounded-xl border border-slate-200 border-t-2 border-t-teal-800 bg-white p-4 transition hover:border-teal-700 hover:bg-teal-900/[0.03] sm:p-5">
              <span className="text-base font-semibold leading-snug text-slate-900">{group.title}</span>
              <span className="mt-3 text-sm leading-relaxed text-slate-600">{group.subtopics.join(" · ")}</span>
              <span className="mt-auto pt-4 text-xs text-teal-800">{group.projects.length > 0 ? `${group.projects.length} ${group.projects.length === 1 ? "project" : "projects"} · ` : ""}{group.publications.length} {group.publications.length === 1 ? "publication" : "publications"}<span aria-hidden="true"> →</span></span>
            </a>)}
          </div>
        </nav>
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
