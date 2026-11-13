/** Private durable state. File adapter is explicitly synthetic/local only. */
import { mkdir, open, readFile, rename, unlink, lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { ResearchError, type ResearchConfig } from "./config";
import type {
  ResearchAnswer,
  ResearchCompletion,
  ResearchExperiment,
  ResearchFeedback,
  ResearchQuestionCard,
  ResearchReceipt,
  ResearchStage,
} from "./types";
import type { ShiftSession } from "../course-kb/shift-session";

export type QuestionState = {
  startedAt: string;
  releaseBy: string;
  deadline: string;
  selectionStatus:
    | "not-requested"
    | "pending"
    | "success"
    | "failed"
    | "declined"
    | "planned-fixed";
  deliveryReason?: string;
  selected?: {
    question: ResearchQuestionCard;
    learnerQuote: string;
    modelId: string;
    usage: unknown;
    receivedAt: string;
  };
  releasedAt?: string;
  deliveredAt?: string;
  responseBy?: string;
  question?: ResearchQuestionCard;
  fallback?: boolean;
  response?: string;
  responseStatus?: "answered" | "declined" | "timed-out";
  respondedAt?: string;
};
export type ResearchObservation = {
  requestId: string;
  participantId: string;
  taskReached:
    | "start"
    | "inspect"
    | "confirm"
    | "explain"
    | "revise"
    | "C"
    | "export"
    | "finished";
  assistanceCategory:
    | "none"
    | "navigation"
    | "interpretation"
    | "access"
    | "technical";
  staffMinutes: number;
  workLossAssessed: boolean;
  workLost: boolean | null;
  interruption: boolean;
  accommodationNoted: boolean;
  receivedAt: string;
};
export type ResearchParticipant = {
  participantId: string;
  tokenHash: string;
  enrollmentRequestId: string;
  enrollmentDigest: string;
  studyId: string;
  protocolVersion: string;
  fingerprint: string;
  experiment: ResearchExperiment;
  assignedCondition: "A" | "F" | null;
  createdAt: string;
  startedAt: string | null;
  retentionUntil: string;
  withdrawnAt: string | null;
  consentVersion: string;
  coordinatorReference: string;
  responses: Partial<
    Record<
      ResearchStage,
      {
        receipt: ResearchReceipt;
        value: ResearchAnswer | ResearchFeedback | ResearchCompletion;
      }
    >
  >;
  checkpoint: ShiftSession | null;
  checkpointReceipt: ResearchReceipt | null;
  question: QuestionState | null;
  observations: ResearchObservation[];
  proposalAttempts: {
    run: 1 | 2;
    requestId: string;
    status: "reserved" | "complete" | "failed";
    response?: unknown;
  }[];
  requests: Record<
    string,
    { operation: string; digest: string; receipt?: ResearchReceipt }
  >;
};
export type ResearchDatabase = {
  version: 1;
  participants: ResearchParticipant[];
};
export interface ResearchStore {
  transaction<T>(work: (db: ResearchDatabase) => T | Promise<T>): Promise<T>;
}
const fresh = (): ResearchDatabase => ({ version: 1, participants: [] });
function parse(raw: string): ResearchDatabase {
  const x = JSON.parse(raw);
  if (x?.version !== 1 || !Array.isArray(x.participants))
    throw new ResearchError(
      503,
      "Private research store needs operator attention.",
    );
  return x;
}
export class FileResearchStore implements ResearchStore {
  readonly path: string;
  constructor(path: string) {
    this.path = resolve(path);
    if (
      this.path.includes("/public/") ||
      this.path.includes("/.git/") ||
      !path.startsWith("/")
    )
      throw new ResearchError(
        503,
        "Use a private absolute synthetic store path.",
      );
  }
  async transaction<T>(
    work: (db: ResearchDatabase) => T | Promise<T>,
  ): Promise<T> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const lock = this.path + ".lock";
    let handle;
    const end = Date.now() + 3000;
    while (!handle) {
      try {
        handle = await open(lock, "wx", 0o600);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST" || Date.now() > end)
          throw new ResearchError(
            503,
            "Private store is busy; retry the same request.",
          );
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    try {
      let db: ResearchDatabase;
      try {
        if ((await lstat(this.path)).isSymbolicLink())
          throw new ResearchError(
            503,
            "Synthetic store must not be a symlink.",
          );
        db = parse(await readFile(this.path, "utf8"));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        db = fresh();
      }
      const result = await work(db);
      const temp = this.path + "." + randomBytes(8).toString("hex") + ".tmp";
      const file = await open(temp, "wx", 0o600);
      try {
        await file.writeFile(JSON.stringify(db));
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temp, this.path);
      const directory = await open(dirname(this.path), "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
      return result;
    } finally {
      await handle.close();
      await unlink(lock);
    }
  }
}
export class PostgresResearchStore implements ResearchStore {
  constructor(readonly pool: Pool) {}
  async transaction<T>(
    work: (db: ResearchDatabase) => T | Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Fixed lock namespace serializes initial-row creation and all mutations.
      await client.query("SELECT pg_advisory_xact_lock(734920154)");
      const row = await client.query<{ state: ResearchDatabase }>(
        "SELECT state FROM private_research_state WHERE id = 1 FOR UPDATE",
      );
      if (row.rows.length !== 1)
        throw new ResearchError(
          503,
          "Research database migration is required.",
        );
      const db = parse(JSON.stringify(row.rows[0].state));
      const result = await work(db);
      await client.query(
        "UPDATE private_research_state SET state=$1::jsonb, updated_at=NOW() WHERE id=1",
        [JSON.stringify(db)],
      );
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
let cached: { url: string; store: PostgresResearchStore } | undefined;
export async function configuredResearchStore(
  config: ResearchConfig,
): Promise<ResearchStore> {
  if (config.mode === "synthetic" && config.filePath)
    return new FileResearchStore(config.filePath);
  if (config.mode !== "live" || !config.databaseUrl)
    throw new ResearchError(
      503,
      "Private durable research storage is unavailable.",
    );
  if (cached?.url === config.databaseUrl) return cached.store;
  const { Pool } = await import("pg");
  // Lazy: no connection or migration during module import / Next build.
  const url = new URL(config.databaseUrl);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  pool.on("error", () => {
    /* Subsequent requests fail closed; never log a private connection error. */
  });
  cached = { url: config.databaseUrl, store: new PostgresResearchStore(pool) };
  return cached.store;
}
