import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { getPrototype, PROTOTYPES } from "@/lib/prototypes";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROTOTYPES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prototype = getPrototype((await params).slug);
  if (!prototype) return { title: "Prototype not found" };
  return { title: `${prototype.name} — AI Solution Prototype`, description: prototype.summary, alternates: { canonical: `/prototypes/${prototype.slug}` }, openGraph: { title: `${prototype.name} — Majid Memari`, description: prototype.summary, url: `/prototypes/${prototype.slug}` } };
}

export default async function PrototypePage({ params }: Props) {
  const prototype = getPrototype((await params).slug);
  if (!prototype) notFound();
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <Link href="/prototypes" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline underline-offset-4">← All AI solution prototypes</Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">{prototype.category} · {prototype.historical ? "Historical prototype" : "A prototype by Majid Memari"}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">{prototype.name}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{prototype.summary}</p>

        <div className="mt-10 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">The problem &amp; approach</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{prototype.purpose}</p>
            <h2 className="mt-9 text-2xl font-semibold">Inside the experience</h2>
            <ul className="mt-4 divide-y divide-slate-200">{prototype.capabilities.map((capability, index) => <li key={capability} className="flex gap-4 py-4"><span aria-hidden="true" className="pt-0.5 text-xs font-semibold text-teal-800">0{index + 1}</span><span className="text-sm leading-relaxed text-slate-600">{capability}</span></li>)}</ul>
          </div>
          <aside aria-label="Prototype access and scope" className="space-y-5">
            <section className="rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">Explore</p>
              <h2 className="mt-3 text-xl font-semibold">{prototype.access}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{prototype.accessNote}</p>
              <a href={prototype.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-900">{prototype.launchLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">Opens the project&apos;s own website.</p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Scope &amp; limits</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{prototype.limit}</p>
            </section>
          </aside>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
          <Link href="/prototypes" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Explore the full collection</Link>
          <Link href="/#contact" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Discuss this prototype</Link>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
