import { randomBytes, randomInt } from "node:crypto";
import {
  exact,
  hash,
  ResearchError,
  text,
  type ResearchConfig,
} from "./config";
import {
  RESEARCH_STAGES,
  type ResearchAnswer,
  type ResearchCompletion,
  type ResearchFeedback,
  type ResearchReceipt,
  type ResearchSessionView,
  type ResearchStage,
} from "./types";
import type {
  ResearchDatabase,
  ResearchObservation,
  ResearchParticipant,
  ResearchStore,
} from "./store";
import { LEARNING_ACTIVITIES, isShiftRunActivity } from "../course-kb/learning";
import { validateShiftSession } from "../course-kb/shift-session";
import { completedRehearsalReady } from "./rehearsal-flow";
import {
  buildResearchQuestionContext,
  fixedResearchQuestion,
  researchQuestionCard,
  validateResearchQuestionSelection,
  RESEARCH_QUESTION_POOL_VERSION,
  type ResearchModelSelection,
  type ResearchQuestionContext,
} from "./questions";
import {
  validateShiftWorkflow,
  type ShiftMapping,
} from "../course-kb/shift-run";

const activity = LEARNING_ACTIVITIES.find(isShiftRunActivity)!;
const INSPECTION =
  "Compare your saved explanation with the visible B-case source and execution trace. Identify the deciding condition, an order dependency, and what the customer could truthfully be told. Continue when you have inspected this evidence.";
