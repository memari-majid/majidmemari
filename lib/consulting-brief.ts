/**
 * The structured consulting brief Dr. MJ drafts mid-conversation. The model
 * emits it as the input of the `draftConsultingBrief` tool, so the schema is
 * the contract for three readers: the tool (validation), the widget (the
 * card renders `part.input`, including partial input while streaming), and
 * the hand-off email (`findBrief` recovers it from the transcript).
 *
 * Schema rules: caps are twice the display target and the targets sit in
 * `.describe()`, so a slightly long field is accepted instead of failing a
 * 1,500-token brief and burning a retry step. No regex patterns and no
 * `format` keywords, because the schema is sent to every picker model.
 *
 * Client-safe: zod plus a type-only `ai` import.
 */

import { z } from "zod";
import type { ModelMessage } from "ai";

export const BRIEF_TOOL_NAME = "draftConsultingBrief";

export const EFFORTS = ["low", "medium", "high"] as const;
export const ENGAGEMENTS = ["consulting", "team-training", "implementation", "not-yet"] as const;

export type BriefEffort = (typeof EFFORTS)[number];
export type BriefEngagement = (typeof ENGAGEMENTS)[number];

export const ENGAGEMENT_LABEL: Record<BriefEngagement, string> = {
  consulting: "Advisory consulting",
  "team-training": "Team training",
  implementation: "Scoped implementation",
  "not-yet": "Not yet: keep it manual for now",
};

export const EFFORT_LABEL: Record<BriefEffort, string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export const consultingBriefSchema = z.object({
  title: z
    .string()
    .max(160)
    .describe("Short noun phrase naming the situation, under 80 characters, no trailing period"),
  situation: z
    .string()
    .max(900)
    .describe(
      "Two or three sentences restating what the visitor does and what they want from AI, in their own terms. Target 400 characters.",
    ),
  goal: z
    .string()
    .max(400)
    .describe("One sentence: the outcome they want, as specific as they made it. Target 200 characters."),
  opportunities: z
    .array(
      z.object({
        title: z.string().max(120).describe("Short noun phrase, no trailing period, under 60 characters"),
        why: z
          .string()
          .max(400)
          .describe("One or two sentences on why AI fits here, grounded in what they said. Target 200 characters."),
        effort: z.enum(EFFORTS).describe("Realistic effort to reach a working first version"),
      }),
    )
    .min(1)
    .max(4)
    .describe("One to four opportunities, best first"),
  risks: z
    .array(
      z.object({
        title: z.string().max(120).describe("Short noun phrase, no trailing period, under 60 characters"),
        mitigation: z.string().max(300).describe("One sentence on how to reduce it. Target 150 characters."),
      }),
    )
    .min(1)
    .max(3),
  keepHuman: z
    .array(z.string().max(300).describe("One sentence naming a task to keep with people and why. Target 150 characters."))
    .min(1)
    .max(4)
    .describe("Tasks this organization should not hand to AI, at least for now"),
  firstStep: z
    .string()
    .max(600)
    .describe("The single most useful next step, concrete, at most two sentences. Target 300 characters."),
  openQuestions: z
    .array(z.string().max(300).describe("A question ending in a question mark, under 150 characters"))
    .min(1)
    .max(5)
    .describe("Questions to answer before committing budget"),
  engagement: z
    .enum(ENGAGEMENTS)
    .describe(
      "consulting = advisory first; team-training = the team needs skills; implementation = goal, data, and owner exist and something should be built; not-yet = AI is not the right move now",
    ),
  engagementReason: z
    .string()
    .max(400)
    .describe("One sentence on why that is the right first engagement. Target 200 characters."),
});

export type ConsultingBrief = z.infer<typeof consultingBriefSchema>;

/** Keys in render order; the card walks this list. */
export const BRIEF_KEYS = [
  "title",
  "situation",
  "goal",
  "opportunities",
  "risks",
  "keepHuman",
  "firstStep",
  "openQuestions",
  "engagement",
  "engagementReason",
] as const satisfies readonly (keyof ConsultingBrief)[];

/** Plain-text rendering shared by the hand-off email and the model-facing summary. */
export function briefToText(brief: ConsultingBrief): string {
  const lines: string[] = [];
  lines.push(brief.title.trim());
  lines.push("");
  lines.push(`Situation: ${brief.situation.trim()}`);
  lines.push(`Goal: ${brief.goal.trim()}`);
  lines.push("");
  lines.push("Opportunities:");
  for (const o of brief.opportunities) {
    lines.push(`- ${o.title.trim()} (${EFFORT_LABEL[o.effort].toLowerCase()}): ${o.why.trim()}`);
  }
  lines.push("");
  lines.push("Risks:");
  for (const r of brief.risks) lines.push(`- ${r.title.trim()}: ${r.mitigation.trim()}`);
  lines.push("");
  lines.push("Keep with people:");
  for (const k of brief.keepHuman) lines.push(`- ${k.trim()}`);
  lines.push("");
  lines.push(`First step: ${brief.firstStep.trim()}`);
  lines.push("");
  lines.push("Open questions:");
  for (const q of brief.openQuestions) lines.push(`- ${q.trim()}`);
  lines.push("");
  lines.push(`Suggested engagement: ${ENGAGEMENT_LABEL[brief.engagement]}. ${brief.engagementReason.trim()}`);
  return lines.join("\n");
}

/** One line for the model after the card is shown, so it does not repeat the brief. */
export function briefSummaryLine(brief: ConsultingBrief): string {
  const first = brief.opportunities[0]?.title?.trim();
  return `Brief "${brief.title.trim()}" drafted and shown to the visitor as a card (${brief.opportunities.length} opportunities, first: ${first ?? "none"}; suggested engagement: ${ENGAGEMENT_LABEL[brief.engagement]}).`;
}

/**
 * Recovers the latest brief from the model messages the SDK hands a tool
 * (`ToolCallOptions.messages`). When `toolCallId` is given and found it wins;
 * otherwise the most recent valid brief wins. A brief drafted in the same
 * step as the caller (parallel calls) is not visible yet and returns
 * `undefined`. Input is re-validated because it round-tripped through the
 * client.
 */
export function findBrief(messages: ModelMessage[], toolCallId?: string): ConsultingBrief | undefined {
  let latest: ConsultingBrief | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant" || typeof m.content === "string") continue;
    for (let j = m.content.length - 1; j >= 0; j--) {
      const part = m.content[j];
      if (part.type !== "tool-call" || part.toolName !== BRIEF_TOOL_NAME) continue;
      const parsed = consultingBriefSchema.safeParse(part.input);
      if (!parsed.success) continue;
      if (toolCallId && part.toolCallId === toolCallId) return parsed.data;
      if (!latest) latest = parsed.data;
    }
  }
  return latest;
}
