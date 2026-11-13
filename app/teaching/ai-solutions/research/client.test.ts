import test from "node:test";
import assert from "node:assert/strict";
import {
  readReceipt,
  readSession,
  readStatus,
  ResearchClientError,
  studyFetch,
  studyJSON,
} from "./client";

const stamp = "2026-11-12T20:00:00.000Z";
const receipt = {
  requestId: "request-example",
  stage: "baseline",
  receivedAt: stamp,
  protocolVersion: "synthetic-v1",
  formVersion: "fixture-v1",
};
const status = {
  version: 1,
  mode: "synthetic",
  available: true,
  status: "synthetic-only",
  note: "Local fictional fixtures only.",
};
const session = {
  version: 1,
  mode: "synthetic",
  experiment: "E3",
  studyId: "synthetic-study",
  protocolVersion: "synthetic-v1",
  participantId: "synthetic-person",
  stage: "baseline",
  form: {
    id: "fixture",
    version: "fixture-v1",
    title: "Fictional packet",
    instructions: "Use invented text.",
    responsePrompt: "Explain.",
    sources: [],
    trace: [],
  },
  availableAt: null,
  outsidePlannedWindow: false,
  receipts: [],
  checkpoint: null,
  lastCheckpointReceipt: null,
  question: {
    status: "not-started",
    inspectionInstructions: "Inspect the source and trace.",
  },
  retentionUntil: stamp,
};

test("reads the actual HTTP status and session envelopes", () => {
  assert.deepEqual(readStatus({ status }), status);
  assert.deepEqual(readStatus(status), status);
  assert.deepEqual(readSession({ session }), session);
  assert.deepEqual(readSession(session), session);
  assert.throws(() => readStatus({ status: { ...status, available: "yes" } }));
  assert.throws(() =>
    readStatus({ status: { ...status, mode: "off", available: true } }),
  );
  assert.throws(() =>
    readSession({
      session: {
        ...session,
        question: { status: "released", inspectionInstructions: "" },
      },
    }),
  );
});

test("requires a checked receipt and accepts a true declined opportunity without a fabricated card", () => {
  assert.deepEqual(readReceipt(receipt), receipt);
  assert.throws(() => readReceipt({ ...receipt, receivedAt: "not-a-date" }));
  assert.throws(() => readReceipt({ ...receipt, stage: "unknown" }));
  assert.equal(
    readSession({
      session: {
        ...session,
        question: {
          status: "responded",
          responseStatus: "declined",
          inspectionInstructions: "",
        },
      },
    }).question.responseStatus,
    "declined",
  );
});

test("sends the access token only in the Authorization header with private no-store transport", async () => {
  const original = globalThis.fetch;
  const token = "rp_" + "synthetic-only-token".repeat(3);
  const calls: { path: unknown; options: RequestInit }[] = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options: options ?? {} });
    return new Response("{}", { status: 200 });
  };
  try {
    const body = {
      version: 1,
      requestId: "request-example",
      answer: "Invented example",
    };
    await studyFetch("response", token, body);
    const call = calls[0];
    assert.equal(call.path, "/api/research/response");
    assert.equal(
      new Headers(call.options.headers).get("authorization"),
      `Bearer ${token}`,
    );
    assert.equal(call.options.body, JSON.stringify(body));
    assert.doesNotMatch(String(call.path) + call.options.body, /rp_/);
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.credentials, "omit");
    assert.equal(call.options.referrerPolicy, "no-referrer");
    assert.equal(call.options.redirect, "error");
  } finally {
    globalThis.fetch = original;
  }
});

test("failed saves expose a truthful sanitized error, never a receipt or raw server detail", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "private-provider-detail" }), {
      status: 503,
    });
  try {
    await assert.rejects(
      studyJSON("response", "synthetic-placeholder", { answer: "Invented" }),
      (error: unknown) =>
        error instanceof ResearchClientError &&
        error.status === 503 &&
        /No save receipt/.test(error.message) &&
        !/private-provider/.test(error.message),
    );
  } finally {
    globalThis.fetch = original;
  }
});
