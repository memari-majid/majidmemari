/**
 * Deterministic sizing for `estimateProject`.
 *
 * The model supplies what it learned in the conversation: the objective, the
 * shape of the work, how ready the data is, how many systems it must touch,
 * what compliance load it carries, and who would do it. The arithmetic is
 * here, so two visitors who describe the same situation get the same range
 * and the number can be explained rather than defended.
 *
 * A range of weeks for a first useful version. Never a price: the assistant
 * is not allowed to quote, and effort is not cost.
 *
 * Client-safe: zod and pure functions, so the card and the tool agree.
 */

import { z } from "zod";

export const PROJECT_SHAPES = [
  "assistant",
  "rag",
  "agent-workflow",
  "automation",
  "data-prep",
  "evaluation",
] as const;

export type ProjectShape = (typeof PROJECT_SHAPES)[number];

export const SHAPE_LABEL: Record<ProjectShape, string> = {
  assistant: "Assistant over your own content",
  rag: "Retrieval over private documents",
  "agent-workflow": "Multi-step agent workflow",
  automation: "Automating an existing process",
  "data-prep": "Getting the data ready",
  evaluation: "Evaluation and guardrails",
};

/** Weeks to a first version someone actually uses, before any multiplier. */
const BASE_WEEKS: Record<ProjectShape, [low: number, high: number]> = {
  assistant: [4, 8],
  rag: [5, 10],
  "agent-workflow": [8, 14],
  automation: [4, 9],
  "data-prep": [3, 7],
  evaluation: [2, 4],
};

const PHASES: Record<ProjectShape, readonly string[]> = {
  assistant: ["Scope and success test", "Content pipeline", "Assistant and guardrails", "Pilot with real users"],
  rag: ["Scope and success test", "Document pipeline", "Retrieval and answer quality", "Pilot with real users"],
  "agent-workflow": ["Scope and success test", "Tools and integrations", "Agent loop and evaluation", "Supervised pilot"],
  automation: ["Map the current process", "Build the happy path", "Exceptions and handoffs", "Supervised pilot"],
  "data-prep": ["Inventory and access", "Cleaning and structure", "Quality checks", "Handover"],
  evaluation: ["Define what good means", "Build the test set", "Run and report"],
};

export const estimateInputSchema = z.object({
  objective: z
    .string()
    .max(400)
    .describe("One sentence naming the first useful version, in the visitor's own terms. Target 200 characters."),
  shape: z
    .enum(PROJECT_SHAPES)
    .describe(
      "assistant = an assistant over their own content; rag = retrieval over private documents; agent-workflow = several steps and tools chained; automation = an existing manual process; data-prep = the data is the work; evaluation = measuring or guardrailing something that already exists",
    ),
  dataReadiness: z
    .enum(["low", "medium", "high"])
    .describe(
      "low = the data is scattered, dirty, or access is unresolved; medium = it exists and is reachable with work; high = it is clean, reachable, and cleared for use. Judge only from what they said.",
    ),
  integrations: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("How many other systems this must read from or write to, counted from what they described"),
  compliance: z
    .enum(["none", "moderate", "heavy"])
    .describe(
      "none = no regulated data; moderate = internal policy, customer data, or a review step; heavy = regulated data such as health, education, finance, or government records",
    ),
  team: z
    .enum(["none", "one-engineer", "small-team", "platform-team"])
    .describe("Who would actually build it, from what they said. none = nobody is assigned yet."),
  assumptions: z
    .array(z.string().max(300).describe("One assumption this estimate rests on, under 150 characters"))
    .min(1)
    .max(5)
    .describe("The assumptions that would change the range most if they turn out to be wrong"),
  unknowns: z
    .array(z.string().max(300).describe("One thing nobody knows yet, under 150 characters"))
    .min(1)
    .max(4)
    .describe("What has to be answered before this range can narrow"),
});

