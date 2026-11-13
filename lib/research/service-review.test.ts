/** Independent service regressions. Fictional records, private temp files,
 * injected clocks and model doubles only; no provider, learner or deployment. */
import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import activities from "../../public/teaching/ai-solutions/assets/ta-activities.json" with { type: "json" };
import {
  blankShiftSession,
  validateShiftSession,
  type ShiftSession,
} from "../course-kb/shift-session";
import {
  commitShiftExplanation,
  updateShiftExplanation,
} from "../course-kb/shift-practice";
import {
  recordNextRequest,
  recordShiftRun,
  type ShiftRunActivity,
} from "../course-kb/shift-run";
import {
  hash,
  ResearchError,
  researchConfig,
  researchFreeze,
  syntheticResearchManifest,
  validateResearchManifest,
  type ResearchConfig,
} from "./config";
import {
  RESEARCH_QUESTION_POOL_VERSION,
  fixedResearchQuestion,
  type ResearchModelSelection,
  type ResearchQuestionContext,
} from "./questions";
import { ResearchService, type ResearchDependencies } from "./service";
import { FileResearchStore } from "./store";
import type { ResearchExperiment, ResearchStage } from "./types";

const activity = activities.find(
  (value) => value.unit === 4,
) as unknown as ShiftRunActivity;
const rehearsalCanary = "SYNTHETIC-PRIVATE-REHEARSAL-TEXT";
const baselineCanary = "SYNTHETIC-BASELINE-RESPONSE";
const immediateCanary = "SYNTHETIC-IMMEDIATE-RESPONSE";
function episode(complete = false): ShiftSession {
  let session = blankShiftSession(activity);
  const workflow = "Read the request.",
    mapping = [
      { step: 1, actions: [{ type: "intake" as const, quote: workflow }] },
    ];
  for (const number of complete ? [1, 2] : [1]) {
    const record = recordShiftRun(activity, session.record, {
      workflow,
      mapping,
      reason:
        number === 2
          ? "Retain the initial fictional step for this synthetic storage fixture."
          : "",
      classifiedBy: "student",
      acceptance: { confirmed: true, origin: "student" },
    });
    const target = number === 1 ? "run-1" : "run-2";
    let practice = updateShiftExplanation(
      session.practice,
      target,
      {
        explanation: `${rehearsalCanary} ${number}: The trace records no draft; I would inspect the missing action.`,
        revisionPlan: "Inspect the recorded order.",
      },
      activity,
      record,
    );
    practice = commitShiftExplanation(practice, target, activity, record);
    session = { ...session, workflow, record, practice };
  }
  if (complete) {
    const record = recordNextRequest(activity, session.record);
    let practice = updateShiftExplanation(
      session.practice,
      "C",
      {
        explanation: `${rehearsalCanary} C: This uses the frozen second mapping.`,
        revisionPlan: "Keep the source check explicit.",
      },
      activity,
      record,
    );
    practice = commitShiftExplanation(practice, "C", activity, record);
    session = { ...session, record, practice };
  }
  return validateShiftSession(session, activity);
}

