import Link from "next/link";
import { analyticsBasePath } from "@/lib/business-analytics";
import { CopyReferenceLink } from "./CopyReferenceLink";
import { GuideDirectory } from "./GuideDirectory";
import { ReferenceBreadcrumb } from "./ReferenceNavigation";
import { decisionMap, guideGroups, overviewDocument, referenceDescription, referenceMetadata, referenceTitle } from "./reference";

export const metadata = referenceMetadata(referenceTitle, referenceDescription, analyticsBasePath);

export default function AnalyticsReferencePage() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <ReferenceBreadcrumb atOverview />
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{referenceTitle}</h1>
          <p className="mt-4 max-w-md leading-relaxed text-slate-600">{referenceDescription}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="#guides" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline decoration-teal-800/35 underline-offset-4 hover:decoration-teal-800">
              Browse guides <span aria-hidden="true">↓</span>
            </Link>
            <CopyReferenceLink path={analyticsBasePath} />
          </div>
        </div>

        <section aria-labelledby="decision-map-heading" className="border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <h2 id="decision-map-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Start with a business question</h2>
          <ul className="mt-3 divide-y divide-slate-200">
            {decisionMap.map(({ label, question, method, href }) => (
              <li key={label}>
                <Link href={href} className="group grid min-h-14 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-x-4">
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
