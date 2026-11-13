import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  researchConfig,
  researchFreeze,
  hash,
  syntheticResearchManifest,
  validateResearchManifest,
} from "./config";
import { FileResearchStore, PostgresResearchStore } from "./store";
import { ResearchService } from "./service";
import { LEARNING_ACTIVITIES, isShiftRunActivity } from "../course-kb/learning";
import {
  blankShiftSession,
  confirmShiftDraft,
  newShiftDraft,
  type ShiftSession,
} from "../course-kb/shift-session";
import {
  commitShiftExplanation,
  updateShiftExplanation,
} from "../course-kb/shift-practice";
import { recordNextRequest, type ShiftMapping } from "../course-kb/shift-run";
import {
  fixedResearchQuestion,
  type ResearchQuestionContext,
} from "./questions";
import type { Pool } from "pg";
const activity = LEARNING_ACTIVITIES.find(isShiftRunActivity)!;
const wf = activity.fixtures.v1.workflow,
  steps = wf.split("\n");
const mapping: ShiftMapping = [
  { step: 1, actions: [{ type: "intake", quote: steps[0] }] },
  { step: 2, actions: [{ type: "find_source", quote: steps[1] }] },
  {
    step: 3,
    actions: [
      {
        type: "ai_draft",
        quote: steps[2],
        ai_draft: { states_conditions: false, forbids_promises: false },
      },
    ],
  },
  {
    step: 4,
    actions: [
      {
        type: "human_check",
        quote: steps[3],
        human_check: { checks: ["tone", "accuracy"] },
      },
    ],
  },
  { step: 5, actions: [{ type: "release", quote: steps[4] }] },
];
function explain(s: ShiftSession, target: "run-1" | "run-2" | "C") {
  return {
    ...s,
    practice: commitShiftExplanation(
      updateShiftExplanation(
        s.practice,
        target,
        {
          explanation: "The trace shows a reply without the needed authority.",
          revisionPlan: "Inspect conditions and authority before release.",
        },
        activity,
        s.record,
      ),
      target,
      activity,
      s.record,
    ),
  };
}
function first() {
  const s = { ...blankShiftSession(activity), workflow: wf };
  const d = newShiftDraft(s);
  return explain(
    confirmShiftDraft(
      activity,
      { ...s, draft: { ...d, mapping, reviewed: steps.map((_, i) => i + 1) } },
      true,
    ),
    "run-1",
  );
}
function finished() {
  let s = {
    ...first(),
    reason: "Retain this process for a synthetic boundary check.",
  };
  const d = newShiftDraft(s);
  s = explain(
    confirmShiftDraft(
      activity,
      { ...s, draft: { ...d, mapping, reviewed: steps.map((_, i) => i + 1) } },
      true,
    ),
    "run-2",
  );
  return explain({ ...s, record: recordNextRequest(activity, s.record) }, "C");
}
async function setup(
  t: { after: (fn: () => Promise<void>) => void },
  experiment: "E1" | "E2" | "E3" = "E3",
) {
  const dir = await mkdtemp(join(tmpdir(), "research-service-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  let time = Date.parse("2026-11-12T12:00:00Z");
  const manifest = syntheticResearchManifest();
  manifest.experiment = experiment;
  const env = {
    NODE_ENV: "test",
    RESEARCH_MODE: "synthetic",
    RESEARCH_SYNTHETIC_ENABLED: "1",
    RESEARCH_SYNTHETIC_STORE: join(dir, "records.json"),
    RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
    RESEARCH_SCORER_TOKEN: "s".repeat(40),
    RESEARCH_ANALYST_TOKEN: "a".repeat(40),
    RESEARCH_PURGE_TOKEN: "p".repeat(40),
    RESEARCH_SYNTHETIC_MANIFEST_JSON: JSON.stringify(manifest),
  };
  const config = researchConfig(env, "http://localhost:3197")!,
    store = new FileResearchStore(config.filePath!);
  const service = new ResearchService(config, store, {
    now: () => time,
    condition: () => "A",
  });
  const input = {
    version: 1,
    requestId: "enrollment-0001",
    syntheticId: "synthetic-test-001",
    attestation: {
      consentVersion: manifest.consentVersion,
      consentRecorded: true,
      eligibleAdult: true,
      coordinatorReference: "coord_test00001",
    },
  };
  const enrolled = await service.enrollment(input);
  const token = enrolled.participantToken!;
  await service.session(token);
  const version = config.manifest.forms.rehearsal.version;
  const baseline = () =>
    service.response(token, {
      version: 1,
      requestId: "baseline-0001",
      stage: "baseline",
      formVersion: config.manifest.forms.baseline!.version,
      response: { answer: "A synthetic baseline response." },
    });
  const checkpoint = (session = first(), id = "checkpoint-0001") =>
    service.checkpoint(token, {
      version: 1,
      requestId: id,
      formVersion: version,
      session,
    });
  const question = (
    action: string,
    extra: Record<string, unknown> = {},
    id = "question-" + action,
  ) =>
    service.question(token, {
      version: 1,
      requestId: id,
      formVersion: version,
      action,
      ...extra,
    });
  return {
    dir,
    config,
    store,
    service,
    token,
    input,
    version,
    baseline,
    checkpoint,
    question,
    time: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}
test("off by default; local synthetic cannot run on production, remote origin or Vercel", () => {
  assert.equal(researchConfig({}), null);
  const env = {
    NODE_ENV: "test",
    RESEARCH_MODE: "synthetic",
    RESEARCH_SYNTHETIC_ENABLED: "1",
    RESEARCH_SYNTHETIC_STORE: "/tmp/fixture.json",
    RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
    RESEARCH_SCORER_TOKEN: "s".repeat(40),
    RESEARCH_ANALYST_TOKEN: "a".repeat(40),
    RESEARCH_PURGE_TOKEN: "p".repeat(40),
  };
  assert(researchConfig(env, "http://localhost"));
  for (const e of [
    { ...env, NODE_ENV: "production" },
    { ...env, VERCEL: "1" },
  ])
    assert.throws(() => researchConfig(e, "http://localhost"));
  assert.throws(() => researchConfig(env, "https://example.org"));
  assert.throws(() =>
    researchConfig(
      { ...env, RESEARCH_COORDINATOR_TOKEN: "short" },
      "http://localhost",
    ),
  );
});
test("live remains source-gated after manifest, freeze and E3 pool checks", () => {
  const m = syntheticResearchManifest();
  m.studyId = "reviewed-pilot";
  m.approvalReference = "IRB-reference-2026";
  m.delayedMinimumSeconds = 86400;
  m.delayedMaximumSeconds = 172800;
  m.studyEndsAt = "2027-06-01T00:00:00Z";
  m.recordsRetainUntil = "2030-06-01T00:00:00Z";
  m.freeze = researchFreeze(m, "model/frozen", "commit-123");
  const env = {
    RESEARCH_MODE: "live",
    RESEARCH_ENABLED: "reviewed-live-collection",
    RESEARCH_REVIEWED_MANIFEST_JSON: JSON.stringify(m),
    RESEARCH_DATABASE_URL: "postgres://private.invalid/db",
    RESEARCH_MODEL: "model/frozen",
    VERCEL_GIT_COMMIT_SHA: "commit-123",
    RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
    RESEARCH_SCORER_TOKEN: "s".repeat(40),
    RESEARCH_ANALYST_TOKEN: "a".repeat(40),
    RESEARCH_PURGE_TOKEN: "p".repeat(40),
  };
  assert.throws(() => researchConfig(env), /provisional/);
  assert.throws(() => researchConfig({ ...env, RESEARCH_ENABLED: "1" }));
  m.experiment = "E2";
  m.freeze = researchFreeze(m, "model/frozen", "commit-123");
  const good = { ...env, RESEARCH_REVIEWED_MANIFEST_JSON: JSON.stringify(m) };
  assert.throws(() => researchConfig(good), /reviewed source release/);
  assert.throws(() =>
    researchConfig({ ...good, VERCEL_GIT_COMMIT_SHA: "other" }),
  );
});
test("absolute reviewed retention uses one study-close cutoff for different enrollment dates", async (t) => {
  const s = await setup(t);
  const manifest = validateResearchManifest(
    {
      ...s.config.manifest,
      studyEndsAt: "2027-06-01T00:00:00Z",
      recordsRetainUntil: "2030-06-01T00:00:00Z",
    },
    false,
  );
  const config = {
    ...s.config,
    manifest,
    fingerprint: hash(JSON.stringify(manifest)),
  };
  const service = new ResearchService(
    config,
    new FileResearchStore(join(s.dir, "absolute-cutoff.json")),
    { now: s.time },
  );
  const a = await service.enrollment({
    ...s.input,
    requestId: "enroll-absolute-0001",
    syntheticId: "synthetic-cutoff-001",
  });
  s.advance(14 * 86400000);
  const b = await service.enrollment({
    ...s.input,
    requestId: "enroll-absolute-0002",
    syntheticId: "synthetic-cutoff-002",
    attestation: {
      ...s.input.attestation,
      coordinatorReference: "coord_cutoff_second",
    },
  });
  assert.equal(a.session.retentionUntil, "2030-06-01T00:00:00.000Z");
  assert.equal(b.session.retentionUntil, a.session.retentionUntil);
  assert.notEqual(a.session.participantId, b.session.participantId);
});
test("retention dates reject invalid, unpaired, pre-close and unbounded cutoffs", () => {
  const base = syntheticResearchManifest();
  for (const extra of [
    { studyEndsAt: "2027-06-01T00:00:00Z" },
    { studyEndsAt: "not-a-date", recordsRetainUntil: "2030-06-01T00:00:00Z" },
    {
      studyEndsAt: "2027-02-30T00:00:00Z",
      recordsRetainUntil: "2030-06-01T00:00:00Z",
    },
    {
      studyEndsAt: "2027-06-01T00:00:00Z",
      recordsRetainUntil: "2027-05-31T00:00:00Z",
    },
    {
      studyEndsAt: "2027-06-01T00:00:00Z",
      recordsRetainUntil: "2040-06-01T00:00:00Z",
    },
  ])
    assert.throws(() => validateResearchManifest({ ...base, ...extra }, false));
  const live = {
    ...base,
    studyId: "reviewed-retention-check",
    approvalReference: "review-reference-001",
    delayedMinimumSeconds: 86400,
    delayedMaximumSeconds: 172800,
  };
  assert.throws(() => validateResearchManifest(live, true), /retention dates/);
});
test("E1 accepts actual short protocol without fictitious outcome forms/coders/delays", () => {
  const m = syntheticResearchManifest();
  m.experiment = "E1";
  delete m.forms.baseline;
  delete m.forms.immediate;
  delete m.forms.delayed;
  m.staff.coders = [];
  m.staff.methodologist = "";
  m.prerequisites.E1 = "";
  m.prerequisites.E2 = "";
  m.delayedMinimumSeconds = 0;
  m.delayedMaximumSeconds = 0;
  assert.equal(validateResearchManifest(m, false).experiment, "E1");
  m.experiment = "E2";
  assert.throws(() => validateResearchManifest(m, false));
});
test("E1 finishes after one confirmed run and explanation, not an empty checkpoint", async (t) => {
  const s = await setup(t, "E1");
  const response = (id: string) =>
    s.service.response(s.token, {
      version: 1,
      requestId: id,
      stage: "rehearsal",
      formVersion: s.version,
      response: { completed: true },
    });
  await s.checkpoint(blankShiftSession(activity));
  await assert.rejects(() => response("empty-complete-0001"), /complete rehearsal/);
  await assert.rejects(() => s.question("skip"), /no evidence question/);
  const unexplained = first();
  unexplained.practice.responses["run-1"]!.committed = null;
  await s.checkpoint(unexplained, "e1-unexplained-0001");
  await assert.rejects(
    () => response("unexplained-complete-0001"),
    /complete rehearsal/,
  );
  await assert.rejects(
    () => s.checkpoint(finished(), "e1-second-run-0001"),
    /ends after version 1/,
  );
  await s.checkpoint(first(), "e1-first-run-0001");
  const result = await response("e1-complete-0001");
  assert.equal(result.session.stage, "feedback");
  assert.equal(result.receipt?.stage, "rehearsal");
  assert.equal(result.session.question.status, "not-started");
});
test("E2 requires a common question opportunity but explicit skip keeps the full route available", async (t) => {
  const s = await setup(t, "E2");
  await s.baseline();
  await s.checkpoint();
  await assert.rejects(
    () => s.checkpoint(finished(), "e2-before-question-0001"),
    /question/,
  );
  const skipped = await s.question("skip");
  assert.equal(skipped.session.question.status, "responded");
  assert.equal(skipped.session.question.responseStatus, "declined");
  await s.checkpoint(finished(), "e2-full-run-0001");
  const result = await s.service.response(s.token, {
    version: 1,
    requestId: "e2-complete-0001",
    stage: "rehearsal",
    formVersion: s.version,
    response: { completed: true },
  });
  assert.equal(result.session.stage, "immediate");
  assert.equal(result.receipt?.stage, "rehearsal");
});
test("question skip cannot precede the first explanation or erase a released card", async (t) => {
  const s = await setup(t, "E2");
  await s.baseline();
  await assert.rejects(
    () => s.question("skip", {}, "early-question-skip"),
    /Save the first accepted run and committed explanation/,
  );
  await s.checkpoint();
  await s.question("start", { allowAI: false });
  await s.question("release", { inspectionCompleted: true });
  await assert.rejects(
    () => s.question("skip", {}, "released-question-skip"),
    /released question needs a response or explicit decline/,
  );
  assert.equal((await s.service.session(s.token)).session.question.status, "released");
});
test("durable restart, immutable stage and idempotent concurrent retries", async (t) => {
  const s = await setup(t);
  const request = {
    version: 1,
    requestId: "baseline-same-0001",
    stage: "baseline",
    formVersion: s.config.manifest.forms.baseline!.version,
    response: { answer: "Synthetic saved response." },
  };
  const results = await Promise.all(
    Array.from({ length: 8 }, () => s.service.response(s.token, request)),
  );
  assert(
    results.every(
      (r) => r.receipt?.receivedAt === results[0].receipt?.receivedAt,
    ),
  );
  const reopened = new ResearchService(
    s.config,
    new FileResearchStore(s.config.filePath!),
    { now: s.time },
  );
  assert.equal((await reopened.session(s.token)).session.stage, "rehearsal");
  await assert.rejects(
    () =>
      s.service.response(s.token, {
        ...request,
        response: { answer: "Changed response." },
      }),
    /identifier/,
  );
  const raw = await readFile(s.config.filePath!, "utf8");
  assert(!raw.includes(s.token));
  assert(raw.includes("Synthetic saved response."));
});
test("one concurrent enrollment creates one random hashed token and no duplicate participant", async (t) => {
  const s = await setup(t);
  const r = await Promise.all(
    Array.from({ length: 6 }, () =>
      s.service.enrollment({
        ...s.input,
        requestId: "enrollment-race-0001",
        syntheticId: "synthetic-race-001",
        attestation: {
          ...s.input.attestation,
          coordinatorReference: "coord_race_first01",
        },
      }),
    ),
  );
  assert.equal(r.filter((v) => v.participantToken).length, 1);
  assert.equal((await s.service.export("scoring")).participants.length, 2);
});
test("lost enrollment response and a fresh request ID recover the same consent record", async (t) => {
  const s = await setup(t);
  const reference = "coord_lostresponse01";
  const first = await s.service.enrollment({
    ...s.input,
    requestId: "enrollment-lost-0001",
    syntheticId: "synthetic-lost-001",
    attestation: { ...s.input.attestation, coordinatorReference: reference },
  });
  assert.equal(typeof first.participantToken, "string");

  // Simulate a committed server write whose reply never reached the browser.
  // The next page instance has no earlier in-memory request identifier.
  const reopened = new ResearchService(
    s.config,
    new FileResearchStore(s.config.filePath!),
    { now: s.time },
  );
  const recovered = await reopened.enrollment({
    ...s.input,
    requestId: "enrollment-after-reload-0002",
    syntheticId: "synthetic-lost-002",
    attestation: { ...s.input.attestation, coordinatorReference: reference },
  });
  assert.equal(recovered.participantToken, null);
  assert.equal(recovered.replayed, true);
  assert.equal(recovered.session.participantId, first.session.participantId);
  assert(!JSON.stringify(recovered).includes(reference));
  assert.equal((await s.service.export("scoring")).participants.length, 2);

  const changedManifest = {
    ...s.config.manifest,
    protocolVersion: "synthetic-next-protocol",
  };
  const changedProtocol = new ResearchService(
    {
      ...s.config,
      manifest: changedManifest,
      fingerprint: hash(JSON.stringify(changedManifest)),
    },
    new FileResearchStore(s.config.filePath!),
    { now: s.time },
  );
  await assert.rejects(
    () => changedProtocol.enrollment(s.input),
    /frozen study version changed/,
  );

  const replacement = await reopened.rotate({
    version: 1,
    action: "rotate-token",
    participantId: recovered.session.participantId,
  });
  assert.equal(typeof replacement.participantToken, "string");
  await assert.rejects(() => reopened.session(first.participantToken!), /token/);
  assert.equal(
    (await reopened.session(replacement.participantToken)).session.participantId,
    first.session.participantId,
  );
});
test("checkpoint receipt persists, legacy/unrecognized records rejected, version 2 held until question", async (t) => {
  const s = await setup(t);
  await s.baseline();
  const r = await s.checkpoint();
  assert.equal(r.receipt?.requestId, "checkpoint-0001");
  assert.equal(
    (await s.service.session(s.token)).session.lastCheckpointReceipt
      ?.receivedAt,
    r.receipt!.receivedAt,
  );
  await assert.rejects(
    () => s.checkpoint(finished(), "checkpoint-invalid"),
    /question/,
  );
  await s.question("skip");
  await s.checkpoint(finished(), "checkpoint-complete");
  await assert.rejects(
    () => s.checkpoint(first(), "checkpoint-rewrite"),
    /immutable/,
  );
});
test("question accepts one valid timely selection; repeated select does not add calls", async (t) => {
  const s = await setup(t);
  await s.baseline();
  await s.checkpoint();
  let calls = 0;
  const service = new ResearchService(s.config, s.store, {
    now: s.time,
    select: async (context) => {
      calls++;
      return {
        questionId: fixedResearchQuestion(context).id as never,
        learnerQuote: context.request.explanation,
        modelId: "mock-no-provider",
        usage: { inputTokens: null, outputTokens: null, totalTokens: null },
      };
    },
  });
  const q = (action: string, extra = {}) =>
    service.question(s.token, {
      version: 1,
      requestId: "question-" + action,
      formVersion: s.version,
      action,
      ...extra,
    });
  await q("start");
  await q("select");
  await q("select");
  const r = await q("release", { inspectionCompleted: true });
  assert.equal(r.session.question.status, "released");
  assert.equal(calls, 1);
  await s.store.transaction((db) =>
    assert.equal(db.participants[0].question!.fallback, false),
  );
});
test("early release wins against pending model; late result never rewrites delivered fixed question", async (t) => {
  const s = await setup(t);
  await s.baseline();
  await s.checkpoint();
  let resolve!: (v: never) => void;
  let context!: ResearchQuestionContext;
  const service = new ResearchService(s.config, s.store, {
    now: s.time,
    select: async (c) => {
      context = c;
      return new Promise((r) => {
        resolve = r as typeof resolve;
      });
    },
  });
  const q = (action: string, extra = {}) =>
    service.question(s.token, {
      version: 1,
      requestId: "question-" + action,
      formVersion: s.version,
      action,
      ...extra,
    });
  await q("start");
  const pending = q("select");
  while (!resolve) await new Promise((r) => setTimeout(r, 1));
  const released = await q("release", { inspectionCompleted: true });
  const id = released.session.question.question!.id;
  s.advance(1000);
  resolve({
    questionId: context.questions[2].id,
    learnerQuote: context.request.explanation,
    modelId: "mock",
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
  } as never);
  await pending;
  assert.equal(
    (await service.session(s.token)).session.question.question!.id,
    id,
  );
  await s.store.transaction((db) =>
    assert.equal(db.participants[0].question!.selected, undefined),
  );
});
test("absolute selection deadline prevents calls; 60-second release and 180-second response timeout", async (t) => {
  const s = await setup(t);
  await s.baseline();
  await s.checkpoint();
  let calls = 0;
  const service = new ResearchService(s.config, s.store, {
    now: s.time,
    select: async () => {
      calls++;
      throw Error("never");
    },
  });
  await service.question(s.token, {
    version: 1,
    requestId: "question-start",
    formVersion: s.version,
    action: "start",
  });
  s.advance(31000);
  await service.question(s.token, {
    version: 1,
    requestId: "question-select",
    formVersion: s.version,
    action: "select",
  });
  assert.equal(calls, 0);
  s.advance(30000);
  assert.equal(
    (await service.session(s.token)).session.question.status,
    "released",
  );
  s.advance(180000);
  assert.equal(
    (await service.session(s.token)).session.question.responseStatus,
    "timed-out",
  );
});
test("missing baseline and incomplete rehearsal preserve assigned flow without fabricated scores", async (t) => {
  const s = await setup(t);
  await s.service.response(s.token, {
    version: 1,
    requestId: "baseline-missing",
    stage: "baseline",
    formVersion: s.config.manifest.forms.baseline!.version,
    response: { answer: null, missingReason: "declined" },
  });
  await s.service.response(s.token, {
    version: 1,
    requestId: "rehearsal-incomplete",
    stage: "rehearsal",
    formVersion: s.version,
    response: { completed: false, reason: "technical" },
  });
  assert.equal((await s.service.session(s.token)).session.stage, "immediate");
  const masked = await s.service.export("scoring");
  assert.equal(masked.participants.length, 1);
  const rows = masked.participants[0].responses;
  assert(Array.isArray(rows));
  assert.equal(rows.length, 0);
});
test("withdrawal deletes content, denies future writes and purge removes tombstone", async (t) => {
  const s = await setup(t);
  await s.baseline();
  await s.checkpoint();
  await s.service.withdraw(s.token, {
    version: 1,
    requestId: "withdrawal-0001",
    deleteData: true,
  });
  const view = (await s.service.session(s.token)).session;
  assert.equal(view.stage, "withdrawn");
  assert.equal(view.checkpoint, null);
  await assert.rejects(() => s.baseline(), /withdrawn/);
  assert.equal((await s.service.export("scoring")).participants.length, 0);
  const raw = await readFile(s.config.filePath!, "utf8");
  assert(!raw.includes("Synthetic baseline response."));
  assert.deepEqual(
    await s.service.purge({
      version: 1,
      action: "delete-participant",
      participantId: view.participantId,
    }),
    { deleted: 1 },
  );
});
test("coordinator observations strict, idempotent, absent from masked scoring", async (t) => {
  const s = await setup(t, "E1");
  const obs = {
    version: 1,
    action: "observation",
    requestId: "observation-0001",
    participantId: "synthetic-test-001",
    taskReached: "inspect",
    assistanceCategory: "navigation",
    staffMinutes: 2,
    workLossAssessed: true,
    workLost: false,
    interruption: false,
    accommodationNoted: false,
  };
  await s.service.observation(obs);
  await s.service.observation(obs);
  await s.store.transaction((db) =>
    assert.equal(db.participants[0].observations.length, 1),
  );
  assert(
    !JSON.stringify(await s.service.export("scoring")).includes("staffMinutes"),
  );
  await assert.rejects(() =>
    s.service.observation({
      ...obs,
      requestId: "observation-0002",
      studentId: "not-accepted",
    }),
  );
});
test("Postgres transaction uses one acquired client and rolls back without leaking client", async () => {
  const calls: string[] = [];
  const client = {
    query: async (q: string) => {
      calls.push(q);
      return {
        rows: q.startsWith("SELECT state")
          ? [{ state: { version: 1, participants: [] } }]
          : [],
      };
    },
    release: () => calls.push("release"),
  };
  const store = new PostgresResearchStore({
    connect: async () => client,
  } as unknown as Pool);
  await store.transaction((db) => {
    assert.equal(db.version, 1);
  });
  assert(calls.includes("COMMIT"));
  assert.equal(calls.at(-1), "release");
  calls.length = 0;
  await assert.rejects(() =>
    store.transaction(() => {
      throw Error("synthetic failure");
    }),
  );
  assert(calls.includes("ROLLBACK"));
  assert(!calls.some((q) => q.startsWith("UPDATE")));
  assert.equal(calls.at(-1), "release");
});
