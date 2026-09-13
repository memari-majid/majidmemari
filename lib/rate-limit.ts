/**
 * Durable per-IP and site-wide counters for the chat route: a requests-per-
 * minute limiter, USD spend budgets reserved before the model runs and
 * settled afterwards, a cap on outbound emails started from chat, and a
 * 24-hour memory of tool call ids whose email already went out, so a retried
 * request cannot send the same hand-off twice.
 *
 * Backend: Upstash Redis over REST when the Marketplace variables are present
 * (`KV_REST_API_*` first, then `UPSTASH_REDIS_REST_*`), otherwise an in-memory
 * store that only guards one warm instance. Only the body-form pipeline is
 * used (`POST {url}/pipeline` with a JSON array of commands): keys contain
 * `:` and must never go in the URL path. `/pipeline` is not atomic, which is
 * fine for counters whose keys embed the time bucket; a refund is a second
 * pipeline call and can race by at most one request. Every REST call is
 * bounded by `LIMITER_TIMEOUT_MS`; a timeout counts as a transport failure
 * and falls back to the in-memory store for that call.
 *
 * Client IPs never reach a key: every visitor-scoped key embeds `ipHash(ip)`
 * instead, so the keyspace carries no personal data and every route buckets
 * one visitor the same way.
 *
 * Server-only. Reads env lazily on the first `getRateLimiter()` call so
 * importing this module has no side effects. Never import from a client
 * component.
 */

