import Link from "next/link";
import { analyticsBasePath } from "@/lib/business-analytics";
import { guideGroups, referenceTitle } from "./reference";

export function ReferenceBreadcrumb({ atOverview = false }: { atOverview?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm leading-relaxed text-slate-600 sm:mb-10">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li><Link href="/teaching" className="text-teal-800 underline decoration-teal-800/40 underline-offset-4 hover:decoration-teal-800">Teaching</Link></li>
        <li aria-hidden="true">/</li>
        <li>
          {atOverview ? (
            <span aria-current="page">{referenceTitle}</span>
          ) : (
            <Link href={analyticsBasePath} className="text-teal-800 underline decoration-teal-800/40 underline-offset-4 hover:decoration-teal-800">{referenceTitle}</Link>
          )}
        </li>
      </ol>
    </nav>
  );
}

export function ReferenceNavigation({ current }: { current: string }) {
  return (
    <nav aria-label="Reference guides" className="sticky top-27 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto border-r border-slate-200 pr-5 lg:block">
      <Link href={analyticsBasePath} className="mb-5 inline-block text-sm font-semibold text-teal-800 underline decoration-teal-800/40 underline-offset-4 hover:decoration-teal-800">Reference home</Link>
      {guideGroups.map((group) => (
        <details key={group.title} open={group.guides.some(({ href }) => href === current) ? true : undefined} className="group border-t border-slate-200">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-sm font-semibold text-slate-900 hover:text-teal-800 [&::-webkit-details-marker]:hidden">
            {group.title}
            <span aria-hidden="true" className="text-teal-800 group-open:rotate-45">+</span>
          </summary>
          <ul className="pb-2">
            {group.guides.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  aria-current={guide.href === current ? "page" : undefined}
                  className="block px-2 py-1.5 text-sm leading-snug text-slate-600 hover:text-teal-800 hover:underline hover:underline-offset-4 aria-[current=page]:font-semibold aria-[current=page]:text-teal-800"
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
