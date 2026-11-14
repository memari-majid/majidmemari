import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
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
  await f.enroll(30);
  const last = await f.store.transaction(
    (db) => db.participants.at(-1)!.assessment!,
  );
  assert.equal(last.allocationOrdinal, 30);
  assert.deepEqual(last.order, FORM_ORDERS[0]);
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
    "decline",
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
    () => researchConfig({ ...f.env, VERCEL: "1" }, "https://example.com"),
    ResearchError,
  );
});