import { createHash } from "node:crypto";
import {
  EMAIL_PER_IP_PER_DAY,
  EMAIL_SITE_PER_DAY,
  EVAL_CACHE_TTL_SECONDS,
  EVAL_RUNS_PER_IP_PER_DAY,
  GLOBAL_EVAL_USD_PER_DAY,
  GLOBAL_HARD_BUDGET_USD,
  GLOBAL_SOFT_BUDGET_USD,
  IP_DAILY_BUDGET_USD,
  LIMITER_TIMEOUT_MS,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/chat-limits";

export type LimiterBackend = "upstash" | "memory";

type Command = Array<string | number>;

export interface CounterStore {
  readonly backend: LimiterBackend;
  /** Runs commands in order and returns one result per command. Throws on transport failure. */
  pipeline(commands: Command[]): Promise<unknown[]>;
}

export type RateCheck = { limited: boolean; count: number; backend: LimiterBackend };

export type BudgetReservation =
  | {
      ok: true;
      /** True when the global soft budget is exceeded: route to the fallback model. */
      fallback: boolean;
      estimateUsd: number;
      ipUsd: number;
      globalUsd: number;
      backend: LimiterBackend;
      /**
       * Refund or top up against actual spend. Runs once: it is the only path
       * that may lower the reservation, so a second call is ignored.
       */
      settle(actualUsd: number): Promise<void>;
      /**
       * Only ever adds, and stays open after `settle`. Used on abort, where
       * the actual spend is a lower bound, and by a leg that lands after the
       * request was already reconciled: pass the running total and the
       * difference against what is already charged is what gets added.
       */
      topUp(actualUsd: number): Promise<void>;
    }
  | {
      ok: false;
      reason: "ip-budget" | "hard-budget";
      ipUsd: number;
      globalUsd: number;
      backend: LimiterBackend;
    };

export type EmailReservation = {
  allowed: boolean;
  reason?: "ip" | "site";
  backend: LimiterBackend;
};

export type SendClaim = {
  /** True the first time this id is claimed within the TTL; false on a replay. */
  first: boolean;
  count: number;
  backend: LimiterBackend;
};

export type EvalRunReservation =
  | {
      ok: true;
      estimateUsd: number;
      /** Live-run spend today, site-wide, including this reservation. */
      evalUsd: number;
      runsToday: number;
      backend: LimiterBackend;
      /**
       * Reconciles the eval sub-budget against what a finished run actually
       * cost. Runs once, and is the only path that may lower the reservation.
       */
      settle(actualUsd: number): Promise<void>;
      /**
       * Settles a run that was abandoned or failed. Only ever adds: the
       * prompts were already sent to the gateway, so the estimate stays
       * charged and the sub-budget is never credited back for spend that
       * really happened.
       *
       * Stays open after `settle`, because an abandoned run's legs keep
       * landing after it was reconciled. The caller passes its running total
       * and only the difference against what is already charged is added, so
       * a late leg is billed once and never twice.
       */
      topUp(actualUsd: number): Promise<void>;
      /**
       * Gives the run count back. Only for a refusal that happened before any
       * model was called: a run where a model ran keeps its count whether or
       * not the visitor stayed to read it, so this is never reached from a
       * failure or an abandonment. Runs once, and never touches the spend.
       */
      release(): Promise<void>;
    }
  | {
      ok: false;
      reason: "ip-runs" | "eval-budget";
      evalUsd: number;
      runsToday: number;
      backend: LimiterBackend;
    };

export interface RateLimiter {
  readonly backend: LimiterBackend;
  checkRate(ip: string): Promise<RateCheck>;
  reserveBudget(ip: string, estimateUsd: number): Promise<BudgetReservation>;
  reserveEmail(ip: string): Promise<EmailReservation>;
  /**
   * Idempotency claim for one outbound send, keyed by the SDK's tool call id
   * and remembered for `SENT_TTL_S`. A request retried after a dropped
   * connection carries the same tool call, finds the id claimed, and must not
   * send again. Throws only when both stores fail; callers fail open.
   */
  claimSend(id: string): Promise<SendClaim>;
  /** Undoes a claim whose send did not happen, so a later retry may try again. */
  releaseSend(id: string): Promise<void>;
  /**
   * Allowance for one live evaluation run: a per-IP daily count and the
   * site-wide eval sub-budget. This is in addition to `reserveBudget`, which
   * every model call still passes through and which owns the hard cap.
   *
   * The run count is spent on reservation and is never given back once a
   * model has been called, including when the run fails or the visitor
   * abandons it: a run that called the models cost real money whether or not
   * the visitor stayed to read it. The one exception is `release()`, for a
   * refusal that happened before anything was called, where keeping the count
   * would charge a visitor for a run that never existed.
   */
  reserveEvalRun(ip: string, estimateUsd: number): Promise<EvalRunReservation>;
  /** Stores a finished run so the same scenario is replayed, not rerun, for a day. */
  rememberRun(key: string, payload: string): Promise<void>;
  /** Returns a stored run, or undefined when nothing is cached or the store is unreadable. */
  recallRun(key: string): Promise<string | undefined>;
}

const DAY_TTL_S = 2 * 24 * 60 * 60;
/** How long a sent tool call id is remembered; longer than any transcript survives in the widget. */
const SENT_TTL_S = 24 * 60 * 60;
const MINUTE_TTL_S = 120;
const MICRO = 1_000_000;

const toMicro = (usd: number) => Math.max(0, Math.round(usd * MICRO));
const fromMicro = (micro: number) => micro / MICRO;
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

/**
 * The visitor half of a key. A raw IP is personal data and the Upstash
 * keyspace is shared infrastructure, so only a truncated SHA-256 of it is
 * ever written. Twelve hex characters is 48 bits: collisions across one day's
 * visitors are negligible, and a collision costs a shared allowance, not a
 * leak. Exported so a route that builds its own per-visitor key (the eval run
 * cache) buckets a visitor exactly the way the counters do.
 */
export function ipHash(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

function dayBucket(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
}

function minuteBucket(now = Date.now()): number {
  return Math.floor(now / 60_000);
}

/* ------------------------------------------------------------------------ */
/* In-memory store                                                           */
/* ------------------------------------------------------------------------ */

class MemoryStore implements CounterStore {
  readonly backend = "memory" as const;
  /**
   * Values are counters except for the cached eval run, which is a JSON
   * string written with SET. Counter commands read whatever is there through
   * `num()`, so a mixed key can never throw.
   */
  private readonly values = new Map<string, { value: number | string; expiresAt: number | null }>();

  async pipeline(commands: Command[]): Promise<unknown[]> {
    const now = Date.now();
    if (this.values.size > 5_000) this.sweep(now);
    return commands.map((c) => this.run(c, now));
  }

  private get(key: string, now: number) {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt != null && entry.expiresAt <= now) {
      this.values.delete(key);
      return undefined;
    }
    return entry;
  }

  private run(command: Command, now: number): unknown {
    const [op, key, arg] = command;
    const k = String(key);
    switch (String(op).toUpperCase()) {
      case "INCR":
      case "INCRBY": {
        const by = op === "INCR" ? 1 : num(arg);
        const entry = this.get(k, now) ?? { value: 0, expiresAt: null };
        const next = num(entry.value) + by;
        entry.value = next;
        this.values.set(k, entry);
        return next;
      }
      case "SET": {
        // Only the `SET key value EX seconds` form is used.
        const [, , value, , ttl] = command;
        const seconds = num(ttl);
        this.values.set(k, {
          value: String(value ?? ""),
          expiresAt: seconds > 0 ? now + seconds * 1000 : null,
        });
        return "OK";
      }
      case "EXPIRE": {
        const entry = this.get(k, now);
        if (!entry) return 0;
        entry.expiresAt = now + num(arg) * 1000;
        return 1;
      }
      case "GET": {
        const entry = this.get(k, now);
        return entry ? String(entry.value) : null;
      }
      case "DEL":
        return this.get(k, now) && this.values.delete(k) ? 1 : 0;
      default:
        throw new Error(`MemoryStore: unsupported command ${String(op)}`);
    }
  }

  private sweep(now: number) {
    for (const [key, entry] of this.values) {
      if (entry.expiresAt != null && entry.expiresAt <= now) this.values.delete(key);
    }
  }
}

/* ------------------------------------------------------------------------ */
/* Upstash REST store                                                        */
/* ------------------------------------------------------------------------ */

class UpstashStore implements CounterStore {
  readonly backend = "upstash" as const;
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  /**
   * Bounded by `LIMITER_TIMEOUT_MS`: a hung endpoint must throw (so the
   * limiter's in-memory fallback engages) rather than stall the chat request
   * past its maxDuration. The timeout rejects with a TimeoutError, which the
   * caller's catch treats like any other transport failure.
   */
  async pipeline(commands: Command[]): Promise<unknown[]> {
    const res = await fetch(`${this.url.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      cache: "no-store",
      signal: AbortSignal.timeout(LIMITER_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Upstash pipeline failed with HTTP ${res.status}`);
    const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(data) || data.length !== commands.length) {
      throw new Error("Upstash pipeline returned an unexpected shape");
    }
    return data.map((item) => {
      if (item && typeof item === "object" && typeof item.error === "string") {
        throw new Error(`Upstash command error: ${item.error}`);
      }
      return item?.result;
    });
  }
}

