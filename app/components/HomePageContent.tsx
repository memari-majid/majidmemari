import Image from "next/image";
import Link from "next/link";
import { BuildingAiSolutionsCard } from "@/app/components/BuildingAiSolutionsCard";
import { SITE } from "@/lib/site";

const linkClass =
  "font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 transition hover:decoration-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700";

export function HomePageContent() {
  return (
    <>
      <main id="main-content" className="text-slate-900">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
              Majid Memari · AI educator
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Understand AI.<br />
              <span className="text-blue-800">Build something useful.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Courses, workshops, and mentorship that connect AI concepts to real business
              problems. Learn to ask better questions, build solutions, and evaluate what works.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/teaching/ai-solutions/"
                className="inline-flex min-h-12 items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
              >
                Explore Building AI Solutions <span aria-hidden="true" className="ml-2">→</span>
              </a>
              <a href="#workshops" className="inline-flex min-h-12 items-center px-3 text-sm text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">
                Find a workshop
              </a>
            </div>
          </div>
          <figure className="mx-auto w-full max-w-sm lg:justify-self-end">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5">
              <Image
                src="/majid-memari.png"
                alt="Majid Memari"
                width={480}
                height={480}
                priority
                sizes="(max-width: 1023px) 320px, 384px"
                className="aspect-square w-full rounded-[1.4rem] object-cover object-top"
              />
              <figcaption className="px-3 pb-3 pt-5">
                <p className="font-semibold text-slate-900">Majid Memari, Ph.D.</p>
                <p className="mt-1 text-sm text-slate-600">AI teaching · Workshops · Mentorship</p>
              </figcaption>
            </div>
          </figure>
        </section>

        <section id="teaching" aria-labelledby="course-section-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-12 sm:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Featured course</p>
              <h2 id="course-section-heading" className="mt-3 text-3xl font-semibold tracking-tight">Learn by building.</h2>
            </div>
            <Link href="/teaching" className={`text-sm ${linkClass}`}>Courses &amp; workshops</Link>
          </div>
          <BuildingAiSolutionsCard headingLevel={3} />
        </section>

        <section id="workshops" aria-labelledby="workshops-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Learn together</p>
          <h2 id="workshops-heading" className="mt-3 text-3xl font-semibold tracking-tight">Workshops with a practical purpose.</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
            A focused setting to explore a concept, try it, and discuss the decisions behind it.
            The audience and learning goals shape the format.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">NVIDIA Deep Learning Institute</p>
              <h3 className="mt-3 text-xl font-semibold">Building Agentic AI Applications with LLMs</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Hands-on technical workshop instruction from a DLI Certified Instructor.
                Explore how language models, tools, and workflows work together in AI applications.
              </p>
              <Link href="/teaching/agentic-llm" className={`mt-6 inline-block text-sm ${linkClass}`}>
                Open the workshop assistant
              </Link>
            </article>
            <article className="rounded-2xl border border-teal-900/15 bg-teal-900/[0.04] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">For teams &amp; business learners</p>
              <h3 className="mt-3 text-xl font-semibold">AI opportunities, prototypes, and decisions</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Frame a useful problem, explore an AI workflow, and assess its value and limits.
                Discuss a session shaped around your team&apos;s experience and goals.
              </p>
              <a href="#contact" className={`mt-6 inline-block text-sm ${linkClass}`}>Discuss a workshop</a>
            </article>
          </div>
        </section>

        <section id="mentorship" aria-labelledby="mentorship-heading" className="scroll-mt-28 border-y border-slate-200 bg-white/60">
          <div className="mx-auto grid max-w-6xl scroll-mt-28 gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Mentorship</p>
              <h2 id="mentorship-heading" className="mt-3 text-3xl font-semibold tracking-tight">Move a project forward with clarity.</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                For learners and teams developing an AI idea, a capstone, or an applied project.
                Bring the problem, the work so far, and the decision you need to make next.
              </p>
              <a href="#contact" className={`mt-6 inline-block text-sm ${linkClass}`}>Ask about mentorship</a>
            </div>
            <ol className="divide-y divide-slate-200">
              {[
                ["Clarify the problem", "Identify the user, the need, and a realistic scope."],
                ["Strengthen the evidence", "Choose meaningful tests and interpret the results."],
                ["Prepare the next step", "Explain the value, limitations, and path to adoption."],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span aria-hidden="true" className="pt-1 text-xs font-semibold tabular-nums text-teal-800">0{index + 1}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="about-heading" className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">About</p>
            <h2 id="about-heading" className="mt-3 text-3xl font-semibold tracking-tight">An educator with a builder&apos;s perspective.</h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-slate-600">
              I&apos;m Majid Memari. My background combines computer science, business, applied AI
              research, and teaching. I design learning experiences that help people connect
              technical possibilities with useful, measurable outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <Link href="/about" className={linkClass}>More about me</Link>
              <Link href="/publications" className={linkClass}>Research &amp; publications</Link>
            </div>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-20 sm:px-8">
          <div className="rounded-3xl border border-amber-900/15 bg-amber-100/50 p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">Let&apos;s talk</p>
            <h2 id="contact-heading" className="mt-3 text-3xl font-semibold tracking-tight">What would you like to learn or build?</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-700">
              For a workshop, mentorship, or a business challenge for the course, share your
              audience, goals, and a little context with the website chatbot.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href="?chat=open" className="inline-flex min-h-12 items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800">
                Chat with the website assistant
              </a>
              <a href={SITE.linkedin} rel="me" className={`text-sm ${linkClass}`}>Connect on LinkedIn</a>
            </div>

          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-7 text-sm text-slate-600 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Majid Memari</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/teaching" className="hover:text-teal-800">Teaching</Link>
            <Link href="/about" className="hover:text-teal-800">About</Link>
            <Link href="/publications" className="hover:text-teal-800">Publications</Link>
            <a href={SITE.github} rel="me" className="hover:text-teal-800">GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
