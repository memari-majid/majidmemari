import Link from "next/link";
import { analyticsBasePath } from "@/lib/business-analytics";
import { CopyReferenceLink } from "./CopyReferenceLink";
import { GuideDirectory } from "./GuideDirectory";
import { ReferenceBreadcrumb } from "./ReferenceNavigation";
import { decisionMap, guideGroups, overviewDocument, referenceDescription, referenceMetadata, referenceTitle } from "./reference";

export const metadata = referenceMetadata(referenceTitle, referenceDescription, analyticsBasePath);

export default function AnalyticsReferencePage() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-5 pb-18 pt-27 sm:px-8 sm:pb-20 sm:pt-31">
      <ReferenceBreadcrumb atOverview />
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 lg:gap-18">
        <div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{referenceTitle}</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-700 sm:text-xl">{referenceDescription}</p>
          <p className="mt-3 max-w-md leading-relaxed text-slate-600">
            Find recent research, datasets, and teaching materials for decisions that depend on data and AI.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="#guides" className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-950">
              Browse guides <span aria-hidden="true">↓</span>
            </Link>
            <CopyReferenceLink path={analyticsBasePath} />
          </div>
        </div>

        <section aria-labelledby="decision-map-heading" className="rounded-2xl border border-slate-200 bg-slate-100/60 px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
          <h2 id="decision-map-heading" className="px-2 text-xl font-semibold tracking-tight sm:text-2xl">Start with a business question</h2>
          <ul className="mt-3 divide-y divide-slate-200">
            {decisionMap.map(({ label, question, method, href }) => (
              <li key={label}>
                <Link href={href} className="group grid min-h-15 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-2 py-2 transition hover:bg-white/80 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-x-4">
                  <span className="text-sm font-semibold text-teal-800">{label}</span>
                  <span>
                    <span className="block text-sm leading-snug text-slate-900 group-hover:underline group-hover:underline-offset-4">{question}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-600">{method}</span>
                  </span>
                  <span aria-hidden="true" className="text-teal-800">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <GuideDirectory groups={guideGroups} />

      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {overviewDocument && (
          <Link href={overviewDocument.href} className="font-medium text-teal-800 underline decoration-teal-800/35 underline-offset-4 hover:decoration-teal-800">Collection notes and recent picks</Link>
        )}
      </div>
    </main>
  );
}
