import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hash,
  syntheticE2ResearchManifest,
  syntheticResearchManifest,
  validateResearchManifest,
  researchConfig,
  ResearchError,
} from "./config";
import { FileResearchStore } from "./store";
import { ResearchService } from "./service";
import { FORM_ORDERS } from "./assessment";
import { handleResearchRequest } from "./http";

async function fixture(t: { after: (f: () => Promise<void>) => void }) {
  const dir = await mkdtemp(join(tmpdir(), "e2-candidate-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  let now = Date.parse("2026-11-14T12:00:00Z");
  const manifest = syntheticE2ResearchManifest();
  const env = {
    NODE_ENV: "test" as const,
    RESEARCH_MODE: "synthetic",
    RESEARCH_SYNTHETIC_ENABLED: "1",
    RESEARCH_SYNTHETIC_STORE: join(dir, "records.json"),
    RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
    RESEARCH_SCORER_TOKEN: "s".repeat(40),
    RESEARCH_ANALYST_TOKEN: "a".repeat(40),
    RESEARCH_PURGE_TOKEN: "p".repeat(40),
    RESEARCH_SYNTHETIC_MANIFEST_JSON: JSON.stringify(manifest),
  };
  const config = researchConfig(env, "http://localhost:3197")!;
  const store = new FileResearchStore(config.filePath!);
  const service = new ResearchService(config, store, { now: () => now });
  const enroll = (n: number) =>
    service.enrollment({
      version: 1,
      requestId: `enroll-candidate-${n}`,
      syntheticId: `synthetic-candidate-${n}`,
      attestation: {
        consentVersion: manifest.consentVersion,
        consentRecorded: true,
        eligibleAdult: true,
        coordinatorReference: `coord_synthetic${String(n).padStart(4, "0")}`,
      },
    });
  const answer = async (
    token: string,
    response: unknown = { answer: "Fictional reasoning." },
    context?: unknown,
  ) => {
    const { session } = await service.session(token);
    return service.response(token, {
      version: 1,
      requestId: `answer-${session.stage}-${Math.random().toString(36).slice(2)}`,
      stage: session.stage,
      formVersion: session.form!.version,
      response,
      ...(context !== undefined ? { taskContext: context } : {}),
    });
  };
  return {
    dir,
    env,
    config,
    store,
    service,
    enroll,
    answer,
    advance: (s: number) => {
      now += s * 1000;
    },
  };
}

test("candidate v2 is explicit and does not reinterpret a version-1 manifest", () => {
  const old = syntheticResearchManifest();
  assert.equal(old.version, 1);
  assert.equal(old.assessment, undefined);
  assert.deepEqual(validateResearchManifest(old, false), old);
  assert.throws(() => validateResearchManifest({ ...old, version: "1" }, false), /configuration/);
  const candidate = syntheticE2ResearchManifest();
  assert.equal(candidate.version, 2);
  assert.equal(candidate.assessment!.nominalSeconds, 600);
  assert.throws(
    () =>
      validateResearchManifest(
        { ...old, assessment: candidate.assessment },
        false,
      ),
    /Version 1/,
  );
  assert.throws(
    () => validateResearchManifest({ ...candidate, experiment: "E3" }, false),
    /scoped to E2/,
  );
  assert.throws(
    () =>
      validateResearchManifest(
        {
          ...candidate,
          assessment: { ...candidate.assessment, nominalSeconds: 0 },
        },
        false,
      ),
    /design/,
  );
  assert.throws(
    () => validateResearchManifest({ ...candidate, forms: old.forms }, false),
    /occasion-specific/,
  );
});

test("30 allocations balance all six orders, persist before reveal, survive reload and never reuse deleted ordinals", async (t) => {
  const f = await fixture(t);
  const enrolled = await Promise.all(
    Array.from({ length: 30 }, (_, i) => f.enroll(i)),
  );
  assert(
    enrolled.every(
      (e) => e.session.form === null && e.session.assessment === undefined,
    ),
  );
  assert(
    (
      await f.store.transaction((db) =>
        db.participants.map((p) => p.assessment),
      )
    ).every((assessment) => assessment === undefined),
  );
  await Promise.all(
    enrolled.map((e) => f.service.session(e.participantToken!)),
  );
  const states = await f.store.transaction((db) =>
    db.participants.map((p) => p.assessment!),
  );
  for (const order of FORM_ORDERS)
    assert.equal(
      states.filter((s) => s.order.join("") === order.join("")).length,
      5,
    );
  for (let pos = 0; pos < 3; pos++)
    for (const key of ["A", "B", "C"])
      assert.equal(states.filter((s) => s.order[pos] === key).length, 10);
  const token = enrolled[0].participantToken!;
  const view = await f.service.session(token);
  f.advance(20);
  const restarted = new ResearchService(
    f.config,
    new FileResearchStore(f.config.filePath!),
    { now: () => Date.parse("2026-11-14T12:00:20Z") },
  );
  const again = await restarted.session(token);
  assert.equal(again.session.form!.id, view.session.form!.id);
  assert.equal(
    again.session.assessment!.openedAt,
    view.session.assessment!.openedAt,
  );
  await f.service.withdraw(token, {
    version: 1,
    requestId: "withdraw-candidate",
    deleteData: true,
  });
  await f.service.purge({
    version: 1,
    action: "delete-participant",
    participantId: enrolled[0].session.participantId,
  });
  const replacement = await f.enroll(30);
  await f.service.session(replacement.participantToken!);
  const last = await f.store.transaction(
    (db) => db.participants.at(-1)!.assessment!,
  );
  assert.equal(last.allocationOrdinal, 30);
  assert.ok(FORM_ORDERS.some((order) => order.join() === last.order.join()));
});

test("equal nominal timing records actual elapsed, overruns, missingness and optional context without hard cutoff", async (t) => {
  const f = await fixture(t);
  const e = await f.enroll(1),
    token = e.participantToken!;
  const first = (await f.service.session(token)).session;
  assert.equal(first.assessment!.nominalSeconds, 600);
  f.advance(601);
  await f.answer(
    token,
    { answer: "Late fictional answer retained." },
    {
      outsideHelp: "yes",
      helpCategory: "person",
      interruption: "yes",
      accommodation: "yes",
      priorExposure: "unsure",
    },
  );
  await f.answer(token, { completed: false, reason: "declined" });
  const immediate = (await f.service.session(token)).session;
  assert.equal(immediate.assessment!.nominalSeconds, 600);
  assert.equal(immediate.assessment!.askPriorExposure, false);
  assert.notEqual(immediate.form!.id, first.form!.id);
  f.advance(20);
  await f.answer(token, { answer: null, missingReason: "time-limit" });
  const delayed = (await f.service.session(token)).session;
  assert.equal(delayed.assessment!.nominalSeconds, 600);
  assert.notEqual(delayed.form!.id, immediate.form!.id);
  f.advance(40);
  await f.answer(token);
  const state = await f.store.transaction((db) => db.participants[0]);
  assert.equal(state.assessment!.tasks.baseline!.elapsedSeconds, 601);
  assert.equal(state.assessment!.tasks.baseline!.overNominal, true);
  assert.equal(state.assessment!.tasks.immediate!.overNominal, false);
  assert.equal(
    state.assessment!.tasks.baseline!.context!.priorExposure,
    "unsure",
  );
  assert.equal(
    state.assessment!.tasks.delayed!.context!.outsideHelp,
    null,
  );
  assert.equal(
    state.responses.immediate!.value &&
      "missingReason" in state.responses.immediate!.value,
    true,
  );
  assert.match(
    JSON.stringify(state.responses.baseline),
    /Late fictional answer retained/,
  );
});

test("self-report validation rejects free text, inconsistent help and prior-exposure fields on later occasions", async (t) => {
  const f = await fixture(t),
    e = await f.enroll(1),
    token = e.participantToken!;
  const base = {
    outsideHelp: "no",
    helpCategory: "none",
    interruption: "decline",
    accommodation: "decline",
    priorExposure: "no",
  };
  await assert.rejects(
    () =>
      f.answer(token, undefined, { ...base, outsideHelp: "someone's name" }),
    /self-report/,
  );
  await assert.rejects(
    () => f.answer(token, undefined, { ...base, helpCategory: "person" }),
    /conflicts/,
  );
  await assert.rejects(
    () => f.answer(token, undefined, { ...base, extra: "private text" }),
    /Unrecognized/,
  );
  await f.answer(token, undefined, base);
  await f.answer(token, { completed: false, reason: "declined" });
  await assert.rejects(() => f.answer(token, undefined, base), /Unrecognized/);
});

test("coder packet is shuffled, pseudonymous, stable and joins only through separate analyst linkage", async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < 6; i++) {
    const e = await f.enroll(i);
    await f.answer(e.participantToken!, { answer: `Fictional response ${i}.` });
  }
  const scored = await f.service.export("scoring");
  assert("rows" in scored && scored.scope === "scoring");
  assert.equal(scored.version, 2);
  assert.equal(scored.rows.length, 6);
  assert.deepEqual(scored, await f.service.export("scoring"));
  for (const row of scored.rows)
    assert.deepEqual(Object.keys(row), ["rowId", "task", "response"]);
  const raw = JSON.stringify(scored);
  for (const banned of [
    "participantId",
    "receivedAt",
    "stage",
    "formId",
    "sortKey",
    "allocationOrdinal",
    "assignedCondition",
    "createdAt",
    "openedAt",
  ])
    assert(!raw.includes(`"${banned}"`));
  const privateMap = await f.service.export("linkage");
  assert("rows" in privateMap && privateMap.scope === "linkage");
  assert.equal(scored.packetId, privateMap.packetId);
  assert.equal(new Set(privateMap.rows.map((r) => r.participantId)).size, 6);
  assert.deepEqual(
    scored.rows.map((r) => r.rowId),
    privateMap.rows.map((r) => r.rowId),
  );
  const order = await f.store.transaction((db) =>
    db.participants.map((p) => p.assessment!.tasks.baseline!.rowId),
  );
  // A random shuffle can coincide with enrollment order; inspect random sort keys rather than require an impossible guarantee.
  const keys = await f.store.transaction((db) =>
    db.participants.map((p) => p.assessment!.tasks.baseline!.sortKey),
  );
  assert.equal(new Set(keys).size, 6);
  assert.equal(new Set(order).size, 6);
  f.config.manifest.gradingReleasedAt = "2099-01-01T00:00:00Z";
  await assert.rejects(() => f.service.export("linkage"), /grading-release/);
  await f.service.export("scoring");
});

