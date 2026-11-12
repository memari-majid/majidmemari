import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ProjectShowcase } from "@/app/components/ProjectShowcase";
import { BuildingAiSolutionsCard } from "@/app/components/BuildingAiSolutionsCard";

const linkClass =
  "font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 transition hover:decoration-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700";

export function HomePageContent() {
  return (
    <>
      <main id="main-content" className="text-slate-900">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-32 sm:px-8 sm:pb-16 sm:pt-36 lg:grid-cols-[1fr_240px] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-teal-800">
              Majid Memari · AI educator
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Understand AI. Build something useful.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              I teach AI and build practical applications for learners, teams, and organizations.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <Link href="/#teaching" className={`inline-flex min-h-11 items-center ${linkClass}`}>Explore teaching →</Link>
            </div>
          </div>
          <figure className="w-44 sm:w-52 lg:w-60 lg:justify-self-end">
            <div className="overflow-hidden">
              <Image
                src="/majid-memari.png"
                alt="Majid Memari"
                width={480}
                height={480}
                priority
                sizes="(max-width: 639px) 176px, (max-width: 1023px) 208px, 240px"
                className="aspect-square w-full rounded-2xl object-cover object-top"
              />
            </div>
          </figure>
        </section>

        <section id="teaching" aria-labelledby="course-section-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-10 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <h2 id="course-section-heading" className="text-2xl font-semibold tracking-tight">Teaching</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
              <BuildingAiSolutionsCard headingLevel={3} />
              <article id="workshops" aria-labelledby="workshops-heading" className="scroll-mt-28">
                <h3 id="workshops-heading" className="text-lg font-semibold">AI workshops</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Hands-on NVIDIA Deep Learning Institute instruction in Building Agentic AI Applications with LLMs, plus focused AI sessions shaped around your team’s practical problems and learning goals.</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <Link href="/teaching/agentic-llm" className={`inline-flex min-h-11 items-center ${linkClass}`}>Workshop learning page →</Link>
                  <Link href="/?inquiry=workshop" className={`inline-flex min-h-11 items-center ${linkClass}`}>Discuss a workshop →</Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <ProjectShowcase />

        <section id="mentorship" aria-labelledby="mentorship-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-16 pt-10 sm:px-8">
          <div id="contact" className="scroll-mt-28 border-t border-slate-200 pt-8">
            <h2 id="mentorship-heading" className="text-2xl font-semibold tracking-tight">Mentorship &amp; collaboration</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">Support for learners and teams developing an AI idea, capstone, or applied project. Clarify the problem, evaluate the work, and plan the next step.</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/?inquiry=mentorship" className={`inline-flex min-h-11 items-center ${linkClass}`}>Ask about mentorship →</Link>
              <Link href="/?inquiry=general" className={`inline-flex min-h-11 items-center ${linkClass}`}>Discuss a collaboration →</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-7 text-sm text-slate-600 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Majid Memari</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/projects" className="hover:text-teal-800">Research</Link>
            <Link href="/#teaching" className="hover:text-teal-800">Teaching</Link>
            <Link href="/about" className="hover:text-teal-800">About</Link>
            <a href={SITE.linkedin} rel="me" className="hover:text-teal-800">LinkedIn</a>
            <a href={SITE.github} rel="me" className="hover:text-teal-800">GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