async function fixture(
  t: TestContext,
  options: {
    condition?: "A" | "F";
    experiment?: ResearchExperiment;
    select?: ResearchDependencies["select"];
    delayedInstructions?: string;
  } = {},
) {
  const directory = await mkdtemp(
    join(tmpdir(), "ai-research-service-review-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = syntheticResearchManifest();
  manifest.experiment = options.experiment ?? "E3";
  manifest.prerequisites.questionPoolVersion = RESEARCH_QUESTION_POOL_VERSION;
  manifest.delayedMinimumSeconds = 60;
  manifest.delayedMaximumSeconds = 120;
  if (options.delayedInstructions) {
    assert(manifest.forms.delayed);
    manifest.forms.delayed.instructions = options.delayedInstructions;
  }
  manifest.freeze = researchFreeze(
    manifest,
    "test/mock-selector",
    "synthetic-engine-commit",
  );
  const config: ResearchConfig = {
    mode: "synthetic",
    manifest,
    fingerprint: hash(JSON.stringify(manifest)),
    coordinatorToken: "test-coordinator-token".repeat(3),
    scorerToken: "test-scorer-token".repeat(3),
    analystToken: "test-analyst-token".repeat(3),
    purgeToken: "test-purge-token".repeat(3),
    filePath: join(directory, "synthetic-only.json"),
  };
  let now = Date.parse("2026-11-12T12:00:00Z"),
    calls = 0,
    sequence = 0;
  const store = new FileResearchStore(config.filePath!);
  const service = new ResearchService(config, store, {
    now: () => now,
    condition: () => options.condition ?? "A",
    ...(options.select
      ? {
          select: async (...args) => {
            calls++;
            return options.select!(...args);
          },
        }
      : {}),
  });
  const id = () => `review-request-${String(++sequence).padStart(5, "0")}`;
  const enrolled = await service.enrollment({
    version: 1,
    requestId: id(),
    syntheticId: "synthetic-review-fixture",
    attestation: {
      consentVersion: manifest.consentVersion,
      consentRecorded: true,
      eligibleAdult: true,
      coordinatorReference: "coord_review_fixture_001",
    },
  });
  assert.equal(typeof enrolled.participantToken, "string");
  const token = enrolled.participantToken!;
  const response = async (stage: ResearchStage, value: unknown) => {
    const form = manifest.forms[stage];
    assert(form, `The fixture must supply its ${stage} packet.`);
    return service.response(token, {
      version: 1,
      requestId: id(),
      stage,
      formVersion: form.version,
      response: value,
    });
  };
  const checkpoint = async (session: ShiftSession) =>
    service.checkpoint(token, {
      version: 1,
      requestId: id(),
      formVersion: manifest.forms.rehearsal.version,
      session,
    });
  const question = async (
    action: "start" | "select" | "release" | "respond",
    extra = {},
  ) =>
    service.question(token, {
      version: 1,
      requestId: id(),
      formVersion: manifest.forms.rehearsal.version,
      action,
      ...extra,
    });
  const enterRehearsal = async () => {
    await service.session(token);
    if (manifest.experiment !== "E1")
      await response("baseline", { answer: baselineCanary });
    await checkpoint(episode());
  };
  const finishRehearsal = async () => {
    if (manifest.experiment === "E3") {
      await question("start", { allowAI: false });
      await question("release", { inspectionCompleted: true });
      await question("respond", { declined: true });
    }
    await checkpoint(episode(true));
    return response("rehearsal", { completed: true });
  };
  return {
    manifest,
    config,
    service,
    store,
    token,
    enrolled,
    id,
    response,
    checkpoint,
    question,
    enterRehearsal,
    finishRehearsal,
    advance: (ms: number) => {
      now += ms;
    },
    calls: () => calls,
  };
}

test("coordinator code issue exposes no task and assigns only on the first participant entry", async (t) => {
  const f = await fixture(t);
  assert.equal(f.enrolled.session.form, null);
  const before = await f.store.transaction((db) => db.participants[0]);
  assert.equal(before.assignedCondition, null);
  assert.equal(before.startedAt, null);
  f.advance(5000);
  const first = (await f.service.session(f.token)).session;
  assert.equal(first.stage, "baseline");
  assert.equal(first.form?.id, f.manifest.forms.baseline!.id);
  const assigned = await f.store.transaction((db) => db.participants[0]);
  assert.equal(assigned.assignedCondition, "A");
  assert(assigned.startedAt);
  const startedAt = assigned.startedAt;
  f.advance(1000);
  await f.service.session(f.token);
  assert.equal(
    (await f.store.transaction((db) => db.participants[0])).startedAt,
    startedAt,
  );
});

test("future delayed packet is withheld until its server time gate, including raw session JSON", async (t) => {
  const f = await fixture(t, {
    experiment: "E2",
    delayedInstructions: "SYNTHETIC-FUTURE-DELAYED-PACKET-CANARY",
  });
  await f.enterRehearsal();
  await f.finishRehearsal();
  const saved = await f.response("immediate", { answer: immediateCanary });
  assert.equal(saved.session.stage, "delayed");
  assert.equal(saved.session.form, null);
  assert(saved.session.availableAt);
  assert(
    !JSON.stringify(saved).includes("SYNTHETIC-FUTURE-DELAYED-PACKET-CANARY"),
  );
  await assert.rejects(
    f.response("delayed", { answer: "too early" }),
    (error) => error instanceof ResearchError && error.status === 409,
  );
  f.advance(60_000);
  const ready = (await f.service.session(f.token)).session;
  assert.equal(
    ready.form?.instructions,
    "SYNTHETIC-FUTURE-DELAYED-PACKET-CANARY",
  );
});

test("assessment packets cannot carry previous rehearsal, question or answer history", async (t) => {
  const f = await fixture(t);
  await f.enterRehearsal();
  await f.question("start", { allowAI: false });
  await f.question("release", { inspectionCompleted: true });
  await f.question("respond", {
    response: "SYNTHETIC-PRIVATE-QUESTION-RESPONSE",
  });
  await f.checkpoint(episode(true));
  const after = await f.response("rehearsal", { completed: true });
  assert.equal(after.session.stage, "immediate");
  assert.equal(after.session.checkpoint, null);
  assert.equal(after.session.question.status, "not-started");
  assert(!after.session.question.question);
  const raw = JSON.stringify(after.session);
  for (const privateText of [
    rehearsalCanary,
    baselineCanary,
    "SYNTHETIC-PRIVATE-QUESTION-RESPONSE",
  ])
    assert(!raw.includes(privateText));
});

test("expired participant view contains no retained practice, question content or receipts", async (t) => {
  const f = await fixture(t);
  await f.enterRehearsal();
  await f.question("start", { allowAI: false });
  await f.question("release", { inspectionCompleted: true });
  await f.question("respond", {
    response: "SYNTHETIC-EXPIRED-PRIVATE-QUESTION",
  });
  f.advance(2 * 86_400_000);
  const expired = (await f.service.session(f.token)).session,
    raw = JSON.stringify(expired);
  assert.equal(expired.stage, "expired");
  assert.equal(expired.form, null);
  assert.equal(expired.checkpoint, null);
  assert.deepEqual(expired.receipts, []);
  assert(!expired.question.question && !expired.question.response);
  assert(
    !raw.includes(rehearsalCanary) &&
      !raw.includes("SYNTHETIC-EXPIRED-PRIVATE-QUESTION"),
  );
});

test("malformed selector output cannot survive catch and become an adaptive success", async (t) => {
  const f = await fixture(t, {
    select: async () => ({
      questionId: "b-action-sequence",
      learnerQuote: "SYNTHETIC-QUOTE-NOT-IN-EXPLANATION",
      modelId: "test/mock-selector",
      usage: { inputTokens: null, outputTokens: null, totalTokens: null },
    }),
  });
  await f.enterRehearsal();
  await f.question("start", { allowAI: true });
  await f.question("select");
  const released = await f.question("release", { inspectionCompleted: true });
  assert.equal(f.calls(), 1);
  assert.equal(released.session.question.status, "released");
  const state = await f.store.transaction((db) => db.participants[0].question!);
  assert.equal(state.selectionStatus, "failed");
  assert.equal(state.selected, undefined);
  assert.equal(state.fallback, true);
  assert(!JSON.stringify(state).includes("SYNTHETIC-QUOTE-NOT-IN-EXPLANATION"));
});

test("normal fixed-arm card is planned delivery, never an adaptive failure/fallback", async (t) => {
  const f = await fixture(t, {
    condition: "F",
    select: async () => {
      throw new Error("Fixed arm must not call model");
    },
  });
  await f.enterRehearsal();
  await f.question("start", { allowAI: true });
  await f.question("select");
  const released = await f.question("release", { inspectionCompleted: true });
  assert.equal(f.calls(), 0);
  const state = await f.store.transaction((db) => db.participants[0].question!);
  assert.equal(state.fallback, false);
  assert.equal(state.deliveryReason, "planned-fixed");
  assert.equal(
    released.session.question.question?.heading,
    "Evidence question",
  );
  assert(!JSON.stringify(released.session).includes("assignedCondition"));
});

test("valid selection metadata is retained privately but absent from neutral participant presentation", async (t) => {
  const select = async (
    context: ResearchQuestionContext,
  ): Promise<ResearchModelSelection> => ({
    questionId: fixedResearchQuestion(context).id,
    learnerQuote: "The trace records no draft",
    modelId: "test/mock-selector",
    usage: { inputTokens: 17, outputTokens: 9, totalTokens: 26 },
  });
  const f = await fixture(t, { select });
  await f.enterRehearsal();
  await f.question("start", { allowAI: true });
  await f.question("select");
  const released = await f.question("release", { inspectionCompleted: true });
  const state = await f.store.transaction((db) => db.participants[0].question!);
  assert.equal(state.selectionStatus, "success");
  assert.equal(state.deliveryReason, "adaptive-selected");
  assert.equal(state.fallback, false);
  assert.equal(state.selected?.modelId, "test/mock-selector");
  assert.equal(f.calls(), 1);
  const raw = JSON.stringify(released.session.question);
  for (const hidden of [
    "learnerQuote",
    "modelId",
    "usage",
    "assignedCondition",
    "adaptive-selected",
    "test/mock-selector",
  ])
    assert(!raw.includes(hidden));
});

test("exports reject a different frozen protocol instead of relabeling stored records", async (t) => {
  const f = await fixture(t);
  await f.service.session(f.token);
  const changed = {
    ...f.config,
    fingerprint: hash("different frozen study version"),
    manifest: { ...f.manifest, protocolVersion: "synthetic-changed-protocol" },
  };
  const service = new ResearchService(changed, f.store, {
    now: () => Date.parse("2026-11-12T12:00:05Z"),
  });
  await assert.rejects(
    service.export("analysis"),
    (error) => error instanceof ResearchError && error.status === 409,
  );
});

test("analysis export retains the exact frozen artifact identities alongside the study version", async (t) => {
  const f = await fixture(t);
  await f.service.session(f.token);
  const exported = await f.service.export("analysis");
  assert.equal(exported.protocolVersion, f.manifest.protocolVersion);
  assert.equal(exported.experiment, "E3");
  assert.deepEqual(exported.frozenArtifacts, f.manifest.freeze);
  assert.equal(
    exported.frozenArtifacts?.questionPoolVersion,
    RESEARCH_QUESTION_POOL_VERSION,
  );
  assert.equal(exported.frozenArtifacts?.modelId, "test/mock-selector");
  assert.equal(
    exported.frozenArtifacts?.engineCommit,
    "synthetic-engine-commit",
  );
  for (const secret of ["tokenHash", "coordinatorToken", "participantToken"])
    assert(!JSON.stringify(exported).includes(secret));
});

test("E1 think-aloud route does not fabricate baseline, immediate or delayed task completion", async (t) => {
  const f = await fixture(t, { experiment: "E1" });
  const start = (await f.service.session(f.token)).session;
  assert.equal(start.stage, "rehearsal");
  await f.checkpoint(episode());
  const complete = await f.response("rehearsal", { completed: true });
  assert.equal(complete.session.stage, "feedback");
  const raw = await f.store.transaction((db) => db.participants[0]);
  assert(
    !raw.responses.baseline &&
      !raw.responses.immediate &&
      !raw.responses.delayed,
  );
});

test("minimal E1 structure accepts only relevant packets and roles without activating research", () => {
  const base = syntheticResearchManifest();
  const input = {
    ...base,
    experiment: "E1" as const,
    forms: { rehearsal: base.forms.rehearsal, feedback: base.forms.feedback },
    staff: { ...base.staff, coders: [], methodologist: "" },
    prerequisites: { ...base.prerequisites, E1: "", E2: "" },
    delayedMinimumSeconds: 0,
    delayedMaximumSeconds: 0,
  };
  // Structural validation of an explicitly fictional fixture is not approval.
  const checked = validateResearchManifest(input, false);
  assert.deepEqual(Object.keys(checked.forms).sort(), [
    "feedback",
    "rehearsal",
  ]);
  assert.deepEqual(checked.staff.coders, []);
  assert.equal(checked.staff.methodologist, "");
  assert.equal(checked.delayedMinimumSeconds, 0);
  assert.equal(researchConfig({ NODE_ENV: "test" }), null);
  assert.throws(() =>
    validateResearchManifest(
      { ...input, prerequisites: { ...input.prerequisites, E0: "" } },
      false,
    ),
  );
  for (const experiment of ["E2", "E3"])
    assert.throws(() =>
      validateResearchManifest({ ...input, experiment }, false),
    );
});