test("linkage endpoint requires analyst credential; source live gate stays disabled", async (t) => {
  const f = await fixture(t);
  const request = (token: string) =>
    new Request("http://localhost:3197/api/research/admin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ version: 1, action: "export-linkage" }),
    });
  const options = { env: f.env, factory: async () => f.service };
  assert.equal(
    (
      await handleResearchRequest(
        request(f.env.RESEARCH_SCORER_TOKEN),
        "admin",
        options,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleResearchRequest(
        request(f.env.RESEARCH_COORDINATOR_TOKEN),
        "admin",
        options,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleResearchRequest(
        request(f.env.RESEARCH_ANALYST_TOKEN),
        "admin",
        options,
      )
    ).status,
    200,
  );
  const source = await readFile(
    new URL("./config.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /const LIVE_RESEARCH_RELEASE = false/);
  assert.throws(
    () =>
      validateResearchManifest(
        { ...syntheticResearchManifest(), experiment: "E2" },
        true,
      ),
    /version-2 assessment schema/,
  );
  assert.throws(
    () => researchConfig({ ...f.env, VERCEL: "1" }, "https://example.com"),
    ResearchError,
  );
});

test("measurement gates: rotation does not start the delayed clock, scoring waits for close, and withdrawals stay countable", async (t) => {
  const f = await fixture(t);
  f.config.manifest.retentionDays = 30;
  f.config.manifest.delayedMinimumSeconds = 86400;
  f.config.manifest.delayedMaximumSeconds = 86400 * 3;
  const enrolled = await f.enroll(1);
  let token = enrolled.participantToken!;
  await f.answer(token);
  await f.answer(token, { completed: false, reason: "declined" });
  await f.answer(token, { answer: "Immediate fictional answer." });
  f.advance(86400);
  const rotated = await f.service.rotate({
    version: 1,
    action: "rotate-token",
    participantId: enrolled.session.participantId,
  });
  assert.equal(rotated.session.form, null);
  assert.equal(rotated.session.assessment, undefined);
  const beforeOpen = await f.store.transaction((db) => db.participants[0]);
  assert.equal(beforeOpen.assessment!.tasks.delayed, undefined);
  token = rotated.participantToken;
  f.advance(5 * 3600);
  const opened = (await f.service.session(token)).session;
  assert.ok(opened.form);
  f.advance(300);
  await f.answer(token, { answer: "Delayed fictional answer." });
  const after = await f.store.transaction((db) => db.participants[0]);
  assert.equal(after.assessment!.tasks.delayed!.elapsedSeconds, 300);
  assert.equal(after.assessment!.tasks.delayed!.overNominal, false);
  f.config.manifest.scoringReleasedAt = "2099-01-01T00:00:00Z";
  await assert.rejects(
    () => f.service.export("scoring"),
    /collection-close/,
  );
  f.config.manifest.scoringReleasedAt = "2026-01-01T00:00:00Z";
  const first = await f.service.export("scoring");
  const second = await f.service.export("scoring");
  assert.equal(
    "packetId" in first && "packetId" in second && first.packetId === second.packetId,
    true,
  );
  const other = await f.enroll(2);
  await f.service.withdraw(other.participantToken!, {
    version: 1,
    requestId: "withdraw-count",
    deleteData: true,
  });
  const renamed = {
    ...f.config.manifest,
    staff: { ...f.config.manifest.staff, coordinator: "renamed-coordinator" },
  };
  const stale = new ResearchService(
    {
      ...f.config,
      manifest: renamed,
      fingerprint: hash(JSON.stringify(renamed)),
    },
    f.store,
    { now: () => Date.parse("2026-11-15T17:00:00Z") },
  );
  await stale.withdraw(token, {
    version: 1,
    requestId: "withdraw-after-staff-edit",
    deleteData: true,
  });
  const analysis = await f.service.export("analysis");
  assert.equal("flow" in analysis && analysis.flow.withdrawn_n, 2);
  assert.equal(
    "participants" in analysis &&
      !JSON.stringify(analysis.participants).includes("Delayed fictional answer"),
    true,
  );
});

test("an untouched self-report stays empty and an explicit decline is stored as decline", async (t) => {
  const f = await fixture(t);
  const enrolled = await f.enroll(4);
  await f.answer(
    enrolled.participantToken!,
    { answer: "Explicit decline." },
    {
      outsideHelp: "decline",
      helpCategory: "decline",
      interruption: "decline",
      accommodation: "decline",
      priorExposure: "decline",
    },
  );
  const state = await f.store.transaction((db) => db.participants[0]);
  assert.equal(state.assessment!.tasks.baseline!.context!.outsideHelp, "decline");
});

test("a failed proposal records outcome and duration without calling a provider", async (t) => {
  const f = await fixture(t);
  const enrolled = await f.enroll(5);
  const token = enrolled.participantToken!;
  await f.answer(token);
  const session = (await f.service.session(token)).session;
  assert.equal(session.stage, "rehearsal");
  await assert.rejects(
    () =>
      f.service.proposal(token, {
        version: 1,
        requestId: "proposal-unavailable",
        formVersion: session.form!.version,
        run: 1,
        activityRevision: 3,
        workflow: "Read the request.",
      }),
    /unavailable/,
  );
  const analysis = await f.service.export("analysis");
  assert("participants" in analysis);
  const row = analysis.participants.find(
    (p) => p.participantId === enrolled.session.participantId,
  );
  assert(row && "proposalAttempts" in row);
  assert.equal(row.proposalAttempts[0]?.outcome, "unavailable");
  assert.equal(typeof row.proposalAttempts[0]?.elapsedMs, "number");
});

test("the first six starters, not the first six enrollments, balance each form", async (t) => {
  const f = await fixture(t);
  const enrolled = [];
  for (let i = 0; i < 8; i++) enrolled.push(await f.enroll(i + 40));
  const starters = enrolled.filter((_, index) => index !== 0 && index !== 7);
  for (const person of starters) await f.service.session(person.participantToken!);
  const orders = await f.store.transaction((db) =>
    db.participants
      .filter((p) => p.startedAt)
      .map((p) => p.assessment!.order),
  );
  assert.equal(orders.length, 6);
  for (const position of [0, 1, 2])
    for (const key of ["A", "B", "C"])
      assert.equal(orders.filter((order) => order[position] === key).length, 2);
});

test("proposal attempts reproduce success, timeout, invalid_output, provider_error, late and interrupted outcomes with durations, and accommodations extend evidence windows", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "e2-outcomes-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  let now = Date.parse("2026-11-14T12:00:00Z");
  const manifest = syntheticE2ResearchManifest();
  manifest.retentionDays = 30;
  delete manifest.scoringReleasedAt;
  manifest.studyEndsAt = "2026-12-01T00:00:00Z";
  manifest.recordsRetainUntil = "2028-12-01T00:00:00Z";
  const env = {
    NODE_ENV: "test" as const,
    RESEARCH_MODE: "synthetic",
    RESEARCH_SYNTHETIC_ENABLED: "1",
    RESEARCH_SYNTHETIC_STORE: join(dir, "records.json"),
    RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
    RESEARCH_SCORER_TOKEN: "s".repeat(40),
    RESEARCH_ANALYST_TOKEN: "a".repeat(40),
    RESEARCH_PURGE_TOKEN: "p".repeat(40),
    RESEARCH_SYNTHETIC_MANIFEST_JSON: JSON.stringify(manifest),
  };
  const baseConfig = researchConfig(env, "http://localhost:3197")!;
  // Exercise the live-shaped proposal path against an in-memory FileResearchStore with mocked dependencies.
  const config = { ...baseConfig, mode: "live" as const };
  const store = new FileResearchStore(baseConfig.filePath!);
  let proposeImpl: NonNullable<ConstructorParameters<typeof ResearchService>[2]>["propose"];
  const service = new ResearchService(config, store, {
    now: () => now,
    propose: (wf, sig) => proposeImpl!(wf, sig),
  });
  let idx = 0;
  async function reachRehearsal(mult?: number) {
    idx += 1;
    const id = "p_" + String(idx).padStart(24, "0");
    const token = `rp_test_${idx}_` + "x".repeat(32);
    await store.transaction((db) => {
      db.participants.push({
        participantId: id,
        tokenHash: hash(token),
        enrollmentRequestId: `req-${idx}`,
        enrollmentDigest: `dig-${idx}`,
        studyId: manifest.studyId,
        protocolVersion: manifest.protocolVersion,
        fingerprint: config.fingerprint,
        experiment: "E2",
        assignedCondition: null,
        createdAt: new Date(now).toISOString(),
        startedAt: null,
        retentionUntil: manifest.recordsRetainUntil!,
        withdrawnAt: null,
        consentVersion: manifest.consentVersion,
        coordinatorReference: `coord_outcome_${idx}`,
        ...(mult ? { accommodationTimeMultiplier: mult } : {}),
        responses: {},
        checkpoint: null,
        checkpointReceipt: null,
        question: null,
        observations: [],
        proposalAttempts: [],
        requests: {},
      });
    });
    const baselineView = (await service.session(token)).session;
    await service.response(token, {
      version: 1,
      requestId: `base-${idx}-0001`,
      stage: "baseline",
      formVersion: baselineView.form!.version,
      response: { answer: "Baseline answer." },
    });
    const session = (await service.session(token)).session;
    return { id, token, formVersion: session.form!.version };
  }

  // 1. success
  const p1 = await reachRehearsal(2);
  proposeImpl = async () => {
    now += 125;
    return {
      mapping: [{ step: 1, actions: [{ type: "intake", quote: "Read the request." }] }],
      modelId: "mock/model-v1",
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      classifiedBy: "ai",
    };
  };
  const ok = await service.proposal(p1.token, {
    version: 1,
    requestId: "prop-success-001",
    formVersion: p1.formVersion,
    run: 1,
    activityRevision: 3,
    workflow: "Read the request.",
  });
  assert.ok(ok);

  // 2. timeout
  const p2 = await reachRehearsal();
  proposeImpl = async () => {
    now += 30000;
    const err = new Error("The operation timed out");
    err.name = "TimeoutError";
    throw err;
  };
  await assert.rejects(() =>
    service.proposal(p2.token, {
      version: 1,
      requestId: "prop-timeout-001",
      formVersion: p2.formVersion,
      run: 1,
      activityRevision: 3,
      workflow: "Read the request.",
    }),
  );

  // 3. invalid_output
  const p3 = await reachRehearsal();
  proposeImpl = async () => {
    now += 80;
    const err = new Error("The workflow classification could not be validated.");
    err.name = "ClassificationError";
    throw err;
  };
  await assert.rejects(() =>
    service.proposal(p3.token, {
      version: 1,
      requestId: "prop-invalid-001",
      formVersion: p3.formVersion,
      run: 1,
      activityRevision: 3,
      workflow: "Read the request.",
    }),
  );

  // 4. provider_error
  const p4 = await reachRehearsal();
  proposeImpl = async () => {
    now += 45;
    throw new Error("Upstream 502 gateway error");
  };
  await assert.rejects(() =>
    service.proposal(p4.token, {
      version: 1,
      requestId: "prop-provider-001",
      formVersion: p4.formVersion,
      run: 1,
      activityRevision: 3,
      workflow: "Read the request.",
    }),
  );

  // 5. interrupted
  const p5 = await reachRehearsal();
  const abortController = new AbortController();
  proposeImpl = async () => {
    now += 15;
    abortController.abort();
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  };
  await assert.rejects(() =>
    service.proposal(
      p5.token,
      {
        version: 1,
        requestId: "prop-interrupt-001",
        formVersion: p5.formVersion,
        run: 1,
        activityRevision: 3,
        workflow: "Read the request.",
      },
      abortController.signal,
    ),
  );

  // 6. late (participant withdraws before proposal resolves)
  const p6 = await reachRehearsal();
  proposeImpl = async () => {
    now += 210;
    await store.transaction((db) => {
      const target = db.participants.find((item) => item.participantId === p6.id)!;
      target.responses.rehearsal = {
        receipt: {
          requestId: "manual-finish",
          stage: "rehearsal",
          receivedAt: new Date(now).toISOString(),
          protocolVersion: manifest.protocolVersion,
          formVersion: p6.formVersion,
        },
        value: { completed: false, reason: "declined" },
      };
    });
    return {
      mapping: [{ step: 1, actions: [{ type: "intake", quote: "Read the request." }] }],
      modelId: "mock/model-v1",
      usage: { inputTokens: 8, outputTokens: 4, totalTokens: 12 },
      classifiedBy: "ai",
    };
  };
  await assert.rejects(
    () =>
      service.proposal(p6.token, {
        version: 1,
        requestId: "prop-late-00001",
        formVersion: p6.formVersion,
        run: 1,
        activityRevision: 3,
        workflow: "Read the request.",
      }),
    /proposal window/,
  );

  // Scoring export respects studyEndsAt when scoringReleasedAt is omitted.
  await assert.rejects(() => service.export("scoring"), /collection-close/);

  const analysis = await service.export("analysis");
  assert("participants" in analysis);
  const byId = new Map(
    analysis.participants
      .filter((item) => "proposalAttempts" in item)
      .map((item) => [item.participantId, item]),
  );
  assert.deepEqual(
    [p1, p2, p3, p4, p5, p6].map(
      (p) => byId.get(p.id)!.proposalAttempts[0]?.outcome,
    ),
    [
      "success",
      "timeout",
      "invalid_output",
      "provider_error",
      "interrupted",
      "late",
    ],
  );
  assert.deepEqual(
    [p1, p2, p3, p4, p5, p6].map(
      (p) => byId.get(p.id)!.proposalAttempts[0]?.elapsedMs,
    ),
    [125, 30000, 80, 45, 15, 210],
  );
  assert.equal(byId.get(p1.id)!.proposalAttempts[0]?.modelId, "mock/model-v1");
  assert.equal(byId.get(p1.id)!.accommodationTimeMultiplier, 2);
});
