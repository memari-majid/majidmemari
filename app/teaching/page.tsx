import type { Metadata } from "next";
import Link from "next/link";
import { BuildingAiSolutionsCard } from "@/app/components/BuildingAiSolutionsCard";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";

export const metadata: Metadata = {
  title: "Teaching — AI Courses & Workshops",
  description:
    "Explore Building AI Solutions, Majid Memari’s independent course for business learners, alongside university courses and NVIDIA DLI workshops. Build, evaluate, and launch AI solutions without coding.",
  alternates: { canonical: "/teaching" },
  openGraph: {
    title: "Majid Memari — AI Courses & Workshops",
    description:
      "Independent AI learning, university courses, and NVIDIA DLI workshops. Explore Building AI Solutions, a business capstone course by Majid Memari with no coding required.",
    url: "/teaching",
  },
};

export default function TeachingPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <JsonLd page="/teaching" />
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Teaching</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI courses &amp; workshops
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Independent learning experiences, university teaching, and practical workshops by
          Majid Memari.
        </p>
        <div className="mt-8">
          <BuildingAiSolutionsCard />
        </div>
        <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          University teaching · Fall 2026
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Assistant Professor of Computer Science at Utah Valley University.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          {MAJID.fall2026Courses.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          NVIDIA DLI workshops
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {MAJID.roles.nvidia}. Workshops include Building Agentic AI Applications with LLMs. Campus
          student sessions are offered at no charge to students at participating universities.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Link className="text-sky-600 underline dark:text-sky-400" href="/teaching/agentic-llm">
            Workshop teaching assistant
          </Link>
          {" — "}
          the in-workshop assistant for Building Agentic AI Applications with LLMs.
        </p>
        <p className="mt-6 text-sm">
          <Link className="text-sky-600 underline dark:text-sky-400" href="/publications">
            Publications
          </Link>
          {" · "}
          <Link className="text-sky-600 underline dark:text-sky-400" href="/about">
            About Majid Memari
          </Link>
          {" · "}
          <Link className="text-sky-600 underline dark:text-sky-400" href="/#contact">
            Invite a workshop
          </Link>
        </p>
      </main>
      <ChatWidget />
    </div>
  );
}
