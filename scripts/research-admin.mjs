#!/usr/bin/env node
/** Explicit private operator actions. No tokens, responses or credentials printed. */
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
registerHooks({
  resolve(specifier, context, next) {
    if (
      !context.parentURL?.includes("/node_modules/") &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !/\.(?:js|mjs|cjs|json|node|ts)$/i.test(specifier)
    )
      return next(`${specifier}.ts`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith(".ts")) return next(url, context);
    return {
      format: "module",
      source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), "utf8"), {
        mode: "transform",
      }),
      shortCircuit: true,
    };
  },
});
const [command, inputPath, outputPath] = process.argv.slice(2);
function privatePath(value) {
  if (!value) throw new Error("A private output path is required.");
  const p = resolve(value);
  if (
    p.startsWith(process.cwd() + "/") ||
    p.includes("/public/") ||
    p.includes("/.git/")
  )
    throw new Error("Write operator files outside the repository/public tree.");
  return p;
}
async function save(path, value) {
  const p = privatePath(path);
  await mkdir(dirname(p), { recursive: true, mode: 0o700 });
  await writeFile(p, JSON.stringify(value, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  console.log("Saved private operator result.");
}
try {
  if (command === "synthetic-init") {
    const dir = privatePath(inputPath);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const values = {
      NODE_ENV: "development",
      RESEARCH_MODE: "synthetic",
      RESEARCH_SYNTHETIC_ENABLED: "1",
      RESEARCH_SYNTHETIC_STORE: resolve(dir, "synthetic-records.json"),
      RESEARCH_ADMIN_BASE_URL: "http://localhost:3197",
      RESEARCH_COORDINATOR_TOKEN: randomBytes(32).toString("base64url"),
      RESEARCH_SCORER_TOKEN: randomBytes(32).toString("base64url"),
      RESEARCH_ANALYST_TOKEN: randomBytes(32).toString("base64url"),
      RESEARCH_PURGE_TOKEN: randomBytes(32).toString("base64url"),
    };
    await writeFile(
      resolve(dir, "synthetic.env"),
      Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
      { mode: 0o600, flag: "wx" },
    );
    await save(resolve(dir, "synthetic-enrollment.json"), {
      version: 1,
      requestId: "synthetic-enrollment-001",
      syntheticId: "synthetic-demo-001",
      attestation: {
        consentVersion: "synthetic-consent-not-approval",
        consentRecorded: true,
        eligibleAdult: true,
        coordinatorReference: "coord_synthetic001",
      },
    });
    console.log(
      "Created local synthetic-only configuration; no server started or research activated.",
    );
  } else if (command === "freeze") {
    const { researchFreeze, validateResearchManifest } = await import(
      "../lib/research/config.ts"
    );
    const manifest = validateResearchManifest(
      JSON.parse(await readFile(inputPath, "utf8")),
      false,
    );
    const model = process.env.RESEARCH_MODEL,
      commit = process.env.RESEARCH_FREEZE_ENGINE_COMMIT;
    if (!model || !commit)
      throw new Error("Explicit model and target engine commit are required.");
    await save(outputPath, researchFreeze(manifest, model, commit));
  } else if (command === "migrate") {
    if (
      process.env.RESEARCH_ALLOW_MIGRATION !==
        "explicit-private-db-migration" ||
      !process.env.RESEARCH_DATABASE_URL
    )
      throw new Error("Explicit migration configuration is required.");
    const { Pool } = await import("pg");
    const url = new URL(process.env.RESEARCH_DATABASE_URL);
    for (const k of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
      url.searchParams.delete(k);
    const pool = new Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      max: 1,
      connectionTimeoutMillis: 5000,
    });
    const client = await pool.connect();
    try {
      await client.query(
        await readFile(
          new URL("../lib/research/migration.sql", import.meta.url),
          "utf8",
        ),
      );
      console.log(
        "Private database migration completed; collection was not enabled.",
      );
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    const base = new URL(
      process.env.RESEARCH_ADMIN_BASE_URL ?? "http://localhost:3197",
    );
    if (
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !["http:", "https:"].includes(base.protocol)
    )
      throw new Error("Invalid operator server address.");
    const table = {
      status: ["GET", "session", null],
      enroll: ["POST", "session", "RESEARCH_COORDINATOR_TOKEN"],
      rotate: ["POST", "admin", "RESEARCH_COORDINATOR_TOKEN"],
      observe: ["POST", "admin", "RESEARCH_COORDINATOR_TOKEN"],
      "export-scoring": ["POST", "admin", "RESEARCH_SCORER_TOKEN"],
      "export-analysis": ["POST", "admin", "RESEARCH_ANALYST_TOKEN"],
      "purge-expired": ["POST", "admin", "RESEARCH_PURGE_TOKEN"],
      "delete-participant": ["POST", "admin", "RESEARCH_PURGE_TOKEN"],
    };
    const entry = table[command];
    if (!entry)
      throw new Error(
        "Commands: synthetic-init, status, enroll, rotate, observe, export-scoring, export-analysis, purge-expired, delete-participant.",
      );
    const [method, route, key] = entry;
    const headers = { "Content-Type": "application/json" };
    if (key) {
      const value = process.env[key];
      if (!value) throw new Error("Required role credential is missing.");
      headers.Authorization = `Bearer ${value}`;
    }
    let destination;
    if (command !== "status") {
      destination = privatePath(
        ["enroll", "rotate", "observe", "delete-participant"].includes(command)
          ? outputPath
          : (outputPath ?? inputPath),
      );
      try {
        await lstat(destination);
        throw new Error(
          "Choose a fresh private output file before sending an operator mutation.",
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    }
    let payload;
    if (
      ["enroll", "rotate", "observe", "delete-participant"].includes(command)
    ) {
      payload = JSON.parse(await readFile(inputPath, "utf8"));
    } else if (command !== "status") payload = { version: 1, action: command };
    const response = await fetch(new URL("/api/research/" + route, base), {
      method,
      headers,
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok)
      throw new Error(
        `Operator request rejected (${response.status}); no response body printed.`,
      );
    const result = await response.json();
    if (command === "status") console.log(JSON.stringify(result));
    else await save(destination, result);
  }
} catch {
  console.error(
    "Operator command failed. Check command, private input/configuration and server status; no private error body was printed.",
  );
  process.exitCode = 1;
}
