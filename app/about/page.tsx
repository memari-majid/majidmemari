import type { Metadata } from "next";
import Link from "next/link";
import { BioCategories } from "@/app/components/BioCategories";
import { ChatWidget } from "@/app/components/ChatWidget";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata("about", "/about", "profile");

export default function AboutPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <JsonLd page="/about" />
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {MAJID.fullName}
        </h1>
        <p className="mt-2 text-lg font-medium text-zinc-800 dark:text-zinc-200">
          {MAJID.headlineRole}
        </p>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {MAJID.shortBio} PhD in Computer Science (SIU 2023) with gen-AI thesis work.{" "}
          {MAJID.cs4720r.title}: {MAJID.cs4720r.tagline}. He is a{" "}
          <a
            className="text-sky-600 underline dark:text-sky-400"
            href={MAJID.aiUtah100.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {MAJID.aiUtah100.label}
          </a>
          .
        </p>

        <article className="mt-10">
          <BioCategories />
          <p className="mt-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Education: {MAJID.education.phd}; {MAJID.education.ms}; {MAJID.education.mba}. Selected
            papers live on the{" "}
            <Link className="text-sky-600 underline dark:text-sky-400" href="/publications">
              publications
            </Link>{" "}
            page and Google Scholar.
          </p>
        </article>

        <ul className="mt-10 space-y-2 text-sm">
          <li>
            <Link className="text-sky-600 underline dark:text-sky-400" href="/publications">
              Publications
            </Link>
          </li>
          <li>
            <Link className="text-sky-600 underline dark:text-sky-400" href="/teaching">
              Teaching at UVU (Fall 2026)
            </Link>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={SITE.linkedin} rel="me">
              LinkedIn
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={SITE.github} rel="me">
              GitHub
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={SITE.scholar} rel="me">
              Google Scholar
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.orcid} rel="me">
              ORCID
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.researchGate} rel="me">
              ResearchGate
            </a>
          </li>
          <li>
            <a
              className="text-sky-600 underline dark:text-sky-400"
              href={MAJID.nvidiaInstructorDirectory}
              rel="me"
              target="_blank"
            >
              NVIDIA Certified Instructor Directory
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.uvuDirectory}>
              UVU faculty directory
            </a>
          </li>
          <li>
            <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.nexusSite}>
              Nexus AI Solutions
            </a>
          </li>
          <li>
            <Link className="text-sky-600 underline dark:text-sky-400" href="/#contact">
              Contact
            </Link>
          </li>
        </ul>
      </main>
      <ChatWidget />
    </div>
  );
}
