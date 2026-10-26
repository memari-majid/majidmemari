export const WORKSHOP_RATE_LIMIT = 20;
export const WORKSHOP_RATE_WINDOW_MS = 10 * 60 * 1000;

export function isWorkshopCodeAccepted(
  configured: string | undefined,
  provided: string | null | undefined,
): boolean {
  if (configured == null || configured === "") return true;
  return provided === configured;
}

export function createWorkshopRateLimiter(
  limit = WORKSHOP_RATE_LIMIT,
  windowMs = WORKSHOP_RATE_WINDOW_MS,
) {
  const hits = new Map<string, number[]>();

  return {
    allow(ip: string, now = Date.now()): boolean {
      const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < windowMs);
      if (recent.length >= limit) {
        hits.set(ip, recent);
        return false;
      }
      recent.push(now);
      hits.set(ip, recent);
      return true;
    },
  };
}

const workshopLimiter = createWorkshopRateLimiter();

export function allowWorkshopChat(ip: string, now = Date.now()): boolean {
  return workshopLimiter.allow(ip, now);
}