/* ------------------------------------------------------------------------ */
/* Limiter                                                                   */
/* ------------------------------------------------------------------------ */

const PREFIX = "chat";

export function createRateLimiter(primary: CounterStore, fallback: CounterStore = new MemoryStore()): RateLimiter {
  let lastFailureLog = 0;

  /** Runs on the primary store; on transport failure degrades to the fallback for this call. */
  async function run(commands: Command[]): Promise<{ results: unknown[]; backend: LimiterBackend }> {
    if (primary === fallback) {
      return { results: await fallback.pipeline(commands), backend: fallback.backend };
    }
    try {
      return { results: await primary.pipeline(commands), backend: primary.backend };
    } catch (err) {
      const now = Date.now();
      if (now - lastFailureLog > 60_000) {
        lastFailureLog = now;
        console.error("[rate-limit] primary store failed; using in-memory fallback for now:", err);
      }
      return { results: await fallback.pipeline(commands), backend: fallback.backend };
    }
  }

  return {
    backend: primary.backend,

    async checkRate(ip) {
      const key = `${PREFIX}:rate:${ipHash(ip)}:${minuteBucket()}`;
      const { results, backend } = await run([
        ["INCR", key],
        ["EXPIRE", key, MINUTE_TTL_S],
      ]);
      const count = num(results[0]);
      return { limited: count > RATE_LIMIT_PER_MINUTE, count, backend };
    },

    async reserveBudget(ip, estimateUsd) {
      const day = dayBucket();
      const ipKey = `${PREFIX}:spend:ip:${ipHash(ip)}:${day}`;
      const allKey = `${PREFIX}:spend:all:${day}`;
      const estimate = toMicro(estimateUsd);

      // Increment first, refuse and refund second: parallel requests at the
      // edge of a cap cannot all slip through, and the hard cap cannot be
      // overshot by more than one request's estimate.
      const { results, backend } = await run([
        ["INCRBY", ipKey, estimate],
        ["EXPIRE", ipKey, DAY_TTL_S],
        ["INCRBY", allKey, estimate],
        ["EXPIRE", allKey, DAY_TTL_S],
      ]);
      const ipTotal = num(results[0]);
      const allTotal = num(results[2]);

      const refuse = async (reason: "ip-budget" | "hard-budget"): Promise<BudgetReservation> => {
        await run([
          ["INCRBY", ipKey, -estimate],
          ["INCRBY", allKey, -estimate],
        ]);
        return {
          ok: false,
          reason,
          ipUsd: fromMicro(ipTotal - estimate),
          globalUsd: fromMicro(allTotal - estimate),
          backend,
        };
      };

      if (allTotal > toMicro(GLOBAL_HARD_BUDGET_USD)) return refuse("hard-budget");
      if (ipTotal > toMicro(IP_DAILY_BUDGET_USD)) return refuse("ip-budget");

      let settled = false;
      /**
       * What the counters are currently holding for this reservation. Every
       * adjustment is the difference against this, never against the estimate,
       * so a top up that lands after the reconciliation charges the new spend
       * once instead of charging the whole running total a second time.
       */
      let chargedMicro = estimate;
      const adjust = async (deltaMicro: number) => {
        if (deltaMicro === 0) return;
        await run([
          ["INCRBY", ipKey, deltaMicro],
          ["INCRBY", allKey, deltaMicro],
        ]);
      };

      return {
        ok: true,
        fallback: allTotal > toMicro(GLOBAL_SOFT_BUDGET_USD),
        estimateUsd: fromMicro(estimate),
        ipUsd: fromMicro(ipTotal),
        globalUsd: fromMicro(allTotal),
        backend,
        async settle(actualUsd) {
          if (settled) return;
          settled = true;
          const target = toMicro(actualUsd);
          const delta = target - chargedMicro;
          // Booked before the await: two legs racing here must not both read
          // the same starting point and adjust twice.
          chargedMicro = target;
          await adjust(delta);
        },
        async topUp(actualUsd) {
          const target = toMicro(actualUsd);
          if (target <= chargedMicro) return;
          const delta = target - chargedMicro;
          chargedMicro = target;
          settled = true;
          await adjust(delta);
        },
      };
    },

    async reserveEmail(ip) {
      const day = dayBucket();
      const ipKey = `${PREFIX}:email:ip:${ipHash(ip)}:${day}`;
      const allKey = `${PREFIX}:email:all:${day}`;
      const { results, backend } = await run([
        ["INCR", ipKey],
        ["EXPIRE", ipKey, DAY_TTL_S],
        ["INCR", allKey],
        ["EXPIRE", allKey, DAY_TTL_S],
      ]);
      const ipCount = num(results[0]);
      const allCount = num(results[2]);
      if (allCount > EMAIL_SITE_PER_DAY || ipCount > EMAIL_PER_IP_PER_DAY) {
        await run([
          ["INCRBY", ipKey, -1],
          ["INCRBY", allKey, -1],
        ]);
        return { allowed: false, reason: allCount > EMAIL_SITE_PER_DAY ? "site" : "ip", backend };
      }
      return { allowed: true, backend };
    },

    async claimSend(id) {
      // INCR plus EXPIRE works on both stores; a replay sees a count above one.
      // An unreadable count reads as 0, which counts as first: fail open.
      const key = `${PREFIX}:sent:${id}`;
      const { results, backend } = await run([
        ["INCR", key],
        ["EXPIRE", key, SENT_TTL_S],
      ]);
      const count = num(results[0]);
      return { first: count <= 1, count, backend };
    },

    async releaseSend(id) {
      // Nothing was sent for this id, whatever the count says (a replay may
      // have bumped it while the original send was still failing), so the
      // key goes away rather than being decremented.
      const key = `${PREFIX}:sent:${id}`;
      await run([["DEL", key]]);
    },

    async reserveEvalRun(ip, estimateUsd) {
      const day = dayBucket();
      const runKey = `${PREFIX}:eval:runs:${ipHash(ip)}:${day}`;
      const spendKey = `${PREFIX}:eval:spend:${day}`;
      const estimate = toMicro(estimateUsd);

      // Count and spend go up first, refuse and refund second, so parallel
      // taps at the edge of the allowance cannot all slip through.
      const { results, backend } = await run([
        ["INCR", runKey],
        ["EXPIRE", runKey, DAY_TTL_S],
        ["INCRBY", spendKey, estimate],
        ["EXPIRE", spendKey, DAY_TTL_S],
      ]);
      const runsToday = num(results[0]);
      const evalTotal = num(results[2]);

      const refuse = async (reason: "ip-runs" | "eval-budget"): Promise<EvalRunReservation> => {
        await run([
          ["INCRBY", runKey, -1],
          ["INCRBY", spendKey, -estimate],
        ]);
        return {
          ok: false,
          reason,
          evalUsd: fromMicro(evalTotal - estimate),
          runsToday: runsToday - 1,
          backend,
        };
      };

      if (runsToday > EVAL_RUNS_PER_IP_PER_DAY) return refuse("ip-runs");
      if (evalTotal > toMicro(GLOBAL_EVAL_USD_PER_DAY)) return refuse("eval-budget");

      let settled = false;
      let released = false;
      /** As in `reserveBudget`: what the sub-budget is holding right now. */
      let chargedMicro = estimate;
      const adjust = async (deltaMicro: number) => {
        if (deltaMicro === 0) return;
        await run([["INCRBY", spendKey, deltaMicro]]);
      };

      return {
        ok: true,
        estimateUsd: fromMicro(estimate),
        evalUsd: fromMicro(evalTotal),
        runsToday,
        backend,
        async settle(actualUsd) {
          if (settled) return;
          settled = true;
          const target = toMicro(actualUsd);
          const delta = target - chargedMicro;
          chargedMicro = target;
          await adjust(delta);
        },
        async topUp(actualUsd) {
          // The run did not finish, so `actualUsd` is a lower bound on what
          // the gateway billed. Refunding the difference would let an
          // abandoned run spend outside the daily eval allowance, so this only
          // ever adds. It stays open after `settle` because the legs of an
          // abandoned run keep landing afterwards, and it charges the
          // difference against what is already held rather than the whole
          // running total.
          const target = toMicro(actualUsd);
          if (target <= chargedMicro) return;
          const delta = target - chargedMicro;
          chargedMicro = target;
          settled = true;
          await adjust(delta);
        },
        async release() {
          // The run count only. The spend is `settle`'s to give back, and the
          // caller does both on a refusal that called no model.
          if (released) return;
          released = true;
          await run([["INCRBY", runKey, -1]]);
        },
      };
    },

    async rememberRun(key, payload) {
      await run([["SET", `${PREFIX}:eval:run:${key}`, payload, "EX", EVAL_CACHE_TTL_SECONDS]]);
    },

    async recallRun(key) {
      const { results } = await run([["GET", `${PREFIX}:eval:run:${key}`]]);
      const value = results[0];
      return typeof value === "string" && value.length > 0 ? value : undefined;
    },
  };
}

let limiter: RateLimiter | undefined;

/**
 * Singleton per warm instance. Env is read here, on first use, never at
 * import time. The Vercel Marketplace (Upstash) writes `KV_REST_API_*` when
 * installed without a custom prefix; the plain Upstash names are the manual
 * alternative.
 */
export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    limiter = createRateLimiter(new UpstashStore(url, token));
  } else {
    if (process.env.VERCEL_ENV === "production") {
      console.warn(
        "[rate-limit] No Upstash credentials (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN). Chat limits and budgets are per-instance memory only.",
      );
    }
    const memory = new MemoryStore();
    limiter = createRateLimiter(memory, memory);
  }
  return limiter;
}

/** Test seam: replaces the singleton. */
export function setRateLimiterForTests(next: RateLimiter | undefined): void {
  limiter = next;
}

export { MemoryStore };
