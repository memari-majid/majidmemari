/** Shared wire types only. No credentials, database adapters or private form keys. */
import type { ShiftSession } from "../course-kb/shift-session";
export const RESEARCH_STAGES = [
  "baseline",
  "rehearsal",
  "immediate",
  "delayed",
  "feedback",
] as const;
export type ResearchStage = (typeof RESEARCH_STAGES)[number];
export type ResearchMode = "off" | "synthetic" | "live";
export type ResearchExperiment = "E1" | "E2" | "E3";
export type ResearchForm = {
  id: string;
  version: string;
  title: string;
  instructions: string;
  responsePrompt: string;
  sources: { id: string; label: string; text: string }[];
  trace: string[];
};
export type ResearchMissingReason =
  | "declined"
  | "time-limit"
  | "technical"
  | "other";
export type ResearchAnswer =
  | { answer: string }
  | { answer: null; missingReason: ResearchMissingReason };
export type ResearchFeedback = {
  clarity: number | null;
  helpfulness: number | null;
  issueCategory:
    | "none"
    | "navigation"
    | "interpretation"
    | "access"
    | "storage"
    | "other";
};
export type ResearchCompletion =
  | { completed: true }
  | { completed: false; reason: ResearchMissingReason };
export type ResearchReceipt = {
  requestId: string;
  stage: ResearchStage;
  receivedAt: string;
  protocolVersion: string;
  formVersion: string;
};
export type ResearchQuestionCard = {
  id: string;
  heading: string;
  grounding: string;
  question: string;
  sourceIds: string[];
};
export type ResearchQuestionView = {
  status: "not-started" | "inspecting" | "released" | "responded";
  inspectionInstructions: string;
  startedAt?: string;
  releaseBy?: string;
  responseBy?: string;
  question?: ResearchQuestionCard;
  response?: string;
  responseStatus?: "answered" | "declined" | "timed-out";
};
export type ResearchSessionView = {
  version: 1;
  mode: Exclude<ResearchMode, "off">;
  studyId: string;
  protocolVersion: string;
  experiment: ResearchExperiment;
  participantId: string;
  stage: ResearchStage | "complete" | "withdrawn" | "expired";
  form: ResearchForm | null;
  availableAt: string | null;
  outsidePlannedWindow: boolean;
  receipts: ResearchReceipt[];
  checkpoint: ShiftSession | null;
  lastCheckpointReceipt: ResearchReceipt | null;
  question: ResearchQuestionView;
  retentionUntil: string;
};
export type ResearchStatus = {
  version: 1;
  mode: ResearchMode;
  available: boolean;
  status: "off" | "synthetic-only" | "configured";
  note: string;
};
export type ResearchEnrollmentInput = {
  version: 1;
  requestId: string;
  syntheticId?: string;
  attestation: {
    consentVersion: string;
    consentRecorded: true;
    eligibleAdult: true;
    coordinatorReference: string;
  };
};
export type ResearchResponseInput = {
  version: 1;
  requestId: string;
  stage: ResearchStage;
  formVersion: string;
  response: ResearchAnswer | ResearchFeedback | ResearchCompletion;
};
export type ResearchCheckpointInput = {
  version: 1;
  requestId: string;
  formVersion: string;
  session: ShiftSession;
};
export type ResearchQuestionInput = {
  version: 1;
  requestId: string;
  formVersion: string;
  action: "start" | "select" | "release" | "respond" | "skip";
  inspectionCompleted?: boolean;
  allowAI?: boolean;
  response?: string;
  declined?: boolean;
};
