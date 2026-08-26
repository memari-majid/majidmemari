import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Selected publications by Dr. Majid Memari, including 2026 IETC and SITE papers and the Capability Ladder preprint. Full list on Google Scholar.",
  alternates: { canonical: "/publications" },
  openGraph: {
    title: "Majid Memari — Publications",
    description:
      "Selected papers and preprints. Complete record on Google Scholar.",
    url: "/publications",
  },
};

const KIND_LABEL = {
  journal: "Journal",
  conference: "Conference",
  preprint: "Preprint",
} as const;

export default function PublicationsPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <JsonLd page="/publications" />
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Scholarship</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Majid Memari — Publications
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {MAJID.scholarListedWorks}+ works on{" "}
          <a
            className="text-sky-600 underline dark:text-sky-400"
            href={MAJID.scholar}
            rel="me noopener noreferrer"
            target="_blank"
          >
            Google Scholar
          </a>
          . Selected recent items below; citation counts stay on Scholar so they do not go stale here.
        </p>

        <ol className="mt-10 space-y-8">
          {MAJID.publications.map((p) => (
            <li key={p.title} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {p.year} · {KIND_LABEL[p.kind]}
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {p.title}
                </a>
              </p>
              <p className="mt-1">{p.authors}</p>
              <p className="mt-0.5 italic">{p.venue}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-sm">
          <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.scholar} target="_blank" rel="me">
            All publications on Google Scholar
          </a>
          {" · "}
          <Link className="text-sky-600 underline dark:text-sky-400" href="/about">
            About
          </Link>
        </p>
      </main>
      <ChatWidget />
    </div>
  );
}
