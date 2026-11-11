import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ProjectShowcase } from "@/app/components/ProjectShowcase";

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
              I teach AI and build practical applications. Explore my courses, workshops,
              and projects, or get in touch about learning and collaboration.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <Link href="/projects" className={`inline-flex min-h-11 items-center ${linkClass}`}>Explore projects →</Link>
              <Link href="/teaching" className={`inline-flex min-h-11 items-center ${linkClass}`}>Courses &amp; workshops →</Link>
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
            <h2 id="course-section-heading" className="text-2xl font-semibold tracking-tight">Courses</h2>
            <article aria-labelledby="home-course-heading" className="mt-5 max-w-2xl">
              <h3 id="home-course-heading" className="text-lg font-medium">Building AI Solutions</h3>
              <p className="mt-2 leading-relaxed text-slate-600">An interactive course for turning a business need into a useful AI solution. Twelve lessons and a practical capstone, with no coding required.</p>
              <a href="/teaching/ai-solutions/" className={`mt-3 inline-flex min-h-11 items-center text-sm ${linkClass}`}>Explore the course →</a>
            </article>
          </div>
        </section>

        <ProjectShowcase />

        <section id="workshops" aria-labelledby="workshops-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-10 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <h2 id="workshops-heading" className="text-2xl font-semibold tracking-tight">Workshops</h2>
            <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
              <article>
                <h3 className="text-lg font-semibold">Building Agentic AI Applications with LLMs</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Hands-on NVIDIA Deep Learning Institute instruction from a DLI Certified Instructor.</p>
                <Link href="/teaching/agentic-llm" className={`mt-3 inline-flex min-h-11 items-center text-sm ${linkClass}`}>Explore the workshop →</Link>
              </article>
              <article>
                <h3 className="text-lg font-semibold">AI for teams and business learners</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">A focused session shaped around your audience, practical problems, and learning goals.</p>
                <a href="#contact" className={`mt-3 inline-flex min-h-11 items-center text-sm ${linkClass}`}>Discuss a workshop →</a>
              </article>
            </div>
          </div>
        </section>

        <section id="mentorship" aria-labelledby="mentorship-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-10 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <h2 id="mentorship-heading" className="text-2xl font-semibold tracking-tight">Mentorship</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">Support for learners and teams developing an AI idea, capstone, or applied project. Clarify the problem, evaluate the work, and plan the next step.</p>
            <a href="#contact" className={`mt-3 inline-flex min-h-11 items-center text-sm ${linkClass}`}>Ask about mentorship →</a>
          </div>
        </section>

        <section aria-labelledby="about-heading" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <h2 id="about-heading" className="text-2xl font-semibold tracking-tight">About</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">My background combines computer science, business, applied AI research, and teaching. I help people connect technical possibilities with useful, measurable outcomes.</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/about" className={`inline-flex min-h-11 items-center ${linkClass}`}>More about me →</Link>
              <Link href="/projects?view=publications" className={`inline-flex min-h-11 items-center ${linkClass}`}>Research &amp; publications →</Link>
            </div>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-16 pt-10 sm:px-8">
          <div className="border-t border-slate-200 pt-8">
            <h2 id="contact-heading" className="text-2xl font-semibold tracking-tight">Get in touch</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">For workshops, mentorship, or collaboration, share a little about what you have in mind.</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="?chat=open" className={`inline-flex min-h-11 items-center ${linkClass}`}>Start a conversation →</a>
              <a href={SITE.linkedin} rel="me" className={`inline-flex min-h-11 items-center ${linkClass}`}>Connect on LinkedIn →</a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-7 text-sm text-slate-600 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Majid Memari</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/projects" className="hover:text-teal-800">Projects</Link>
            <Link href="/teaching" className="hover:text-teal-800">Teaching</Link>
            <Link href="/about" className="hover:text-teal-800">About</Link>
            <Link href="/projects?view=publications" className="hover:text-teal-800">Publications</Link>
            <a href={SITE.github} rel="me" className="hover:text-teal-800">GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
