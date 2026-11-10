import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { ChatWidget } from "@/app/components/ChatWidget";
import { PrototypeCard } from "@/app/components/PrototypeShowcase";
import { PROTOTYPES } from "@/lib/prototypes";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Solution Prototypes",
  description: "Explore AI solution prototypes created by Majid Memari across education, business, finance, data governance, and information support.",
  alternates: { canonical: "/prototypes" },
  openGraph: { title: "AI Solution Prototypes — Majid Memari", description: "Practical AI ideas, working experiences, and clear explanations of their scope and access.", url: "/prototypes" },
};

export default function PrototypesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Solution Prototypes by Majid Memari",
    url: `${SITE_URL}/prototypes`,
    author: { "@type": "Person", name: "Majid Memari", url: SITE_URL },
    mainEntity: { "@type": "ItemList", itemListElement: PROTOTYPES.map((prototype, index) => ({ "@type": "ListItem", position: index + 1, name: prototype.name, url: `${SITE_URL}/prototypes/${prototype.slug}` })) },
  };
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">Built by Majid Memari</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">AI solution prototypes.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">I build applications to explore how AI can help people learn, understand information, and make useful decisions. This collection brings together {PROTOTYPES.length} projects across different domains.</p>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-y border-slate-200 py-5 text-sm text-slate-600">
          <p><strong className="font-semibold text-slate-900">Explore the idea.</strong> Understand the problem and approach.</p>
          <p><strong className="font-semibold text-slate-900">Try the experience.</strong> Check each project&apos;s access details.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{PROTOTYPES.map((prototype, index) => <PrototypeCard key={prototype.slug} prototype={prototype} index={index} />)}</div>
        <section aria-labelledby="discuss-prototype" className="mt-12 rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-7 sm:p-9">
          <h2 id="discuss-prototype" className="text-2xl font-semibold">Have a problem worth exploring?</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">Each prototype starts with a question about a user&apos;s needs. Discuss an idea, ask for a walkthrough, or explore the decisions behind the work.</p>
          <Link href="/#contact" className="mt-5 inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Start a conversation <span aria-hidden="true" className="ml-2">→</span></Link>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}
