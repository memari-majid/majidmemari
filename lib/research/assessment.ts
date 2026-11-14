/** Version-2 E2 candidate mechanics. This module does not enable live research. */
import { randomBytes } from "node:crypto";
import { exact, hash, ResearchError, type ResearchConfig } from "./config";
import type { ResearchParticipant, ResearchDatabase } from "./store";
import type {
  AssessmentStage,
  AssessmentFormKey,
  ResearchStage,
  ResearchTaskContext,
} from "./types";

export const ASSESSMENT_STAGES = ["baseline", "immediate", "delayed"] as const;
export const FORM_ORDERS: [
  AssessmentFormKey,
  AssessmentFormKey,
  AssessmentFormKey,
][] = [
  ["A", "B", "C"],
  ["A", "C", "B"],
  ["B", "A", "C"],
  ["B", "C", "A"],
  ["C", "A", "B"],
  ["C", "B", "A"],
];
export function isAssessmentStage(stage: string): stage is AssessmentStage {
  return (ASSESSMENT_STAGES as readonly string[]).includes(stage);
}
export function allocateAssessment(
  db: ResearchDatabase,
  config: ResearchConfig,
): ResearchParticipant["assessment"] {
  if (!config.manifest.assessment) return undefined;
  const counters = (db.allocationCounters ??= {});
  const ordinal = counters[config.fingerprint] ?? 0;
  if (!Number.isSafeInteger(ordinal) || ordinal < 0)
    throw new ResearchError(
      503,
      "Assessment allocation needs operator attention.",
    );
  counters[config.fingerprint] = ordinal + 1;
  return {
    version: "balanced-forms-v1",
    allocationOrdinal: ordinal,
    order: [...FORM_ORDERS[ordinal % 6]],
    tasks: {},
  };
}
export function assessmentForm(
  config: ResearchConfig,
  p: ResearchParticipant,
  stage: ResearchStage,
) {
  if (!config.manifest.assessment || !isAssessmentStage(stage))
    return config.manifest.forms[stage]!;
  const key = p.assessment?.order[ASSESSMENT_STAGES.indexOf(stage)];
  if (!key)
    throw new ResearchError(
      409,
      "The frozen parallel-form allocation is missing; do not reassign this record.",
    );
  return config.manifest.assessment.forms[key];
}
export function openAssessment(
  config: ResearchConfig,
  p: ResearchParticipant,
  stage: ResearchStage,
  now: number,
) {
  if (!config.manifest.assessment || !isAssessmentStage(stage))
    return undefined;
  const state = p.assessment;
  if (!state)
    throw new ResearchError(
      409,
      "The frozen parallel-form allocation is missing.",
    );
  const task = (state.tasks[stage] ??= {
    openedAt: new Date(now).toISOString(),
    rowId: `row_${randomBytes(18).toString("hex")}`,
    sortKey: randomBytes(24).toString("hex"),
  });
  const design = config.manifest.assessment;
  return {
    nominalSeconds: design.nominalSeconds,
    openedAt: task.openedAt,
    nominalEndsAt: new Date(
      Date.parse(task.openedAt) + design.nominalSeconds * 1000,
    ).toISOString(),
    timing: design.timing,
    selfReportVersion: design.selfReportVersion,
    askPriorExposure: stage === "baseline",
  };
}
export function taskContext(
  input: unknown,
  stage: AssessmentStage,
): ResearchTaskContext {
  // Omitted optional items are unknown, never interpreted as 'no'.
  if (input === undefined)
    return {
      outsideHelp: "decline",
      helpCategory: "decline",
      interruption: "decline",
      accommodation: "decline",
      ...(stage === "baseline" ? { priorExposure: "decline" as const } : {}),
    };
  exact(
    input,
    ["outsideHelp", "helpCategory", "interruption", "accommodation"],
    stage === "baseline" ? ["priorExposure"] : [],
  );
  for (const k of [
    "outsideHelp",
    "interruption",
    "accommodation",
    ...(stage === "baseline" && input.priorExposure !== undefined
      ? ["priorExposure"]
      : []),
  ])
    if (!["yes", "no", "unsure", "decline"].includes(input[k] as string))
      throw new ResearchError(
        400,
        "Use a coarse optional self-report response.",
      );
  if (
    ![
      "none",
      "person",
      "ai",
      "other-resource",
      "multiple",
      "unsure",
      "decline",
    ].includes(input.helpCategory as string)
  )
    throw new ResearchError(400, "Use a broad help category only.");
  if (
    (input.outsideHelp === "no" &&
      !["none", "decline"].includes(input.helpCategory as string)) ||
    (input.outsideHelp === "yes" && input.helpCategory === "none")
  )
    throw new ResearchError(
      400,
      "The help category conflicts with the help response.",
    );
  return {
    ...(input as ResearchTaskContext),
    ...(stage === "baseline"
      ? {
          priorExposure: (input.priorExposure ??
            "decline") as ResearchTaskContext["priorExposure"],
        }
      : {}),
  };
}
export function assessmentPacket(
  config: ResearchConfig,
  records: ResearchParticipant[],
  scope: "scoring" | "linkage",
) {
  const design = config.manifest.assessment!;
  const rows = records
    .flatMap((p) =>
      ASSESSMENT_STAGES.flatMap((stage) => {
        const answer = p.responses[stage]?.value;
        if (
          !answer ||
          !("answer" in answer) ||
          typeof answer.answer !== "string"
        )
          return [];
        const state = p.assessment?.tasks[stage];
        if (!state)
          throw new ResearchError(
            409,
            "Scoring requires the frozen assessment record.",
          );
        const form = assessmentForm(config, p, stage);
        return [
          {
            sortKey: state.sortKey,
            rowId: state.rowId,
            participantId: p.participantId,
            stage,
            formId: form.id,
            formVersion: form.version,
            response: answer.answer,
            task: {
              instructions: form.instructions,
              responsePrompt: form.responsePrompt,
              sources: form.sources.map(({ label, text }) => ({ label, text })),
              trace: form.trace,
            },
          },
        ];
      }),
    )
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  // Stable for this exact response set; new responses/withdrawals create another packet.
  const packetId = hash(
    JSON.stringify({
      fingerprint: config.fingerprint,
      participantIds: records.map((p) => p.participantId).sort(),
      rows: rows.map((r) => [r.rowId, hash(r.response)]),
    }),
  );
  return scope === "scoring"
    ? {
        version: 2,
        scope,
        packetId,
        mode: config.mode,
        rubric: design.rubric,
        maskingLimit:
          "Task wording and self-identifying answer content may be recognizable. Direct participant, occasion, time, allocation and condition labels are withheld. The independent data role must review free text before distributing this packet.",
        rows: rows.map(({ rowId, task, response }) => ({
          rowId,
          task,
          response,
        })),
      }
    : {
        version: 2,
        scope,
        packetId,
        mode: config.mode,
        studyId: config.manifest.studyId,
        protocolVersion: config.manifest.protocolVersion,
        experiment: config.manifest.experiment,
        participantIds: records.map((p) => p.participantId),
        rows: rows.map(
          ({ rowId, participantId, stage, formId, formVersion }) => ({
            rowId,
            participantId,
            stage,
            formId,
            formVersion,
          }),
        ),
      };
}
