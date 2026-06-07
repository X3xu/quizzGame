// Simple in-memory sliding-window rate limiter.
// Works for single-instance deploys (e.g. one Vercel region).
// For multi-region production, swap this with Upstash Redis:
//   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

interface Entry { count: number; resetAt: number; }
const store = new Map<string, Entry>();

interface Options {
  maxRequests: number;
  windowMs:    number;
}

/** Returns true if the request should be blocked. */
export function rateLimit(key: string, { maxRequests, windowMs }: Options): boolean {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) return true;

  entry.count++;
  return false;
}
