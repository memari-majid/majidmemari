import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";

const description =
  "Explore Majid Memari’s AI teaching, including AI Solution Studio, the AI in Business Analytics field reference, and hands-on workshops.";

export const metadata: Metadata = {
  title: "Teaching",
  description,
  alternates: { canonical: "/teaching" },
  openGraph: { title: "Teaching | Majid Memari", description, url: "/teaching" },
};

const teachingLinks = [
  {
    id: "studio",
    title: "AI Solution Studio",
    summary: "A self-paced course on building and testing an AI solution.",
    href: "/teaching/ai-solutions/index.html",
  },
  {
    id: "business-analytics",
    title: "AI in Business Analytics",
    summary: "A field reference for AI scientists and business-school instructors.",
    href: "/teaching/ai-in-business-analytics",
  },
  {
    id: "workshops",
    title: "AI Workshops",
    summary: "NVIDIA Deep Learning Institute training and team workshops.",
    href: "/teaching/agentic-llm",
  },
];

export default function TeachingPage() {
  return (
    <div className="min-h-screen text-slate-900">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <h1 id="teaching" className="text-4xl font-semibold tracking-tight sm:text-5xl">Teaching</h1>
        <nav aria-label="Teaching resources" className="mt-9">
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {teachingLinks.map(({ id, title, summary, href }) => (
              <li key={id} id={id}>
                <Link href={href} aria-labelledby={`${id}-title`} aria-describedby={`${id}-summary`} className="group flex items-center justify-between gap-5 py-5 sm:py-6">
                  <span>
                    <span id={`${id}-title`} className="block font-serif text-xl font-semibold tracking-tight group-hover:text-teal-800 group-hover:underline group-hover:underline-offset-4 sm:text-2xl">{title}</span>
                    <span id={`${id}-summary`} className="mt-1.5 block text-sm leading-relaxed text-slate-600">{summary}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-lg text-teal-800">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
