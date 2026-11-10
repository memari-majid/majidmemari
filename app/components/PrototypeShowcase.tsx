import Link from "next/link";
import { FEATURED_PROTOTYPE_SLUGS, PROTOTYPES, type Prototype } from "@/lib/prototypes";

export function PrototypeCard({ prototype, index }: { prototype: Prototype; index: number }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-700/40 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">{prototype.category}</p>
        <span aria-hidden="true" className="font-serif text-xl text-slate-400">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">
        <Link href={`/prototypes/${prototype.slug}`} className="underline-offset-4 hover:text-teal-800 hover:underline">{prototype.name}</Link>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{prototype.summary}</p>
      <div className="mt-auto pt-6">
        <p className="inline-flex rounded-full border border-slate-200 bg-[#f7f6f2] px-3 py-1 text-xs font-medium text-slate-600">{prototype.access}</p>
        <Link href={`/prototypes/${prototype.slug}`} className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">
          Explore the prototype <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function PrototypeShowcase() {
  const featured = PROTOTYPES.filter((prototype) => FEATURED_PROTOTYPE_SLUGS.includes(prototype.slug));
  return (
    <section id="prototypes" aria-labelledby="prototypes-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Built by Majid Memari</p>
          <h2 id="prototypes-heading" className="mt-3 text-3xl font-semibold tracking-tight">AI solution prototypes.</h2>
        </div>
        <Link href="/prototypes" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">Explore all {PROTOTYPES.length} projects <span aria-hidden="true" className="ml-2">→</span></Link>
      </div>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">Applications I created to explore useful AI workflows across education, business, finance, and information support. See the problem, the experience, and the limits of each prototype.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{featured.map((prototype, index) => <PrototypeCard key={prototype.slug} prototype={prototype} index={index} />)}</div>
    </section>
  );
}
