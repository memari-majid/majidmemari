import type { Metadata } from "next";
import Link from "next/link";
import { BuildingAiSolutionsCard } from "@/app/components/BuildingAiSolutionsCard";
import { ChatWidget } from "@/app/components/ChatWidget";
import { NavBar } from "@/app/components/NavBar";

const description =
  "Explore Majid Memari’s AI teaching, including AI Solution Studio, the AI in Business Analytics field reference, and hands-on workshops.";

export const metadata: Metadata = {
  title: "Teaching",
  description,
  alternates: { canonical: "/teaching" },
  openGraph: { title: "Teaching | Majid Memari", description, url: "/teaching" },
};

const linkClass =
  "inline-flex min-h-11 items-center gap-2 font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 transition hover:decoration-teal-800";

export default function TeachingPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
        <header id="teaching" className="grid items-end gap-x-12 gap-y-6 border-b border-slate-200 pb-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Teaching</h1>
            <p className="mt-4 max-w-md leading-relaxed text-slate-600">
              Courses, learning resources and workshops for applying AI.
            </p>
          </div>
          <section aria-labelledby="business-analytics-heading" className="border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <h2 id="business-analytics-heading" className="text-2xl font-semibold leading-tight tracking-tight">
              <Link href="/teaching/ai-in-business-analytics" className={linkClass}>
                AI in Business Analytics <span aria-hidden="true" className="text-lg">→</span>
              </Link>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">
              Research, datasets and studio cases for AI scientists and business-school instructors.
            </p>
          </section>
        </header>

        <section aria-labelledby="courses-heading" className="mt-8">
          <h2 id="courses-heading" className="sr-only">Courses</h2>
          <BuildingAiSolutionsCard headingLevel={3} />
        </section>

        <section id="workshops" aria-labelledby="workshops-heading" className="mt-10 border-t border-slate-200 pt-7">
          <h2 id="workshops-heading" className="text-2xl font-semibold tracking-tight">AI workshops</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            Hands-on NVIDIA Deep Learning Institute instruction in Building Agentic AI Applications with LLMs, plus focused AI sessions shaped around your team’s practical problems and learning goals.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Link href="/teaching/agentic-llm" className={linkClass}>Workshop learning page <span aria-hidden="true">→</span></Link>
            <Link href="/teaching?inquiry=workshop" className={linkClass}>Discuss a workshop <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}