const iso = (n: number) => new Date(n).toISOString();
const bytes = (x: unknown) => Buffer.byteLength(JSON.stringify(x), "utf8");
function stable(x: unknown): string {
  if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
  if (x && typeof x === "object")
    return (
      "{" +
      Object.keys(x)
        .sort()
        .map(
          (k) =>
            JSON.stringify(k) + ":" + stable((x as Record<string, unknown>)[k]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(x) ?? "null";
}
const requestId = (x: unknown) => {
  const s = text(x, 100);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(s))
    throw new ResearchError(400, "Use a bounded request identifier.");
  return s;
};
export type ResearchDependencies = {
  now?: () => number;
  condition?: () => "A" | "F";
  select?: (
    context: ResearchQuestionContext,
    signal: AbortSignal,
  ) => Promise<ResearchModelSelection>;
  propose?: (workflow: string) => Promise<{
    mapping: ShiftMapping;
    modelId: string;
    usage: unknown;
    classifiedBy: "ai";
  }>;
};
export class ResearchService {
  readonly now: () => number;
  constructor(
    readonly config: ResearchConfig,
    readonly store: ResearchStore,
    readonly deps: ResearchDependencies = {},
  ) {
    this.now = deps.now ?? Date.now;
  }
  requireParticipant(
    db: ResearchDatabase,
    token: string,
    active = true,
  ): ResearchParticipant {
    const p = db.participants.find(
      (p) =>
        p.tokenHash === hash(token) &&
        p.studyId === this.config.manifest.studyId,
    );
    if (!p)
      throw new ResearchError(401, "The participant token is not recognized.");
    if (p.fingerprint !== this.config.fingerprint)
      throw new ResearchError(
        409,
        "The frozen study version changed; contact the independent coordinator.",
      );
    if (active && (p.withdrawnAt || this.now() >= Date.parse(p.retentionUntil)))
      throw new ResearchError(
        410,
        "This study session is withdrawn or expired.",
      );
    if (active && !p.startedAt)
      throw new ResearchError(
        409,
        "Open the participant session before submitting a study stage.",
      );
    return p;
  }
  stage(p: ResearchParticipant): ResearchStage | "complete" {
    return (
      (p.experiment === "E1"
        ? (["rehearsal", "feedback"] as const)
        : RESEARCH_STAGES
      ).find((s) => !p.responses[s]) ?? "complete"
    );
  }
  currentForm(p: ResearchParticipant, version: unknown) {
    const stage = this.stage(p);
    if (
      stage === "complete" ||
      version !== this.config.manifest.forms[stage]!.version
    )
      throw new ResearchError(409, "Use the current frozen study form.");
    return stage;
  }
  dedupe(
    p: ResearchParticipant,
    id: unknown,
    operation: string,
    input: unknown,
  ): boolean {
    const key = requestId(id),
      digest = hash(stable(input)),
      existing = p.requests[key];
    if (existing) {
      if (existing.operation !== operation || existing.digest !== digest)
        throw new ResearchError(
          409,
          "A request identifier cannot be reused for different content.",
        );
      return true;
    }
    if (Object.keys(p.requests).length >= 100)
      throw new ResearchError(
        429,
        "This bounded session has reached its request limit.",
      );
    p.requests[key] = { operation, digest };
    return false;
  }
  context(p: ResearchParticipant) {
    const run = p.checkpoint?.record.runs[0],
      ex = p.checkpoint?.practice.responses["run-1"]?.committed;
    if (!run || !ex)
      throw new ResearchError(
        409,
        "Save the first accepted run and committed explanation before the evidence question.",
      );
    return buildResearchQuestionContext(
      activity,
      run,
      ex.explanation,
      ex.revisionPlan,
    );
  }
  settle(p: ResearchParticipant, force = false) {
    const q = p.question;
    if (!q) return;
    if (
      !q.releasedAt &&
      !q.respondedAt &&
      (force || this.now() >= Date.parse(q.releaseBy))
    ) {
      const valid =
        q.selectionStatus === "success" &&
        q.selected &&
        Date.parse(q.selected.receivedAt) <= Date.parse(q.deadline) &&
        Date.parse(q.selected.receivedAt) <= this.now();
      const releaseAt = Math.min(this.now(), Date.parse(q.releaseBy));
      q.question = valid
        ? q.selected!.question
        : fixedResearchQuestion(this.context(p));
      q.fallback = !valid && q.selectionStatus !== "planned-fixed";
      q.deliveryReason = valid
        ? "adaptive-selected"
        : q.selectionStatus === "planned-fixed"
          ? "planned-fixed"
          : q.selectionStatus === "declined"
            ? "optional-ai-declined"
            : this.config.mode === "synthetic"
              ? "synthetic-no-provider"
              : q.selectionStatus === "failed"
                ? "provider-or-validation-failure"
                : "not-ready-at-release";
      q.releasedAt = iso(releaseAt);
      q.deliveredAt = iso(this.now());
      q.responseBy = iso(releaseAt + 180000);
    }
    if (
      q.releasedAt &&
      !q.respondedAt &&
      this.now() >= Date.parse(q.responseBy!)
    ) {
      q.respondedAt = q.responseBy;
      q.response = "";
      q.responseStatus = "timed-out";
    }
  }
  view(p: ResearchParticipant): ResearchSessionView {
    const inactive = p.withdrawnAt
      ? "withdrawn"
      : this.now() >= Date.parse(p.retentionUntil)
        ? "expired"
        : null;
    if (!inactive) this.settle(p);
    const stage = inactive ?? this.stage(p),
      immediate = p.responses.immediate?.receipt.receivedAt;
    const availableAt =
      stage === "delayed" && immediate
        ? iso(
            Date.parse(immediate) +
              this.config.manifest.delayedMinimumSeconds * 1000,
          )
        : null;
    const outside =
      stage === "delayed" && immediate
        ? this.now() >
          Date.parse(immediate) +
            this.config.manifest.delayedMaximumSeconds * 1000
        : false;
    const q = stage === "rehearsal" ? p.question : null;
    const form =
      !p.startedAt ||
      stage === "complete" ||
      stage === "withdrawn" ||
      stage === "expired" ||
      (availableAt && this.now() < Date.parse(availableAt))
        ? null
        : this.config.manifest.forms[stage]!;
    return {
      version: 1,
      mode: this.config.mode,
      studyId: p.studyId,
      protocolVersion: p.protocolVersion,
      experiment: p.experiment,
      participantId: p.participantId,
      stage,
      form,
      availableAt,
      outsidePlannedWindow: outside,
      receipts: inactive
        ? []
        : Object.values(p.responses).map((v) => v!.receipt),
      checkpoint: stage === "rehearsal" ? p.checkpoint : null,
      lastCheckpointReceipt: stage === "rehearsal" ? p.checkpointReceipt : null,
      question: {
        status: q?.respondedAt
          ? "responded"
          : q?.releasedAt
            ? "released"
            : q
              ? "inspecting"
              : "not-started",
        inspectionInstructions: stage === "rehearsal" ? INSPECTION : "",
        ...(q ? { startedAt: q.startedAt, releaseBy: q.releaseBy } : {}),
        ...(q?.releasedAt
          ? { question: q.question, responseBy: q.responseBy }
          : {}),
        ...(q?.respondedAt
          ? { response: q.response, responseStatus: q.responseStatus }
          : {}),
      },
      retentionUntil: p.retentionUntil,
    };
  }
  async enrollment(input: unknown) {
    exact(input, ["version", "requestId", "attestation"], ["syntheticId"]);
    if (input.version !== 1)
      throw new ResearchError(400, "Unrecognized request version.");
    requestId(input.requestId);
    exact(input.attestation, [
      "consentVersion",
      "consentRecorded",
      "eligibleAdult",
      "coordinatorReference",
    ]);
    const a = input.attestation,
      m = this.config.manifest;
    if (m.studyEndsAt && this.now() >= Date.parse(m.studyEndsAt)) {
      throw new ResearchError(
        410,
        "Enrollment is closed for this reviewed study window.",
      );
    }
    if (
      m.recordsRetainUntil &&
      this.now() >= Date.parse(m.recordsRetainUntil)
    ) {
      throw new ResearchError(
        410,
        "This protocol's record-retention window has ended.",
      );
    }
    if (
      a.consentVersion !== m.consentVersion ||
      a.consentRecorded !== true ||
      a.eligibleAdult !== true
    )
      throw new ResearchError(
        403,
        "The independent coordinator must attest the approved external consent and eligibility record.",
      );
    const ref = text(a.coordinatorReference, 100);
    if (!/^coord_[A-Za-z0-9_-]{8,80}$/.test(ref))
      throw new ResearchError(
        400,
        "Use an opaque coordinator reference, never a name, email or student ID.",
      );
    let id = "p_" + randomBytes(12).toString("hex");
    if (this.config.mode === "synthetic") {
      id = text(input.syntheticId, 60);
      if (!/^synthetic-[a-z0-9-]{3,45}$/.test(id))
        throw new ResearchError(
          400,
          "Local fixtures require a synthetic-* identifier.",
        );
    } else if (input.syntheticId !== undefined)
      throw new ResearchError(
        400,
        "Live participant identifiers are generated privately.",
      );
    const token = "rp_" + randomBytes(32).toString("base64url");
    return this.store.transaction((db) => {
      const existing = db.participants.find(
        (p) =>
          p.studyId === m.studyId && p.enrollmentRequestId === input.requestId,
      );
      if (existing) {
        if (existing.enrollmentDigest !== hash(stable(input)))
          throw new ResearchError(
            409,
            "The enrollment request identifier belongs to different content.",
          );
        return {
          participantToken: null,
          session: this.view(existing),
          replayed: true,
        };
      }
      if (
        db.participants.some(
          (p) => p.participantId === id && p.studyId === m.studyId,
        )
      )
        throw new ResearchError(
          409,
          "That synthetic identifier already exists.",
        );
      const p: ResearchParticipant = {
        participantId: id,
        tokenHash: hash(token),
        enrollmentRequestId: input.requestId as string,
        enrollmentDigest: hash(stable(input)),
        studyId: m.studyId,
        protocolVersion: m.protocolVersion,
        fingerprint: this.config.fingerprint,
        experiment: m.experiment,
        assignedCondition: null,
        createdAt: iso(this.now()),
        startedAt: null,
        retentionUntil:
          m.recordsRetainUntil ?? iso(this.now() + m.retentionDays * 86400000),
        withdrawnAt: null,
        consentVersion: m.consentVersion,
        coordinatorReference: ref,
        responses: {},
        checkpoint: null,
        checkpointReceipt: null,
        question: null,
        observations: [],
        proposalAttempts: [],
        requests: {},
      };
      db.participants.push(p);
      return {
        participantToken: token,
        session: this.view(p),
        replayed: false,
      };
    });
  }
  async session(token: string) {
    return this.store.transaction((db) => {
      const p = this.requireParticipant(db, token, false);
      if (
        !p.startedAt &&
        !p.withdrawnAt &&
        this.now() < Date.parse(p.retentionUntil)
      ) {
        p.startedAt = iso(this.now());
        p.assignedCondition =
          p.experiment === "E3"
            ? (this.deps.condition?.() ?? (randomInt(2) ? "A" : "F"))
            : null;
      }
      return { session: this.view(p) };
    });
  }
  async response(token: string, input: unknown) {
    exact(input, ["version", "requestId", "stage", "formVersion", "response"]);
    if (
      input.version !== 1 ||
      !RESEARCH_STAGES.includes(input.stage as ResearchStage)
    )
      throw new ResearchError(400, "Invalid study stage.");
    return this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      if (this.dedupe(p, input.requestId, "response", input))
        return {
          session: this.view(p),
          receipt: p.responses[input.stage as ResearchStage]?.receipt,
        };
      const stage = this.currentForm(p, input.formVersion);
      if (stage !== input.stage)
        throw new ResearchError(
          409,
          "Complete the current stage before continuing.",
        );
      let value: ResearchAnswer | ResearchFeedback | ResearchCompletion;
      if (stage === "rehearsal") {
        if ((input.response as { completed?: unknown })?.completed === false) {
          exact(input.response, ["completed", "reason"]);
          if (
            !["declined", "time-limit", "technical", "other"].includes(
              input.response.reason as string,
            )
          )
            throw new ResearchError(
              400,
              "Choose the reason the rehearsal ended.",
            );
          value = {
            completed: false,
            reason: input.response.reason as "declined",
          };
          if (p.question?.selectionStatus === "pending") {
            p.question.selectionStatus = "failed";
            p.question.deliveryReason = "rehearsal-ended-before-question";
          }
        } else {
          exact(input.response, ["completed"]);
          if (
            input.response.completed !== true ||
            !completedRehearsalReady(
              p.experiment,
              p.checkpoint,
              !!p.question?.respondedAt,
            )
          )
            throw new ResearchError(
              409,
              "Save the complete rehearsal and explanations first.",
            );
          this.settle(p);
          value = { completed: true };
        }
      } else if (stage === "feedback") {
        exact(input.response, ["clarity", "helpfulness", "issueCategory"]);
        for (const k of ["clarity", "helpfulness"])
          if (
            input.response[k] !== null &&
            (!Number.isInteger(input.response[k]) ||
              Number(input.response[k]) < 1 ||
              Number(input.response[k]) > 5)
          )
            throw new ResearchError(
              400,
              "Choose a rating or leave it unanswered.",
            );
        if (
          ![
            "none",
            "navigation",
            "interpretation",
            "access",
            "storage",
            "other",
          ].includes(input.response.issueCategory as string)
        )
          throw new ResearchError(400, "Invalid issue category.");
        value = input.response as ResearchFeedback;
      } else {
        if ((input.response as { answer?: unknown })?.answer === null) {
          exact(input.response, ["answer", "missingReason"]);
          if (
            !["declined", "time-limit", "technical", "other"].includes(
              input.response.missingReason as string,
            )
          )
            throw new ResearchError(400, "Choose the missing-response reason.");
          value = {
            answer: null,
            missingReason: input.response.missingReason as "declined",
          };
        } else {
          exact(input.response, ["answer"]);
          value = { answer: text(input.response.answer, 6000) };
        }
      }
      if (stage === "delayed") {
        const received = p.responses.immediate!.receipt.receivedAt;
        if (
          this.now() <
          Date.parse(received) +
            this.config.manifest.delayedMinimumSeconds * 1000
        )
          throw new ResearchError(
            409,
            "The delayed task is not available yet.",
          );
      }
      const receipt: ResearchReceipt = {
        requestId: input.requestId as string,
        stage,
        receivedAt: iso(this.now()),
        protocolVersion: p.protocolVersion,
        formVersion: input.formVersion as string,
      };
      p.responses[stage] = { receipt, value };
      return { session: this.view(p), receipt };
    });
  }
  async checkpoint(token: string, input: unknown) {
    exact(input, ["version", "requestId", "formVersion", "session"]);
    if (input.version !== 1 || bytes(input) > 280000)
      throw new ResearchError(400, "Invalid bounded rehearsal checkpoint.");
    let snapshot;
    try {
      snapshot = validateShiftSession(input.session, activity);
    } catch {
      throw new ResearchError(
        400,
        "The checkpoint does not match the current canonical rehearsal.",
      );
    }
    return this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      if (this.dedupe(p, input.requestId, "checkpoint", input))
        return {
          session: this.view(p),
          receipt: p.requests[input.requestId as string].receipt,
        };
      if (this.currentForm(p, input.formVersion) !== "rehearsal")
        throw new ResearchError(
          409,
          "Rehearsal checkpoints are available only in that stage.",
        );
      this.settle(p);
      if (p.experiment === "E1" && snapshot.record.runs.length > 1)
        throw new ResearchError(
          409,
          "This usability route ends after version 1.",
        );
      if (
        p.experiment !== "E1" &&
        snapshot.record.runs.length > 1 &&
        !p.question?.respondedAt
      )
        throw new ResearchError(
          409,
          "Complete the common evidence question before version 2.",
        );
      if (p.checkpoint) {
        if (
          snapshot.record.runs.length < p.checkpoint.record.runs.length ||
          p.checkpoint.record.runs.some(
            (run, i) =>
              JSON.stringify(run) !== JSON.stringify(snapshot.record.runs[i]),
          )
        )
          throw new ResearchError(
            409,
            "Previously accepted runs are immutable.",
          );
        for (const [target, r] of Object.entries(
          p.checkpoint.practice.responses,
        ))
          if (
            r?.committed &&
            JSON.stringify(r) !==
              JSON.stringify(snapshot.practice.responses[target as "C"])
          )
            throw new ResearchError(
              409,
              "Previously committed explanations are immutable.",
            );
        if (
          p.checkpoint.record.nextRequest &&
          JSON.stringify(p.checkpoint.record.nextRequest) !==
            JSON.stringify(snapshot.record.nextRequest)
        )
          throw new ResearchError(
            409,
            "The frozen request cannot be rewritten.",
          );
      }
      p.checkpoint = snapshot;
      p.checkpointReceipt = {
        requestId: input.requestId as string,
        stage: "rehearsal",
        receivedAt: iso(this.now()),
        protocolVersion: p.protocolVersion,
        formVersion: input.formVersion as string,
      };
      p.requests[input.requestId as string].receipt = p.checkpointReceipt;
      return { session: this.view(p), receipt: p.checkpointReceipt };
    });
  }
  async question(token: string, input: unknown) {
    exact(
      input,
      ["version", "requestId", "formVersion", "action"],
      ["inspectionCompleted", "allowAI", "response", "declined"],
    );
    if (
      input.version !== 1 ||
      !["start", "select", "release", "respond", "skip"].includes(
        input.action as string,
      )
    )
      throw new ResearchError(400, "Invalid evidence-question action.");
    let selection: {
      context: ResearchQuestionContext;
      deadline: number;
    } | null = null;
    const first = await this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      if (this.dedupe(p, input.requestId, "question", input))
        return { session: this.view(p) };
      if (this.currentForm(p, input.formVersion) !== "rehearsal")
        throw new ResearchError(
          409,
          "The question belongs to the rehearsal stage.",
        );
      if (p.experiment === "E1")
        throw new ResearchError(
          409,
          "This usability route has no evidence question.",
        );
      this.settle(p);
      if (input.action === "skip") {
        if (p.question?.respondedAt) return { session: this.view(p) };
        if (!p.question)
          p.question = {
            startedAt: iso(this.now()),
            releaseBy: iso(this.now()),
            deadline: iso(this.now()),
            selectionStatus: "declined",
          };
        p.question.selectionStatus = "declined";
        p.question.deliveryReason = "question-opportunity-declined";
        p.question.respondedAt = iso(this.now());
        p.question.response = "";
        p.question.responseStatus = "declined";
      } else if (input.action === "start") {
        if (p.question)
          throw new ResearchError(
            409,
            "This session already has its one question opportunity.",
          );
        const context = this.context(p);
        if (
          this.config.manifest.prerequisites.questionPoolVersion !==
          context.poolVersion
        )
          throw new ResearchError(
            409,
            "The reviewed question pool version changed.",
          );
        p.question = {
          startedAt: iso(this.now()),
          releaseBy: iso(this.now() + 60000),
          deadline: iso(this.now() + 30000),
          selectionStatus:
            p.assignedCondition === "F"
              ? "planned-fixed"
              : input.allowAI === false
                ? "declined"
                : "not-requested",
        };
      } else {
        const q = p.question;
        if (!q)
          throw new ResearchError(409, "Start the common inspection first.");
        if (input.action === "select") {
          if (q.selectionStatus !== "not-requested" || q.releasedAt)
            return { session: this.view(p) };
          if (this.now() >= Date.parse(q.deadline)) {
            q.selectionStatus = "failed";
            q.deliveryReason = "selection-deadline-passed";
            return { session: this.view(p) };
          }
          q.selectionStatus = "pending";
          if (
            (this.config.mode === "synthetic" && !this.deps.select) ||
            !this.deps.select
          ) {
            q.selectionStatus = "failed";
          } else
            selection = {
              context: this.context(p),
              deadline: Date.parse(q.deadline),
            };
        } else if (input.action === "release") {
          if (
            input.inspectionCompleted !== true &&
            this.now() < Date.parse(q.releaseBy)
          )
            throw new ResearchError(
              409,
              "Inspect the source and trace before continuing.",
            );
          this.settle(p, true);
        } else {
          if (!q.releasedAt)
            throw new ResearchError(409, "The question has not been released.");
          if (!q.respondedAt) {
            if (input.declined !== true) text(input.response, 1500);
            q.response =
              input.declined === true ? "" : (input.response as string);
            q.responseStatus =
              input.declined === true ? "declined" : "answered";
            q.respondedAt = iso(this.now());
          }
        }
      }
      return { session: this.view(p) };
    });
    if (!selection) return first;
    const { context, deadline } = selection as {
      context: ResearchQuestionContext;
      deadline: number;
    };
    let result: ResearchModelSelection | undefined;
    try {
      const candidate = await this.deps.select!(
        context,
        AbortSignal.timeout(Math.max(1, deadline - this.now())),
      );
      validateResearchQuestionSelection(
        {
          questionId: candidate.questionId,
          learnerQuote: candidate.learnerQuote,
        },
        context,
      );
      result = candidate;
    } catch {
      /* No provider content or secret-bearing error is logged. */
    }
    return this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      const q = p.question!;
      if (
        q.selectionStatus === "pending" &&
        !q.releasedAt &&
        this.now() <= Date.parse(q.deadline) &&
        result
      ) {
        q.selectionStatus = "success";
        q.selected = {
          question: researchQuestionCard(context, result.questionId),
          learnerQuote: result.learnerQuote,
          modelId: result.modelId,
          usage: result.usage,
          receivedAt: iso(this.now()),
        };
      } else if (q.selectionStatus === "pending") q.selectionStatus = "failed";
      return { session: this.view(p) };
    });
  }
  async proposal(token: string, input: unknown) {
    exact(input, [
      "version",
      "requestId",
      "formVersion",
      "run",
      "activityRevision",
      "workflow",
    ]);
    if (
      input.version !== 1 ||
      ![1, 2].includes(Number(input.run)) ||
      input.activityRevision !== activity.activityRevision
    )
      throw new ResearchError(400, "Invalid proposal request.");
    validateShiftWorkflow(input.workflow);
    const early = await this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      if (this.currentForm(p, input.formVersion) !== "rehearsal")
        throw new ResearchError(
          409,
          "Proposals are restricted to the rehearsal.",
        );
      if (input.run !== (p.checkpoint?.record.runs.length ?? 0) + 1)
        throw new ResearchError(409, "Use the current workflow version.");
      if (input.run === 2 && p.experiment === "E1")
        throw new ResearchError(
          409,
          "This usability route ends after version 1.",
        );
      if (input.run === 2 && !p.question?.respondedAt)
        throw new ResearchError(409, "Finish the common question first.");
      const previous = p.proposalAttempts.find((a) => a.run === input.run);
      this.dedupe(p, input.requestId, "proposal", input);
      if (previous) {
        if (previous.requestId !== input.requestId)
          throw new ResearchError(
            409,
            "One proposal attempt is allowed for this workflow version.",
          );
        return previous;
      }
      const attempt = {
        run: input.run as 1 | 2,
        requestId: input.requestId as string,
        status: "reserved" as const,
      };
      p.proposalAttempts.push(attempt);
      return null;
    });
    if (early?.response) return early.response;
    if (early || this.config.mode === "synthetic" || !this.deps.propose)
      throw new ResearchError(
        503,
        "AI interpretation is unavailable; use the same manual editor.",
      );
    let result;
    try {
      result = await this.deps.propose(input.workflow as string);
    } catch {
      await this.store.transaction((db) => {
        const p = this.requireParticipant(db, token);
        p.proposalAttempts.find((a) => a.run === input.run)!.status = "failed";
      });
      throw new ResearchError(
        503,
        "AI interpretation is unavailable; use the same manual editor.",
      );
    }
    await this.store.transaction((db) => {
      const p = this.requireParticipant(db, token);
      const a = p.proposalAttempts.find((a) => a.run === input.run)!;
      a.status = "complete";
      a.response = result;
    });
    return result;
  }
  async withdraw(token: string, input: unknown) {
    exact(input, ["version", "requestId", "deleteData"]);
    if (input.version !== 1 || input.deleteData !== true)
      throw new ResearchError(
        400,
        "Explicitly request withdrawal and deletion.",
      );
    return this.store.transaction((db) => {
      const p = this.requireParticipant(db, token, false);
      requestId(input.requestId);
      p.withdrawnAt = p.withdrawnAt ?? iso(this.now());
      p.responses = {};
      p.checkpoint = null;
      p.checkpointReceipt = null;
      p.question = null;
      p.observations = [];
      p.proposalAttempts = [];
      p.requests = {};
      return { session: this.view(p), deleted: true };
    });
  }
  async export(scope: "scoring" | "analysis") {
    if (
      scope === "analysis" &&
      this.now() < Date.parse(this.config.manifest.gradingReleasedAt)
    )
      throw new ResearchError(
        403,
        "Unmasked analysis export is held until the reviewed grading-release date.",
      );
    return this.store.transaction((db) => {
      const records = db.participants.filter(
        (p) =>
          p.studyId === this.config.manifest.studyId &&
          !p.withdrawnAt &&
          this.now() < Date.parse(p.retentionUntil),
      );
      if (records.some((p) => p.fingerprint !== this.config.fingerprint))
        throw new ResearchError(
          409,
          "Export each frozen protocol with its matching manifest; mixed versions cannot be relabeled.",
        );
      return {
        version: 1,
        studyId: this.config.manifest.studyId,
        protocolVersion: this.config.manifest.protocolVersion,
        experiment: this.config.manifest.experiment,
        frozenArtifacts: this.config.manifest.freeze ?? null,
        mode: this.config.mode,
        scope,
        exportedAt: iso(this.now()),
        participants: records.map((p) =>
          scope === "scoring"
            ? {
                participantId: p.participantId,
                responses: (["baseline", "immediate", "delayed"] as const)
                  .filter(
                    (s) =>
                      p.responses[s] &&
                      "answer" in p.responses[s]!.value &&
                      typeof (p.responses[s]!.value as ResearchAnswer)
                        .answer === "string",
                  )
                  .map((s) => ({
                    stage: s,
                    formId: this.config.manifest.forms[s]!.id,
                    formVersion: p.responses[s]!.receipt.formVersion,
                    receivedAt: p.responses[s]!.receipt.receivedAt,
                    response: p.responses[s]!.value,
                  })),
              }
            : {
                participantId: p.participantId,
                status: this.stage(p),
                assignedCondition: p.assignedCondition,
                createdAt: p.createdAt,
                startedAt: p.startedAt,
                retentionUntil: p.retentionUntil,
                responses: p.responses,
                checkpoint: p.checkpoint,
                question: p.question,
                observations: p.observations,
                proposalAttempts: p.proposalAttempts.map(({ run, status }) => ({
                  run,
                  status,
                })),
              },
        ),
      };
    });
  }
  async observation(input: unknown) {
    exact(input, [
      "version",
      "action",
      "requestId",
      "participantId",
      "taskReached",
      "assistanceCategory",
      "staffMinutes",
      "workLossAssessed",
      "workLost",
      "interruption",
      "accommodationNoted",
    ]);
    if (
      input.version !== 1 ||
      input.action !== "observation" ||
      ![
        "start",
        "inspect",
        "confirm",
        "explain",
        "revise",
        "C",
        "export",
        "finished",
      ].includes(input.taskReached as string) ||
      !["none", "navigation", "interpretation", "access", "technical"].includes(
        input.assistanceCategory as string,
      ) ||
      typeof input.staffMinutes !== "number" ||
      !Number.isFinite(input.staffMinutes) ||
      input.staffMinutes < 0 ||
      input.staffMinutes > 240 ||
      typeof input.workLossAssessed !== "boolean" ||
      typeof input.interruption !== "boolean" ||
      typeof input.accommodationNoted !== "boolean" ||
      (input.workLost !== null && typeof input.workLost !== "boolean") ||
      (!input.workLossAssessed && input.workLost !== null)
    )
      throw new ResearchError(
        400,
        "Invalid structured facilitator observation.",
      );
    return this.store.transaction((db) => {
      const p = db.participants.find(
        (p) =>
          p.studyId === this.config.manifest.studyId &&
          p.participantId === input.participantId,
      );
      if (!p || p.withdrawnAt || this.now() >= Date.parse(p.retentionUntil))
        throw new ResearchError(404, "No active session found.");
      if (this.dedupe(p, input.requestId, "observation", input))
        return { received: true };
      if (p.observations.length >= 20)
        throw new ResearchError(429, "Observation limit reached.");
      const { version, action, ...fields } = input;
      void version;
      void action;
      p.observations.push({
        ...fields,
        receivedAt: iso(this.now()),
      } as ResearchObservation);
      return { received: true, receivedAt: iso(this.now()) };
    });
  }
  async purge(input: unknown) {
    exact(input, ["version", "action"], ["participantId"]);
    if (
      input.version !== 1 ||
      !["purge-expired", "delete-participant"].includes(input.action as string)
    )
      throw new ResearchError(400, "Invalid purge operation.");
    if (input.action === "delete-participant") text(input.participantId, 80);
    return this.store.transaction((db) => {
      const before = db.participants.length;
      db.participants = db.participants.filter(
        (p) =>
          p.studyId !== this.config.manifest.studyId ||
          (input.action === "delete-participant"
            ? p.participantId !== input.participantId
            : this.now() < Date.parse(p.retentionUntil)),
      );
      return { deleted: before - db.participants.length };
    });
  }
  async rotate(input: unknown) {
    exact(input, ["version", "action", "participantId"]);
    if (input.version !== 1 || input.action !== "rotate-token")
      throw new ResearchError(400, "Invalid coordinator operation.");
    const token = "rp_" + randomBytes(32).toString("base64url");
    return this.store.transaction((db) => {
      const p = db.participants.find(
        (p) =>
          p.studyId === this.config.manifest.studyId &&
          p.participantId === input.participantId,
      );
      if (!p || p.withdrawnAt || this.now() >= Date.parse(p.retentionUntil))
        throw new ResearchError(404, "No active session found.");
      p.tokenHash = hash(token);
      return { participantToken: token, session: this.view(p) };
    });
  }
}
export { RESEARCH_QUESTION_POOL_VERSION };
