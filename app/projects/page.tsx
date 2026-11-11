import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ResearchDirectory, type DirectoryGroup } from "@/app/components/ResearchDirectory";
import { publicationKindLabel, RESEARCH_FOCUSES } from "@/lib/publications";
import { WORK_GROUPS } from "@/lib/work-groups";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Research" },
  description: "Explore Majid Memari’s research in Computer Vision, Education, Language Models, and Big Data, with related projects and publications together.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "Research", description: "Research interests, applications, and publications organized by focus.", url: "/projects" },
};

function searchText(parts: unknown[]) {
  const text = parts.join(" ");
  const aliases = [
    /machine[- ]learning/i.test(text) ? "ML" : "",
    /high[- ]performance computing/i.test(text) ? "HPC" : "",
    /natural[- ]language processing/i.test(text) ? "NLP" : "",
    /language[- ]models?|\bllms?\b/i.test(text) ? "LLM LLMs" : "",
    /retrieval[- ]augmented|\brag\b/i.test(text) ? "RAG" : "",
    /computer[- ]vision/i.test(text) ? "CV" : "",
  ];
  return [text, ...aliases].join(" ");
}

export default function ProjectsPage() {
  const groups: DirectoryGroup[] = WORK_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    searchText: searchText([group.title, group.description, ...group.subtopics]),
    projects: group.projects.map((project) => ({
      slug: project.slug, name: project.name, summary: project.summary,
      unpublished: project.unpublished, historical: project.historical,
      searchText: searchText([project.name, project.summary, project.kind, project.category, project.purpose, project.context, ...project.capabilities, ...(project.computationMethods ?? [])]),
    })),
    publications: group.publications.map((paper) => ({ ...paper, kindLabel: publicationKindLabel(paper), searchText: searchText([paper.title, paper.summary, paper.authors, paper.venue, paper.year, ...paper.topics.map((topic) => RESEARCH_FOCUSES.find((focus) => focus.id === topic)?.label), ...(paper.computationMethods ?? [])]) })),
  }));
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
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Research</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">AI, machine learning, high-performance computing, and data analytics, organized by research focus.</p>
        <ResearchDirectory groups={groups} />
        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          <Link href="/?chat=open" className="inline-flex min-h-11 items-center font-medium text-teal-800 underline underline-offset-4">Discuss a research interest →</Link>
          <a href={SITE.scholar} target="_blank" rel="me noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center text-teal-800 underline underline-offset-4">All records on Google Scholar ↗<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
