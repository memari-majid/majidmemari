import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ProjectCard } from "@/app/components/ProjectShowcase";
import { PROJECTS, PROJECT_GROUPS } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects",
  description: "Public applications, learning experiences, and research case studies by Majid Memari. No account required for the linked demonstrations.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "Projects — Majid Memari", description: "Practical AI ideas, working experiences, and clear explanations of their scope and access.", url: "/projects" },
};

export default function ProjectsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Projects by Majid Memari",
    url: `${SITE_URL}/projects`,
    author: { "@type": "Person", name: "Majid Memari", url: SITE_URL },
    mainEntity: { "@type": "ItemList", itemListElement: PROJECTS.map((project, index) => ({ "@type": "ListItem", position: index + 1, name: project.name, url: `${SITE_URL}/projects/${project.slug}` })) },
  };
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">Built by Majid Memari</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Applications, courses &amp; research.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">I create applications, learning experiences, and research projects. These {PROJECTS.length} projects are grouped by what they do, with details about their purpose, audience, and access.</p>
        <section aria-labelledby="start-demo" className="mt-8 rounded-2xl border border-teal-900/15 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">New here?</p>
          <h2 id="start-demo" className="mt-3 text-2xl font-semibold">See how a project works.</h2>
          <ol className="mt-5 grid gap-5 text-sm leading-relaxed text-slate-600 sm:grid-cols-3">
            <li><strong className="block text-slate-900">1. Start with a sample</strong>Open a demo and follow its recommended example.</li>
            <li><strong className="block text-slate-900">2. Try the action</strong>Generate an explanation, compare a scenario, or make a sample choice.</li>
            <li><strong className="block text-slate-900">3. Read the result</strong>Use the takeaway, feedback, or before-and-after figures to understand what changed.</li>
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"><a href="https://datagovai-web.vercel.app" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-12 items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900">Start with DataGovAI ↗<span className="sr-only"> (opens in a new tab)</span></a><p className="text-xs text-slate-600">No sign-in. Public or fictional samples only.</p></div>
        </section>
        <nav aria-label="Project categories" className="mt-8 flex flex-wrap gap-3">
          {PROJECT_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-teal-800 hover:border-teal-700">{group.title}</a>)}
        </nav>
        {PROJECT_GROUPS.map((group) => (
          <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-28 pt-12">
            <h2 id={`${group.id}-heading`} className="text-3xl font-semibold tracking-tight">{group.title}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{group.description}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PROJECTS.filter((project) => project.group === group.id).map((project) => <ProjectCard key={project.slug} project={project} index={PROJECTS.indexOf(project)} />)}</div>
          </section>
        ))}
        <section aria-labelledby="discuss-project" className="mt-12 rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-7 sm:p-9">
          <h2 id="discuss-project" className="text-2xl font-semibold">Have a problem worth exploring?</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">Discuss an application, course, or research idea, ask for a walkthrough, or explore the decisions behind the work.</p>
          <Link href="/?chat=open" className="mt-5 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Start a conversation <span aria-hidden="true" className="ml-2">→</span></Link>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}