export type EstimateInput = z.infer<typeof estimateInputSchema>;

export type EstimatePhase = { title: string; weeksLow: number; weeksHigh: number };

export type ProjectEstimate = {
  objective: string;
  shapeLabel: string;
  weeksLow: number;
  weeksHigh: number;
  band: "small" | "medium" | "large";
  bandLabel: string;
  phases: EstimatePhase[];
  /** The two or three inputs that moved the range most. */
  drivers: string[];
  caveat: string;
};

const DATA_MULTIPLIER: Record<EstimateInput["dataReadiness"], number> = {
  low: 1.4,
  medium: 1.15,
  high: 1,
};

const COMPLIANCE_MULTIPLIER: Record<EstimateInput["compliance"], number> = {
  none: 1,
  moderate: 1.2,
  heavy: 1.45,
};

const TEAM_MULTIPLIER: Record<EstimateInput["team"], number> = {
  none: 1.35,
  "one-engineer": 1.1,
  "small-team": 1,
  "platform-team": 0.9,
};

const round = (weeks: number) => Math.max(1, Math.round(weeks * 2) / 2);

export function estimateProject(input: EstimateInput): ProjectEstimate {
  const [baseLow, baseHigh] = BASE_WEEKS[input.shape];
  const multiplier =
    DATA_MULTIPLIER[input.dataReadiness] *
    COMPLIANCE_MULTIPLIER[input.compliance] *
    TEAM_MULTIPLIER[input.team];
  const integrationWeeks = input.integrations * 0.5;

  const weeksLow = round(baseLow * multiplier + integrationWeeks);
  const weeksHigh = round(baseHigh * multiplier + integrationWeeks * 1.5);

  const titles = PHASES[input.shape];
  const share = weeksHigh / titles.length;
  const phases: EstimatePhase[] = titles.map((title, i) => ({
    title,
    weeksLow: round((weeksLow / titles.length) * (i === 0 ? 0.8 : 1)),
    weeksHigh: round(share * (i === titles.length - 1 ? 1.2 : 1)),
  }));

  const drivers: string[] = [];
  if (input.dataReadiness === "low") drivers.push("The data is not ready, which is usually the longest pole");
  if (input.dataReadiness === "medium") drivers.push("The data exists but needs work before it can be used");
  if (input.integrations >= 3) drivers.push(`${input.integrations} systems to integrate with`);
  if (input.compliance === "heavy") drivers.push("Regulated data, so review and access control are real work");
  if (input.compliance === "moderate") drivers.push("Internal policy and a review step to design around");
  if (input.team === "none") drivers.push("Nobody is assigned yet, so the first weeks go to finding an owner");
  if (input.team === "platform-team") drivers.push("An existing platform team shortens the build");
  if (drivers.length === 0) drivers.push("A clean scope with ready data and no hard compliance load");

  const band = weeksHigh <= 6 ? "small" : weeksHigh <= 12 ? "medium" : "large";
  const bandLabel =
    band === "small"
      ? "Small: one focused push"
      : band === "medium"
        ? "Medium: a quarter of real work"
        : "Large: plan it in phases";

  return {
    objective: input.objective.trim(),
    shapeLabel: SHAPE_LABEL[input.shape],
    weeksLow,
    weeksHigh,
    band,
    bandLabel,
    phases,
    drivers: drivers.slice(0, 3),
    caveat:
      "A range of calendar weeks to a first useful version, not a quote and not a price. It moves with the assumptions listed above.",
  };
}

/** Compact text for the model after the card is shown. */
export function estimateToText(estimate: ProjectEstimate): string {
  return `Estimate shown as a card: ${estimate.weeksLow} to ${estimate.weeksHigh} weeks to a first useful version (${estimate.bandLabel}). What drives it: ${estimate.drivers.join("; ")}. Do not repeat the phases in text. Say what would shrink the range, and be clear this is effort, not a price.`;
}
