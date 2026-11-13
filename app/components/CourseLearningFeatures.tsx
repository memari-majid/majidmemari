const COURSE = "/teaching/ai-solutions";
const FEATURES = [
  {
    title: "Simulations you can explore",
    detail: "Change an assumption, move requests through a review queue, and compare the result in a figure and its matching table.",
    href: `${COURSE}/unit-11.html#lesson-figure-11-title`,
    action: "Try the moving review queue",
    label: "01 · Explore",
  },
  {
    title: "Your AI Learning Companion",
    detail: "Inspect and correct an AI interpretation before running your workflow. Predict the result, follow its action trace, and explore your explanation with an optional AI-selected question.",
    href: `${COURSE}/assistant?lesson=unit-01.html`,
    action: "Explore with the Learning Companion",
    extraHref: `${COURSE}/assistant?lesson=unit-04.html`,
    extraAction: "Try the workflow rehearsal",
    label: "02 · Reason",
  },
  {
    title: "One useful solution, start to finish",
    detail: "Follow one capstone from a real-world need to a tested solution and handoff, using a partner problem or the supplied classroom case.",
    href: `${COURSE}/project.html`,
    action: "See the capstone path",
    label: "03 · Build",
  },
] as const;

export function CourseLearningFeatures({ headingLevel = 4 }: { headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
      {FEATURES.map(feature => (
        <li key={feature.title} className="min-w-0 border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">{feature.label}</p>
          <Heading className="mt-3 text-base font-semibold leading-snug text-slate-900">{feature.title}</Heading>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.detail}</p>
          <a href={feature.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">{feature.action} →</a>
          {"extraHref" in feature ? <a href={feature.extraHref} className="inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">{feature.extraAction} →</a> : null}
        </li>
      ))}
    </ul>
  );
}
