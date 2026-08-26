import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";

export const metadata: Metadata = {
  title: "Teaching at Utah Valley University",
  description:
    "Courses taught by Dr. Majid Memari at Utah Valley University in Fall 2026: CS-1400 Fundamentals of Programming, CS-2700 Causal Inference, CS 6470 Machine Learning, and CS 4720R AI Business and Tech Solutions. NVIDIA DLI workshops.",
  alternates: { canonical: "/teaching" },
  openGraph: {
    title: "Majid Memari — Teaching at Utah Valley University",
    description:
      "Fall 2026 UVU courses and NVIDIA Deep Learning Institute workshops taught by Dr. Majid Memari.",
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
          Majid Memari — Teaching at UVU
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Assistant Professor of Computer Science at Utah Valley University. NVIDIA University
          Ambassador and DLI Certified Instructor.
        </p>
        <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Fall 2026 courses
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          {MAJID.fall2026Courses.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {MAJID.roles.nvidia}. Workshops include Building Agentic AI Applications with LLMs. Campus
          student sessions are offered at no charge to students at participating universities.
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
