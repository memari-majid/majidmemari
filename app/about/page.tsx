import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BioCategories } from "@/app/components/BioCategories";
import { ChatWidget } from "@/app/components/ChatWidget";
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
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-20 pt-32 sm:px-8">
        <div className="flex flex-col-reverse items-start gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">About</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Majid Memari</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">{MAJID.shortBio}</p>
          </div>
          <Image src="/majid-memari.png" alt="Majid Memari" width={160} height={160} className="h-36 w-36 shrink-0 rounded-2xl border border-slate-200 object-cover object-top" />
        </div>

        <div className="mt-12 border-t border-slate-200 pt-10">
          <BioCategories />
        </div>
        <section aria-labelledby="background-heading" className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 id="background-heading" className="text-xl font-semibold">Background</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>{MAJID.education.phd}</li>
            <li>{MAJID.education.ms}</li>
            <li>{MAJID.education.mba}</li>
            <li>{MAJID.education.basc}</li>
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            NVIDIA Deep Learning Institute Certified Instructor. Explore my <Link className={linkClass} href="/publications">research and publications</Link> for the scholarly work behind my applied AI interests.
          </p>
        </section>
        <section aria-labelledby="connect-heading" className="mt-10">
          <h2 id="connect-heading" className="text-xl font-semibold">Connect &amp; explore</h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4 text-sm">
            <Link className={linkClass} href="/teaching">Courses &amp; workshops</Link>
            <Link className={linkClass} href="/#mentorship">Mentorship</Link>
            <a className={linkClass} href={SITE.linkedin} rel="me">LinkedIn</a>
            <a className={linkClass} href={SITE.github} rel="me">GitHub</a>
            <a className={linkClass} href={SITE.scholar} rel="me">Google Scholar</a>
            <a className={linkClass} href={MAJID.orcid} rel="me">ORCID</a>
          </div>
          <p className="mt-7 text-sm text-slate-600">
            To discuss a course, workshop, or project, <Link className={linkClass} href="/#contact">get in touch</Link>.
          </p>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}
