import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { PublicationsExplorer, type PublicationView } from "@/app/components/PublicationsExplorer";
import { MAJID } from "@/lib/majid";
import { getProject } from "@/lib/projects";
import { PUBLICATIONS, RESEARCH_FOCUSES, publicationKindLabel } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Research & Publications",
  description: "Research by Majid Memari in AI, language models, education, computer vision, engineering, and data governance. Explore paper summaries and related projects.",
  alternates: { canonical: "/publications" },
  openGraph: { title: "Research & Publications — Majid Memari", description: "Publications and graduate research, organized by focus and connected to the projects behind the work.", url: "/publications" },
};

export default function PublicationsPage() {
  const publications: PublicationView[] = PUBLICATIONS.map((paper) => ({
    ...paper,
    kindLabel: publicationKindLabel(paper),
    focusLabels: paper.topics.map((topic) => RESEARCH_FOCUSES.find((focus) => focus.id === topic)!.label),
    projectLinks: (paper.projectLinks ?? []).map((connection) => {
      const project = getProject(connection.slug);
      if (!project) throw new Error(`Unknown research project: ${connection.slug}`);
      return { ...connection, name: project.name };
    }),
  }));
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <JsonLd page="/publications" />
      <NavBar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Research</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Research &amp; publications</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">My research connects AI methods with practical questions in education, specialist information work, and engineering. I work on language models and agents, generative-model evaluation, computer vision, and the evidence needed to assess these systems.</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a className="inline-flex min-h-11 items-center font-medium text-teal-800 underline underline-offset-4" href={MAJID.scholar} target="_blank" rel="me noopener noreferrer" referrerPolicy="no-referrer">Google Scholar ↗<span className="sr-only"> (opens in a new tab)</span></a>
          <Link className="inline-flex min-h-11 items-center font-medium text-teal-800 underline underline-offset-4" href="/projects">Explore the projects →</Link>
        </div>
        <PublicationsExplorer publications={publications} focuses={RESEARCH_FOCUSES} />
        <p className="mt-8 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-600">For additional records and current citation information, visit <a className="text-teal-800 underline underline-offset-4" href={MAJID.scholar} target="_blank" rel="me noopener noreferrer" referrerPolicy="no-referrer">Google Scholar ↗</a>.</p>
      </main>
      <ChatWidget />
    </div>
  );
}
