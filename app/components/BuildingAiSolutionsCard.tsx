import { CourseEffortPreview } from "./CourseEffortPreview";
import { CourseLearningFeatures } from "./CourseLearningFeatures";

type BuildingAiSolutionsCardProps = {
  headingLevel?: 2 | 3;
};

export function BuildingAiSolutionsCard({
  headingLevel = 2,
}: BuildingAiSolutionsCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article aria-labelledby="building-ai-solutions-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-8">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <div className="py-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Featured course · designed by Majid Memari</p>
          <Heading id="building-ai-solutions-heading" className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Building AI Solutions
          </Heading>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-700">
            Learn by exploring, deciding and building.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Build a useful AI solution through interactive simulations, moving figures and an AI Learning Companion. Open to any discipline, with no prerequisites or coding required.
          </p>
          <p className="mt-5 text-sm font-semibold leading-7 text-slate-900">12 units · one practical capstone · five milestones</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/teaching/ai-solutions/demo" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800">Try the 3-minute simulation →</a>
            <a href="/teaching/ai-solutions/index.html" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-teal-700 hover:text-teal-800">Explore the course</a>
          </div>
          <p className="mt-4 max-w-md text-xs leading-6 text-slate-600">Explore the public lessons without an account. Worked examples and reading routes are available without an AI service.</p>
        </div>
        <CourseEffortPreview />
      </div>
      <div className="mt-8"><CourseLearningFeatures headingLevel={headingLevel === 2 ? 3 : 4} /></div>
      <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-600">A consistent Learn → Try → Build → Finish path. In a Canvas offering, lessons and the Learning Companion stay embedded while Canvas handles submissions, feedback and grades.</p>
    </article>
  );
}
