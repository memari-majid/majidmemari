import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";
import { ContactForm } from "@/app/components/ContactForm";
import { JsonLd } from "@/app/components/JsonLd";
import { NavBar } from "@/app/components/NavBar";
import { MAJID } from "@/lib/majid";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata("contact", "/contact");

export default function ContactPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <JsonLd page="/contact" />
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Contact Majid Memari
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          AI Scientist and Solution Architect: applied AI teaching and Gen AI research at Utah
          Valley University, or AI consulting and team training through{" "}
          <a className="text-sky-600 underline dark:text-sky-400" href={MAJID.nexusSite}>
            Nexus AI Solutions
          </a>{" "}
          for teams across the United States, on site or online. UVU students can{" "}
          <a
            className="text-sky-600 underline dark:text-sky-400"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            book office hours
          </a>
          .
        </p>

        <dl className="mt-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-800 dark:text-zinc-200">UVU email</dt>
            <dd>
              <a className="text-sky-600 underline dark:text-sky-400" href={`mailto:${SITE.uvuEmail}`}>
                {SITE.uvuEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-800 dark:text-zinc-200">Personal email</dt>
            <dd>
              <a className="text-sky-600 underline dark:text-sky-400" href={`mailto:${SITE.email}`}>
                {SITE.emailDisplay}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-800 dark:text-zinc-200">UVU office</dt>
            <dd>
              {SITE.uvuOffice}, {SITE.addressLocality}, {SITE.addressRegion} · {SITE.uvuPhone}
            </dd>
          </div>
        </dl>

        <div className="mt-10">
          <ContactForm />
        </div>

        <p className="mt-10 text-sm">
          <Link className="text-sky-600 underline dark:text-sky-400" href="/teaching">
            AI Entrepreneurship teaching
          </Link>
          {" · "}
          <Link className="text-sky-600 underline dark:text-sky-400" href="/publications">
            Research
          </Link>
          {" · "}
          <Link className="text-sky-600 underline dark:text-sky-400" href="/about">
            About
          </Link>
        </p>
      </main>
      <ChatWidget />
    </div>
  );
}
