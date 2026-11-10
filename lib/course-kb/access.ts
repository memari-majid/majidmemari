import { createHash, timingSafeEqual } from "node:crypto";

export function isCourseCodeAccepted(configured: string | undefined, supplied: string | null): boolean {
  if (!configured) return true;
  if (!supplied || supplied.length > 256) return false;
  return timingSafeEqual(createHash("sha256").update(configured).digest(), createHash("sha256").update(supplied).digest());
}

/** Best-effort single-process controls, NOT a distributed quota or billing ceiling.
 * Instances and cold starts have independent state. Enforce deployment-wide spend
 * limits at the Gateway/platform if needed; a configured code is an extra gate. */
export function createCourseAccess(options: { perClient?: number; global?: number; concurrent?: number; windowMs?: number; leaseMs?: number; clients?: number } = {}) {
  const limits = { perClient: 8, global: 120, concurrent: 4, windowMs: 600000, leaseMs: 65000, clients: 1000, ...options };
  const clients = new Map<string, number[]>(); let all: number[] = []; const active = new Map<symbol, number>();
  return {
    acquire(key: string, now = Date.now()): (() => void) | null {
      for (const [ip, hits] of clients) { const recent = hits.filter(t => now - t < limits.windowMs); if (recent.length) clients.set(ip, recent); else clients.delete(ip); }
      for (const [id, expires] of active) if (expires <= now) active.delete(id);
      all = all.filter(t => now - t < limits.windowMs);
      const hits = clients.get(key) ?? [];
      if (hits.length >= limits.perClient || all.length >= limits.global || active.size >= limits.concurrent || (!clients.has(key) && clients.size >= limits.clients)) return null;
      clients.set(key, [...hits, now]); all.push(now); const id = Symbol(); active.set(id, now + limits.leaseMs);
      return () => { active.delete(id); };
    },
  };
}
export const courseAccess = createCourseAccess();

export function courseClientKey(req: Request): string {
  // A proxy-provided IP is only an abuse hint, not identity/authentication.
  const ip = (req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim().slice(0, 128);
  return createHash("sha256").update(ip).digest("hex");
}
