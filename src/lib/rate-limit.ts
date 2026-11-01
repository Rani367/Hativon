import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Limits are keyed so that a whole school behind one IP address isn't treated as
 * one person: logins by username and IP, uploads by user.
 *
 * Without Upstash this falls back to memory, which is per server instance and
 * barely limits anything in production.
 */
export const LIMITS = {
  login: { requests: 10, minutes: 15 },
  loginByIp: { requests: 200, minutes: 15 },
  signup: { requests: 60, minutes: 60 },
  wrongClassCode: { requests: 20, minutes: 15 },
  passwordReset: { requests: 20, minutes: 15 },
  upload: { requests: 40, minutes: 60 },
  search: { requests: 120, minutes: 1 },
  read: { requests: 300, minutes: 1 },
} as const;

type LimitName = keyof typeof LIMITS;

const memory = new Map<string, { count: number; resetAt: number }>();
const limiters = new Map<LimitName, Ratelimit>();

function getUpstashLimiter(name: LimitName): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  let limiter = limiters.get(name);
  if (!limiter) {
    const { requests, minutes } = LIMITS[name];
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(requests, `${minutes} m`),
      prefix: `hativon:${name}`,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

function isOverMemoryLimit(name: LimitName, key: string): boolean {
  const { requests, minutes } = LIMITS[name];
  const id = `${name}:${key}`;
  const now = Date.now();
  const entry = memory.get(id);

  if (!entry || now > entry.resetAt) {
    memory.set(id, { count: 1, resetAt: now + minutes * 60_000 });
    return false;
  }

  entry.count += 1;
  return entry.count > requests;
}

/** Counts one attempt and says whether it's over the limit. */
export async function isRateLimited(
  name: LimitName,
  key: string,
): Promise<boolean> {
  const limiter = getUpstashLimiter(name);
  if (!limiter) return isOverMemoryLimit(name, key);

  const { success } = await limiter.limit(key);
  return !success;
}

export async function getClientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
