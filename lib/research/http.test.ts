import test from "node:test";
import assert from "node:assert/strict";
import { handleResearchRequest, researchOriginAllowed } from "./http";
import type { ResearchService } from "./service";

const env: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  RESEARCH_MODE: "synthetic",
  RESEARCH_SYNTHETIC_ENABLED: "1",
  RESEARCH_SYNTHETIC_STORE: "/tmp/synthetic-http-tests/state.json",
  RESEARCH_COORDINATOR_TOKEN: "c".repeat(40),
  RESEARCH_SCORER_TOKEN: "s".repeat(40),
  RESEARCH_ANALYST_TOKEN: "a".repeat(40),
  RESEARCH_PURGE_TOKEN: "p".repeat(40),
};
const req = (
  action: string,
  token?: string,
  input: unknown = {},
  extra: Record<string, string> = {},
) =>
  new Request(`http://localhost:3197/api/research/${action}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...extra,
    },
    body: JSON.stringify(input),
  });

test("only synthetic loopback aliases with the same protocol and port share an origin boundary", () => {
  const url = new URL("http://localhost:3197/api/research/response");
  for (const origin of [
    "http://localhost:3197",
    "http://127.0.0.1:3197",
    "http://[::1]:3197",
  ])
    assert.equal(researchOriginAllowed(origin, url, "synthetic"), true);
  for (const origin of [
    "null",
    "https://127.0.0.1:3197",
    "http://127.0.0.1:3198",
    "http://evil.example:3197",
    "http://localhost:3197@evil.example",
    "http://localhost:3197/path",
  ])
    assert.equal(researchOriginAllowed(origin, url, "synthetic"), false);
  assert.equal(
    researchOriginAllowed("http://127.0.0.1:3197", url, "live"),
    false,
  );
  assert.equal(
    researchOriginAllowed(
      "https://www.majidmemari.com",
      new URL("https://www.majidmemari.com/api/research/response"),
      "live",
    ),
    true,
  );
});

test("default-off rejects writes without constructing a store or parsing the body", async () => {
  let constructed = false;
  const factory = async () => {
    constructed = true;
    return {} as ResearchService;
  };
  const response = await handleResearchRequest(
    new Request("http://localhost/api/research/response", {
      method: "POST",
      body: "not-json",
    }),
    "response",
    { env: { NODE_ENV: "test" }, factory },
  );
  assert.equal(response.status, 404);
  assert.equal(constructed, false);
  const status = await handleResearchRequest(
    new Request("http://localhost/api/research/session"),
    "session",
    { env: { NODE_ENV: "test" }, factory },
  );
  assert.equal((await status.json()).status.available, false);
  assert.match(status.headers.get("cache-control")!, /no-store/);
});
test("URL tokens, foreign origins, wrong roles and unrecognized routes fail closed", async () => {
  const factory = async () => ({}) as ResearchService;
  assert.equal(
    (
      await handleResearchRequest(
        new Request("http://localhost/api/research/session?token=example"),
        "session",
        { env, factory },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleResearchRequest(
        req(
          "response",
          "rp_" + "z".repeat(40),
          {},
          { origin: "https://other.test" },
        ),
        "response",
        { env, factory },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleResearchRequest(
        req("session", "rp_" + "z".repeat(40)),
        "session",
        { env, factory },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleResearchRequest(
        req("admin", env.RESEARCH_COORDINATOR_TOKEN, {
          version: 1,
          action: "export-analysis",
        }),
        "admin",
        { env, factory },
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleResearchRequest(req("unknown"), "unknown", { env, factory }))
      .status,
    404,
  );
});
test("both declared and actual streaming bodies are bounded", async () => {
  const factory = async () => ({}) as ResearchService;
  assert.equal(
    (
      await handleResearchRequest(
        req(
          "session",
          env.RESEARCH_COORDINATOR_TOKEN,
          {},
          { "content-length": "999999" },
        ),
        "session",
        { env, factory },
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await handleResearchRequest(
        req("session", env.RESEARCH_COORDINATOR_TOKEN, {
          text: "x".repeat(330000),
        }),
        "session",
        { env, factory },
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await handleResearchRequest(
        req(
          "session",
          env.RESEARCH_COORDINATOR_TOKEN,
          {},
          { "content-type": "text/plain" },
        ),
        "session",
        { env, factory },
      )
    ).status,
    415,
  );
});
test("unexpected service failures never echo provider/database secrets", async () => {
  const factory = async () =>
    ({
      session: async () => {
        throw new Error("secret-connection-string");
      },
    }) as unknown as ResearchService;
  const response = await handleResearchRequest(
    new Request("http://localhost/api/research/session", {
      headers: { authorization: "Bearer rp_" + "z".repeat(40) },
    }),
    "session",
    { env, factory },
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret-connection-string/);
});
test("synthetic configuration cannot be used in production or on Vercel", async () => {
  for (const blocked of [
    { ...env, NODE_ENV: "production" as const },
    { ...env, VERCEL: "1" },
  ]) {
    const response = await handleResearchRequest(
      new Request("http://localhost/api/research/session"),
      "session",
      { env: blocked },
    );
    assert.equal(response.status, 503);
  }
});
