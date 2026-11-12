type BuildingAiSolutionsCardProps = {
  headingLevel?: 2 | 3;
};

export function BuildingAiSolutionsCard({
  headingLevel = 2,
}: BuildingAiSolutionsCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article aria-labelledby="building-ai-solutions-heading" className="max-w-2xl">
      <Heading id="building-ai-solutions-heading" className="text-lg font-semibold text-slate-900">
        Building AI Solutions
      </Heading>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Turn a useful problem into an AI solution through twelve interactive lessons and a practical capstone, with no coding required.
      </p>
      <a href="/teaching/ai-solutions/index.html" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">
        Explore the course →
      </a>
    </article>
  );
}
