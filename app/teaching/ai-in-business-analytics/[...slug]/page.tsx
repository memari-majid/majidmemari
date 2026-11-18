import Link from "next/link";
import { notFound } from "next/navigation";
import { analyticsBasePath, analyticsDocuments, getAnalyticsDocument } from "@/lib/business-analytics";
import { CopyReferenceLink } from "../CopyReferenceLink";
import { ReferenceBreadcrumb, ReferenceNavigation } from "../ReferenceNavigation";
import { guideGroups, referenceMetadata } from "../reference";
import { headingSlug, MarkdownArticle } from "./MarkdownArticle";

type ReaderProps = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return analyticsDocuments.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: ReaderProps) {
  const document = getAnalyticsDocument((await params).slug);
  if (!document) return {};

  const guide = guideGroups.flatMap((group) => group.guides).find((item) => item.href === document.href);
  const title = document.sourcePath === "README.md" ? "Reference overview and recent picks" : document.title;
  return referenceMetadata(title, guide?.description ?? "Part of the AI in Business Analytics field reference.", document.href);
}

export default async function AnalyticsReaderPage({ params }: ReaderProps) {
  const document = getAnalyticsDocument((await params).slug);
  if (!document) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-5 pb-18 pt-27 sm:px-8 sm:pb-20 sm:pt-31">
      <ReferenceBreadcrumb />
      <div className="grid items-start gap-9 lg:grid-cols-[13rem_minmax(0,1fr)] xl:gap-12">
        <ReferenceNavigation current={document.href} />
        <article className="min-w-0">
          <header className="mb-6 border-b border-slate-200 pb-5 sm:mb-8">
            <h1 id={headingSlug(document.title)} className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">{document.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <a href={document.githubUrl} className="font-medium text-teal-800 underline decoration-teal-800/35 underline-offset-4 hover:decoration-teal-800">View source on GitHub <span aria-hidden="true">↗</span></a>
              <CopyReferenceLink path={document.href} />
            </div>
          </header>

          <MarkdownArticle document={document} />

          <div className="mt-8 border-t border-slate-200 pt-5">
            <Link href={analyticsBasePath + "#guides"} className="text-sm font-semibold text-teal-800 underline decoration-teal-800/40 underline-offset-4 hover:decoration-teal-800">← Browse all guides</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
