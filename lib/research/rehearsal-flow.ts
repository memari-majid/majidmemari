import type { ShiftSession } from "../course-kb/shift-session";
import type { ResearchExperiment } from "./types";

/** The study routes have different completion criteria; a checkpoint alone is never completion. */
export function completedRehearsalReady(
  experiment: ResearchExperiment,
  snapshot: ShiftSession | null,
  questionComplete: boolean,
): boolean {
  if (!snapshot) return false;
  if (experiment === "E1")
    return (
      snapshot.record.runs.length === 1 &&
      !!snapshot.practice.responses["run-1"]?.committed
    );
  return (
    questionComplete &&
    snapshot.record.runs.length === 2 &&
    !!snapshot.record.nextRequest &&
    (["run-1", "run-2", "C"] as const).every(
      (target) => !!snapshot.practice.responses[target]?.committed,
    )
  );
}
