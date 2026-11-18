import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Majid Memari",
  description:
    "Meet Majid Memari, AI educator and mentor. Courses, workshops, and applied learning that connect AI concepts with useful business solutions.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Majid Memari — AI Educator & Mentor",
    description:
      "AI teaching, practical workshops, and mentorship informed by a background in computer science, business, and applied research.",
    url: "/about",
    type: "profile",
  },
};

const linkClass = "font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800";

export default function AboutPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-slate-900">
      <JsonLd page="/about" />
      <NavBar />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:items-center sm:gap-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Majid Memari</h1>
            <p className="mt-3 max-w-xl leading-relaxed text-slate-600 sm:text-lg">{MAJID.shortBio}</p>
          </div>
          <Image src="/majid-memari.png" alt="Majid Memari" width={160} height={160} className="h-20 w-20 rounded-xl border border-slate-200 object-cover object-top sm:h-32 sm:w-32" />
        </header>

        <section id="mentorship" aria-labelledby="mentorship-heading" className="mt-8 scroll-mt-28 border-t border-slate-200 py-6">
          <h2 id="mentorship-heading" className="text-xl font-semibold">Mentorship &amp; collaboration</h2>
          <p className="mt-2 leading-relaxed text-slate-600">I help learners and teams develop AI ideas, capstones, and applied projects.</p>
          <div className="mt-1 flex flex-wrap gap-x-5 text-sm">
            <Link href="/about?inquiry=mentorship" scroll={false} className={`inline-flex min-h-11 items-center ${linkClass}`}>Ask about mentorship</Link>
            <Link href="/about?inquiry=general" scroll={false} className={`inline-flex min-h-11 items-center ${linkClass}`}>Discuss a collaboration</Link>
          </div>
        </section>
        <details className="group border-y border-slate-200">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 font-serif text-xl font-semibold hover:text-teal-800 [&::-webkit-details-marker]:hidden">
            Background &amp; credentials
            <span aria-hidden="true" className="text-base text-teal-800 group-open:hidden">+</span>
            <span aria-hidden="true" className="hidden text-base text-teal-800 group-open:inline">−</span>
          </summary>
          <div className="space-y-4 pb-6 text-sm leading-relaxed text-slate-600">
            <p>I teach practical AI through worked examples, interactive practice, and projects. My work spans machine learning, language models, agents, computer vision, and data governance.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Education</h2>
                <ul className="mt-2 space-y-1">
                  <li>{MAJID.education.phd}</li>
                  <li>{MAJID.education.ms}</li>
                  <li>{MAJID.education.mba}</li>
                  <li>{MAJID.education.basc}</li>
                </ul>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Certifications</h2>
                <ul className="mt-2 space-y-2">
                  <li>{MAJID.roles.nvidia}</li>
                  <li>
                    <a href={MAJID.certifications.aiForBusiness.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={linkClass}>
                      {MAJID.certifications.aiForBusiness.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <span className="block">{MAJID.certifications.aiForBusiness.issuer}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </details>
        <nav aria-label="Profile links" className="mt-3 flex flex-wrap gap-x-5 text-sm">
          <a className={`inline-flex min-h-11 items-center ${linkClass}`} href={SITE.linkedin} rel="me">LinkedIn</a>
          <a className={`inline-flex min-h-11 items-center ${linkClass}`} href={SITE.github} rel="me">GitHub</a>
          <a className={`inline-flex min-h-11 items-center ${linkClass}`} href={SITE.scholar} rel="me">Google Scholar</a>
          <a className={`inline-flex min-h-11 items-center ${linkClass}`} href={MAJID.orcid} rel="me">ORCID</a>
        </nav>
      </main>
    </div>
  );
}
