import type { Metadata } from "next";
import Link from "next/link";
import { BuildingAiSolutionsCard } from "@/app/components/BuildingAiSolutionsCard";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { ProjectCard } from "@/app/components/ProjectShowcase";
import { FEATURED_PROJECT_SLUGS, PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "AI Courses & Workshops",
  description:
    "AI courses and workshops by Majid Memari. Explore Building AI Solutions: interactive business lessons, simulations, and a practical capstone with no coding required.",
  alternates: { canonical: "/teaching" },
  openGraph: {
    title: "Majid Memari — AI Courses & Workshops",
    description:
      "Learn AI through real problems, interactive lessons, and practical workshops. Explore Building AI Solutions, an independent business course by Majid Memari.",
    url: "/teaching",
  },
};

export default function TeachingPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <JsonLd page="/teaching" />
      <NavBar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">Teaching by Majid Memari</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">AI courses &amp; workshops</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
          Learn the concepts, explore the possibilities, and apply AI to a useful problem.
          Start with a complete course or a focused workshop.
        </p>
        <div className="mt-10">
          <BuildingAiSolutionsCard />
        </div>

        <section aria-labelledby="workshops-heading" className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Workshops</p>
          <h2 id="workshops-heading" className="mt-3 text-2xl font-semibold tracking-tight">Focused learning, practical application.</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">NVIDIA Deep Learning Institute</p>
              <h3 className="mt-3 text-xl font-semibold">Building Agentic AI Applications with LLMs</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                A hands-on technical workshop taught by Majid Memari, a DLI Certified Instructor.
                The workshop assistant supports learners working through the labs.
              </p>
              <a className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline underline-offset-4" href="https://nvidia-teaching-assistant.vercel.app" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                Try the public workshop demo <span aria-hidden="true">↗</span>
              </a>
              <p className="mt-2 text-xs text-slate-600">Sample questions. No account or Slack sign-in required.</p>
              <Link className="mt-3 inline-block text-sm text-teal-800 underline underline-offset-4" href="/teaching/agentic-llm">Workshop learning page</Link>
            </article>
            <article className="rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Business &amp; team learning</p>
              <h3 className="mt-3 text-xl font-semibold">AI for your context</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Discuss a workshop around your audience, business problems, and learning goals.
                Topics can include AI opportunities, no-code prototyping, evaluation, and adoption.
              </p>
              <Link className="mt-5 inline-block text-sm font-semibold text-teal-800 underline underline-offset-4" href="/#contact">
                Discuss a workshop
              </Link>
            </article>
          </div>
        </section>
        <section id="public-demos" aria-labelledby="public-demos-heading" className="mt-16 scroll-mt-28">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Public demos</p>
          <h2 id="public-demos-heading" className="mt-3 text-3xl font-semibold tracking-tight">See the projects in action.</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">Try interactive examples from my applications and learning tools. No account is required, and the demos use public or fictional sample data.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PROJECTS.filter((project) => project.publicDemo && FEATURED_PROJECT_SLUGS.includes(project.slug)).map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</div>
          <Link href="/projects" className="mt-5 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Explore all projects and demos →</Link>
        </section>
        <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Have a project in mind? <Link href="/#mentorship" className="font-medium text-teal-800 underline underline-offset-4">Explore mentorship</Link> or <Link href="/#contact" className="font-medium text-teal-800 underline underline-offset-4">contact Majid</Link>.
        </p>
      </main>
      <ChatWidget />
    </div>
  );
}
