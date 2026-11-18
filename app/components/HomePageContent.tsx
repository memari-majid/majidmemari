import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

const linkClass =
  "font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 transition hover:decoration-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700";

export function HomePageContent() {
  return (
    <>
      <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-8 px-5 pb-14 pt-28 text-slate-900 sm:px-8 sm:pb-16 sm:pt-32 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 lg:gap-16">
        <div>
          <p className="text-sm font-medium text-teal-800">
            Majid Memari · AI educator
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            <span className="block sm:inline">Understand AI.</span>{" "}
            <span className="block sm:inline">Build something useful.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            I design hands-on AI courses, simulations and learning tools for learners, teams and organizations.
          </p>
          <Link href="/teaching" className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm ${linkClass}`}>
            Explore teaching <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Image
          src="/majid-memari.png"
          alt="Majid Memari"
          width={480}
          height={480}
          priority
          sizes="(max-width: 639px) 160px, (max-width: 1023px) 208px, 240px"
          className="aspect-square w-40 rounded-2xl object-cover object-top sm:w-52 lg:w-60"
        />
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 py-7 pl-5 pr-20 text-sm text-slate-600 sm:flex-row sm:pl-8 xl:pr-8">
          <p>© {new Date().getFullYear()} Majid Memari</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/projects" className="hover:text-teal-800">Research</Link>
            <Link href="/teaching" className="hover:text-teal-800">Teaching</Link>
            <Link href="/about" className="hover:text-teal-800">About</Link>
            <a href={SITE.linkedin} rel="me" className="hover:text-teal-800">LinkedIn</a>
            <a href={SITE.github} rel="me" className="hover:text-teal-800">GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
