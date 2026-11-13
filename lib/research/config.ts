import { createHash, timingSafeEqual } from "node:crypto";
import type { ResearchExperiment, ResearchForm, ResearchStatus } from "./types";
import { COURSE_KB_META } from "../course-kb/generated";
import { LEARNING_ACTIVITIES, isShiftRunActivity } from "../course-kb/learning";
import {
  researchQuestionArtifacts,
  RESEARCH_QUESTION_POOL_VERSION,
  RESEARCH_QUESTION_SELECTOR_VERSION,
  RESEARCH_QUESTION_REVIEW_STATUS,
} from "./questions";

export class ResearchError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export type ResearchFreeze = {
  courseDigest: string;
  activityFingerprint: string;
  engineCommit: string;
  activityRevision: number;
  questionArtifactsFingerprint: string;
  questionPoolVersion: string;
  selectorVersion: string;
  modelId: string;
  formsFingerprint: string;
};
export type ResearchManifest = {
  version: 1;
  studyId: string;
  protocolVersion: string;
  consentVersion: string;
  experiment: ResearchExperiment;
  approvalReference: string;
  reviewedAt: string;
  staff: {
    coordinator: string;
    reviewers: string[];
    coders: string[];
    methodologist: string;
  };
  /** Relative days are a synthetic-fixture fallback, never the live retention clock. */
  retentionDays: number;
  studyEndsAt?: string;
  recordsRetainUntil?: string;
  withdrawalPolicy: "delete-on-request";
  gradingReleasedAt: string;
  delayedMinimumSeconds: number;
  delayedMaximumSeconds: number;
  prerequisites: {
    E0: string;
    E1: string;
    E2: string;
    questionPoolVersion: string;
  };
  forms: {
    rehearsal: ResearchForm;
    feedback: ResearchForm;
    baseline?: ResearchForm;
    immediate?: ResearchForm;
    delayed?: ResearchForm;
  };
  freeze?: ResearchFreeze;
};
export type ResearchConfig = {
  mode: "synthetic" | "live";
  manifest: ResearchManifest;
  fingerprint: string;
  coordinatorToken: string;
  scorerToken: string;
  analystToken: string;
  purgeToken: string;
  filePath?: string;
  databaseUrl?: string;
};
// Review and deliberately change this source gate in a separate release after
// the institution approves the protocol, storage, staffing and consent flow.
const LIVE_RESEARCH_RELEASE = false;
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
export function exact(
  x: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): asserts x is Record<string, unknown> {
  if (
    !object(x) ||
    required.some((k) => !Object.hasOwn(x, k)) ||
    Object.keys(x).some((k) => !required.includes(k) && !optional.includes(k))
  )
    throw new ResearchError(400, "Unrecognized request fields.");
}
export function text(x: unknown, max: number, min = 1): string {
  if (typeof x !== "string" || x.length > max || x.trim().length < min)
    throw new ResearchError(400, "A required text field has invalid bounds.");
  return x;
}
export function date(x: unknown): string {
  const s = text(x, 50);
  if (!Number.isFinite(Date.parse(s)))
    throw new ResearchError(400, "A date is invalid.");
  return new Date(s).toISOString();
}
function retentionDate(x: unknown): string {
  const raw = text(x, 50);
  const match =
    /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      raw,
    );
  if (
    !match ||
    !Number.isFinite(Date.parse(raw)) ||
    new Date(match[1] + "T00:00:00Z").toISOString().slice(0, 10) !== match[1]
  ) {
    throw new ResearchError(
      400,
      "Retention dates need a valid calendar date and explicit ISO time zone.",
    );
  }
  return date(raw);
}
export function hash(x: string) {
  return createHash("sha256").update(x).digest("hex");
}
export function tokenMatches(actual: string, expected: string) {
  const a = Buffer.from(hash(actual)),
    b = Buffer.from(hash(expected));
  return timingSafeEqual(a, b);
}
function form(x: unknown): ResearchForm {
  exact(x, [
    "id",
    "version",
    "title",
    "instructions",
    "responsePrompt",
    "sources",
    "trace",
  ]);
  if (
    !Array.isArray(x.sources) ||
    x.sources.length > 12 ||
    !Array.isArray(x.trace) ||
    x.trace.length > 50
  )
    throw new ResearchError(400, "Invalid form packet.");
  return {
    id: text(x.id, 100),
    version: text(x.version, 100),
    title: text(x.title, 200),
    instructions: text(x.instructions, 8000),
    responsePrompt: text(x.responsePrompt, 4000),
    sources: x.sources.map((s) => {
      exact(s, ["id", "label", "text"]);
      return {
        id: text(s.id, 100),
        label: text(s.label, 200),
        text: text(s.text, 8000),
      };
    }),
    trace: x.trace.map((s) => text(s, 2000)),
  };
}
export function validateResearchManifest(
  x: unknown,
  live = true,
): ResearchManifest {
  exact(
    x,
    [
      "version",
      "studyId",
      "protocolVersion",
      "consentVersion",
      "experiment",
      "approvalReference",
      "reviewedAt",
      "staff",
      "retentionDays",
      "withdrawalPolicy",
      "gradingReleasedAt",
      "delayedMinimumSeconds",
      "delayedMaximumSeconds",
      "prerequisites",
      "forms",
    ],
    ["freeze", "studyEndsAt", "recordsRetainUntil"],
  );
  if (
    x.version !== 1 ||
    !["E1", "E2", "E3"].includes(x.experiment as string) ||
    x.withdrawalPolicy !== "delete-on-request" ||
    !Number.isInteger(x.retentionDays) ||
    Number(x.retentionDays) < 1 ||
    Number(x.retentionDays) > 3650 ||
    !Number.isInteger(x.delayedMinimumSeconds) ||
    Number(x.delayedMinimumSeconds) < 0 ||
    !Number.isInteger(x.delayedMaximumSeconds) ||
    Number(x.delayedMaximumSeconds) < Number(x.delayedMinimumSeconds)
  )
    throw new ResearchError(400, "Invalid reviewed protocol configuration.");
  exact(x.staff, ["coordinator", "reviewers", "coders", "methodologist"]);
  exact(x.prerequisites, ["E0", "E1", "E2", "questionPoolVersion"]);
  if (x.experiment === "E1")
    exact(
      x.forms,
      ["rehearsal", "feedback"],
      ["baseline", "immediate", "delayed"],
    );
  else
    exact(x.forms, [
      "baseline",
      "rehearsal",
      "immediate",
      "delayed",
      "feedback",
    ]);
  if (
    !Array.isArray(x.staff.reviewers) ||
    x.staff.reviewers.length < 2 ||
    !Array.isArray(x.staff.coders) ||
    (x.experiment !== "E1" && x.staff.coders.length < 2)
  )
    throw new ResearchError(
      400,
      "Independent review and required scoring roles must be configured.",
    );
  const staff = {
    coordinator: text(x.staff.coordinator, 200),
    reviewers: x.staff.reviewers.map((v) => text(v, 200)),
    coders: x.staff.coders.map((v) => text(v, 200)),
    methodologist: text(
      x.staff.methodologist,
      200,
      x.experiment === "E1" ? 0 : 1,
    ),
  };
  if (
    (x.experiment !== "E1" && new Set(staff.coders).size < 2) ||
    new Set(staff.reviewers).size < 2
  )
    throw new ResearchError(400, "Independent roles must be distinct.");
  const forms = {
    rehearsal: form(x.forms.rehearsal),
    feedback: form(x.forms.feedback),
    ...(x.forms.baseline ? { baseline: form(x.forms.baseline) } : {}),
    ...(x.forms.immediate ? { immediate: form(x.forms.immediate) } : {}),
    ...(x.forms.delayed ? { delayed: form(x.forms.delayed) } : {}),
  };
  const result: ResearchManifest = {
    version: 1,
    studyId: text(x.studyId, 100),
    protocolVersion: text(x.protocolVersion, 100),
    consentVersion: text(x.consentVersion, 100),
    experiment: x.experiment as ResearchExperiment,
    approvalReference: text(x.approvalReference, 300),
    reviewedAt: date(x.reviewedAt),
    staff,
    retentionDays: Number(x.retentionDays),
    withdrawalPolicy: "delete-on-request",
    gradingReleasedAt: date(x.gradingReleasedAt),
    delayedMinimumSeconds: Number(x.delayedMinimumSeconds),
    delayedMaximumSeconds: Number(x.delayedMaximumSeconds),
    prerequisites: {
      E0: text(x.prerequisites.E0, 300),
      E1: text(x.prerequisites.E1, 300, x.experiment === "E1" ? 0 : 1),
      E2: text(x.prerequisites.E2, 300, x.experiment === "E3" ? 1 : 0),
      questionPoolVersion: text(x.prerequisites.questionPoolVersion, 100),
    },
    forms,
  };
  if ((x.studyEndsAt === undefined) !== (x.recordsRetainUntil === undefined)) {
    throw new ResearchError(
      400,
      "Specify both the study close and record-retention cutoff.",
    );
  }
  if (x.studyEndsAt !== undefined) {
    result.studyEndsAt = retentionDate(x.studyEndsAt);
    result.recordsRetainUntil = retentionDate(x.recordsRetainUntil);
    const end = Date.parse(result.studyEndsAt);
    const cutoff = Date.parse(result.recordsRetainUntil);
    const maximum = new Date(end);
    maximum.setUTCFullYear(maximum.getUTCFullYear() + 10);
    if (cutoff <= end || cutoff > maximum.getTime()) {
      throw new ResearchError(
        400,
        "Record retention must end after study close and within ten calendar years.",
      );
    }
  }
  if (live && (!result.studyEndsAt || !result.recordsRetainUntil)) {
    throw new ResearchError(
      503,
      "Live research requires explicit reviewed study-close and record-retention dates.",
    );
  }
  if (x.freeze !== undefined) {
    exact(x.freeze, [
      "courseDigest",
      "activityFingerprint",
      "engineCommit",
      "activityRevision",
      "questionArtifactsFingerprint",
      "questionPoolVersion",
      "selectorVersion",
      "modelId",
      "formsFingerprint",
    ]);
    if (x.freeze.activityRevision !== 3)
      throw new ResearchError(400, "The frozen activity revision is invalid.");
    result.freeze = {
      courseDigest: text(x.freeze.courseDigest, 100),
      activityFingerprint: text(x.freeze.activityFingerprint, 100),
      engineCommit: text(x.freeze.engineCommit, 100),
      activityRevision: 3,
      questionArtifactsFingerprint: text(
        x.freeze.questionArtifactsFingerprint,
        100,
      ),
      questionPoolVersion: text(x.freeze.questionPoolVersion, 100),
      selectorVersion: text(x.freeze.selectorVersion, 100),
      modelId: text(x.freeze.modelId, 200),
      formsFingerprint: text(x.freeze.formsFingerprint, 100),
    };
  }
  if (
    live &&
    (/synthetic|example|placeholder|not-approved|pending/i.test(
      result.approvalReference,
    ) ||
      /synthetic|example|placeholder/i.test(result.studyId) ||
      (result.experiment !== "E1" && result.delayedMinimumSeconds < 86400) ||
      Date.parse(result.reviewedAt) > Date.now())
  )
    throw new ResearchError(503, "Reviewed live configuration is not ready.");
  if (
    new Set(Object.values(result.forms).map((f) => f.id)).size !==
    Object.keys(result.forms).length
  )
    throw new ResearchError(400, "Study forms must have distinct identifiers.");
  return result;
}
export function syntheticResearchManifest(): ResearchManifest {
  const make = (stage: string): ResearchForm => ({
    id: `synthetic-${stage}`,
    version: "synthetic-form-v1",
    title: `SYNTHETIC ${stage} — not a research instrument`,
    instructions:
      "Use fictional test text only. This local fixture is not a participant assessment or a validated instrument.",
    responsePrompt:
      stage === "rehearsal"
        ? "Complete the fictional Unit 4 rehearsal; explicitly save its checkpoint and final completion."
        : "Explain a fictional workflow decision using the supplied practice packet.",
    sources: [
      {
        id: "synthetic-source",
        label: "Invented practice condition",
        text: "This is an authored synthetic fixture, not a real workplace policy.",
      },
    ],
    trace: [
      "Synthetic observation: a draft was prepared; no external action was performed.",
    ],
  });
  return validateResearchManifest(
    {
      version: 1,
      studyId: "synthetic-workflow-study",
      protocolVersion: "synthetic-v1",
      consentVersion: "synthetic-consent-not-approval",
      experiment: "E3",
      approvalReference: "synthetic-not-approved",
      reviewedAt: "2026-01-01T00:00:00Z",
      staff: {
        coordinator: "synthetic-coordinator",
        reviewers: ["synthetic-reviewer-1", "synthetic-reviewer-2"],
        coders: ["synthetic-coder-1", "synthetic-coder-2"],
        methodologist: "synthetic-methodologist",
      },
      retentionDays: 1,
      withdrawalPolicy: "delete-on-request",
      gradingReleasedAt: "2026-01-01T00:00:00Z",
      delayedMinimumSeconds: 0,
      delayedMaximumSeconds: 3600,
      prerequisites: {
        E0: "synthetic-unvalidated",
        E1: "synthetic-not-run",
        E2: "synthetic-not-run",
        questionPoolVersion: RESEARCH_QUESTION_POOL_VERSION,
      },
      forms: {
        baseline: make("baseline"),
        rehearsal: make("rehearsal"),
        immediate: make("immediate"),
        delayed: make("delayed"),
        feedback: make("feedback"),
      },
    },
    false,
  );
}
export function researchConfig(
  env: Record<string, string | undefined> = process.env,
  url?: string,
): ResearchConfig | null {
  if (!env.RESEARCH_MODE || env.RESEARCH_MODE === "off") return null;
  const keys = [
    "RESEARCH_COORDINATOR_TOKEN",
    "RESEARCH_SCORER_TOKEN",
    "RESEARCH_ANALYST_TOKEN",
    "RESEARCH_PURGE_TOKEN",
  ] as const;
  const tokens = keys.map((k) => env[k] ?? "");
  if (tokens.some((t) => t.length < 32) || new Set(tokens).size !== 4)
    throw new ResearchError(503, "Research access is not configured.");
  if (env.RESEARCH_MODE === "synthetic") {
    const host = url ? new URL(url).hostname.replace(/^\[|\]$/g, "") : "";
    if (
      env.VERCEL ||
      !["development", "test"].includes(env.NODE_ENV ?? "") ||
      env.RESEARCH_SYNTHETIC_ENABLED !== "1" ||
      (url && !["localhost", "127.0.0.1", "::1"].includes(host)) ||
      !env.RESEARCH_SYNTHETIC_STORE?.startsWith("/")
    )
      throw new ResearchError(
        503,
        "Synthetic collection is restricted to explicitly enabled local development.",
      );
    const manifest = env.RESEARCH_SYNTHETIC_MANIFEST_JSON
      ? validateResearchManifest(
          JSON.parse(env.RESEARCH_SYNTHETIC_MANIFEST_JSON),
          false,
        )
      : syntheticResearchManifest();
    if (!manifest.freeze)
      manifest.freeze = researchFreeze(
        manifest,
        "synthetic-no-model",
        "local-synthetic",
      );
    return {
      mode: "synthetic",
      manifest,
      fingerprint: hash(JSON.stringify(manifest)),
      coordinatorToken: tokens[0],
      scorerToken: tokens[1],
      analystToken: tokens[2],
      purgeToken: tokens[3],
      filePath: env.RESEARCH_SYNTHETIC_STORE,
    };
  }
  if (
    env.RESEARCH_MODE !== "live" ||
    env.RESEARCH_ENABLED !== "reviewed-live-collection" ||
    !env.RESEARCH_REVIEWED_MANIFEST_JSON ||
    !env.RESEARCH_DATABASE_URL
  )
    throw new ResearchError(503, "Live research is not enabled.");
  let manifest: ResearchManifest;
  try {
    manifest = validateResearchManifest(
      JSON.parse(env.RESEARCH_REVIEWED_MANIFEST_JSON),
    );
  } catch {
    throw new ResearchError(503, "Reviewed live configuration is not ready.");
  }
  const modelId = env.RESEARCH_MODEL;
  if (
    !modelId ||
    !env.VERCEL_GIT_COMMIT_SHA ||
    !manifest.freeze ||
    JSON.stringify(manifest.freeze) !==
      JSON.stringify(
        researchFreeze(manifest, modelId, env.VERCEL_GIT_COMMIT_SHA),
      ) ||
    manifest.prerequisites.questionPoolVersion !==
      RESEARCH_QUESTION_POOL_VERSION
  )
    throw new ResearchError(
      503,
      "Frozen research artifacts do not match the runtime.",
    );
  if (
    manifest.experiment === "E3" &&
    String(RESEARCH_QUESTION_REVIEW_STATUS) !== "independently-reviewed"
  )
    throw new ResearchError(
      503,
      "The provisional question pool is not eligible for live E3 collection.",
    );
  const db = new URL(env.RESEARCH_DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(db.protocol))
    throw new ResearchError(503, "Private research storage is not configured.");
  if (!LIVE_RESEARCH_RELEASE)
    throw new ResearchError(
      503,
      "Live research collection awaits a reviewed source release.",
    );
  return {
    mode: "live",
    manifest,
    fingerprint: hash(JSON.stringify(manifest)),
    coordinatorToken: tokens[0],
    scorerToken: tokens[1],
    analystToken: tokens[2],
    purgeToken: tokens[3],
    databaseUrl: env.RESEARCH_DATABASE_URL,
  };
}
export function researchFreeze(
  manifest: ResearchManifest,
  modelId: string,
  engineCommit: string,
): ResearchFreeze {
  const activity = LEARNING_ACTIVITIES.find(isShiftRunActivity)!;
  return {
    courseDigest: COURSE_KB_META.sourceDigest,
    activityFingerprint: hash(JSON.stringify(activity)),
    engineCommit,
    activityRevision: activity.activityRevision,
    questionArtifactsFingerprint: hash(
      JSON.stringify(researchQuestionArtifacts()),
    ),
    questionPoolVersion: RESEARCH_QUESTION_POOL_VERSION,
    selectorVersion: RESEARCH_QUESTION_SELECTOR_VERSION,
    modelId,
    formsFingerprint: hash(JSON.stringify(manifest.forms)),
  };
}
export function researchStatus(config: ResearchConfig | null): ResearchStatus {
  return {
    version: 1,
    mode: config?.mode ?? "off",
    available: !!config,
    status:
      config?.mode === "synthetic"
        ? "synthetic-only"
        : config
          ? "configured"
          : "off",
    note:
      config?.mode === "synthetic"
        ? "Local synthetic fixtures only; no approval, validated forms or participant collection."
        : config
          ? "Private protocol configuration supplied; software does not verify institutional approval or consent records."
          : "Research collection is off.",
  };
}
