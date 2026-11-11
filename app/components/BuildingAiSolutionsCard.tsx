type BuildingAiSolutionsCardProps = {
  headingLevel?: 2 | 3;
};

const PROJECT_STAGES = [
  "Find the need",
  "Build with AI",
  "Test & pilot",
  "Offer & adoption",
  "Deliver & defend",
];

export function BuildingAiSolutionsCard({
  headingLevel = 2,
}: BuildingAiSolutionsCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article
      aria-labelledby="building-ai-solutions-heading"
      className="relative isolate overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_65%)]"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
          Independent course · Majid Memari
        </p>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
          No prerequisites
        </span>
      </div>

      <Heading
        id="building-ai-solutions-heading"
        className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
      >
        Building AI Solutions
      </Heading>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
        Practical AI problem-solving for everyone.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
        Follow one path through twelve lessons, with simulations inside each relevant lesson and a capstone shaped by
        partner or client needs. Use AI tools and agents to build a product or service, evaluate
        the results, and make the case for a sale or adoption.
      </p>

      <ol
        aria-label="The project journey"
        className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-5"
      >
        {PROJECT_STAGES.map((stage, index) => (
          <li key={stage} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <span aria-hidden="true" className="block text-xs font-semibold tabular-nums text-sky-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mt-2 block text-sm font-medium text-slate-100">{stage}</span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-sm leading-relaxed text-slate-300">
        Open to students from any discipline. No prior AI, programming, statistics, or business
        background is required. Learn through real-world examples, figures, and practical decisions.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <a
          href="/teaching/ai-solutions/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
        >
          Start the learning path <span aria-hidden="true">→</span>
        </a>

      </div>
    </article>
  );
}
