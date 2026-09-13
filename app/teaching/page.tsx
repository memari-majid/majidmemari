import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("teaching", "/teaching");

export default function TeachingPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <JsonLd page="/teaching" />
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Teaching</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Entrepreneurship at Utah Valley University
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Applied AI and Gen AI teaching by Majid Memari, {MAJID.headlineRole} and Assistant
          Professor of Computer Science at Utah Valley University. NVIDIA University Ambassador and
          DLI Certified Instructor.
        </p>
        <article className="card mt-10 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Featured course · designed &amp; taught
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {MAJID.cs4720r.title}: {MAJID.cs4720r.tagline}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{MAJID.cs4720r.term}</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {MAJID.cs4720r.summary} {MAJID.cs4720r.catalog}
          </p>
        </article>
        <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Fall 2026 courses
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          {MAJID.fall2026Courses.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {MAJID.roles.nvidia}. Official listing:{" "}
          <a
            className="text-sky-600 underline dark:text-sky-400"
            href={MAJID.nvidiaInstructorDirectory}
            target="_blank"
            rel="me noopener noreferrer"
          >
            NVIDIA Certified Instructor Directory
          </a>
          . Workshops include Building Agentic AI Applications with LLMs. Campus student sessions
          are offered at no charge to students at participating universities.
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
          <Link className="text-sky-600 underline dark:text-sky-400" href="/contact">
            Invite a workshop
          </Link>
        </p>
      </main>
      <ChatWidget />
    </div>
  );
}
