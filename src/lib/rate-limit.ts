/**
 * Rate limiting utilities
 * Uses Upstash Redis in production, in-memory fallback for development
 */

import { NextRequest } from 'next/server';

/**
 * In-memory rate limiter for local development
 */
class InMemoryRateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  check(
    identifier: string,
    limit: number,
    window: number
  ): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    // Clean expired entries
    if (entry && now > entry.resetAt) {
      this.attempts.delete(identifier);
    }

    const current = this.attempts.get(identifier);

    if (!current) {
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + window,
      });
      return {
        success: true,
        remaining: limit - 1,
        reset: now + window,
      };
    }

    if (current.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: current.resetAt,
      };
    }

    current.count += 1;
    return {
      success: true,
      remaining: limit - current.count,
      reset: current.resetAt,
    };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Time window in milliseconds
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Create a rate limiter
 * Uses Upstash Redis if configured, falls back to in-memory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash && typeof window === 'undefined') {
    // Use Upstash Redis in production
    try {
      const { Ratelimit } = require('@upstash/ratelimit');
      const { Redis } = require('@upstash/redis');

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.window}ms`),
      });

      return {
        async check(identifier: string): Promise<RateLimitResult> {
          const result = await ratelimit.limit(identifier);
          return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
          };
        },
      };
    } catch {
      console.warn('[WARNING] Upstash Redis configuration error, falling back to in-memory rate limiting');
    }
  }

  // Fallback to in-memory rate limiter
  return {
    async check(identifier: string): Promise<RateLimitResult> {
      return Promise.resolve(
        inMemoryLimiter.check(identifier, config.limit, config.window)
      );
    },
  };
}

/**
 * Get client identifier from request
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Pre-configured rate limiters
 */

// Login attempts: 5 requests per 15 minutes
export const loginRateLimiter = createRateLimiter({
  limit: 5,
  window: 15 * 60 * 1000,
});

// Registration: 3 requests per hour
export const registerRateLimiter = createRateLimiter({
  limit: 3,
  window: 60 * 60 * 1000,
});

// General auth: 10 requests per minute
export const authRateLimiter = createRateLimiter({
  limit: 10,
  window: 60 * 1000,
});

/**
 * Helper to handle rate limit in API routes
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>,
  prefix = 'ratelimit'
): Promise<{ limited: boolean; response?: Response }> {
  const identifier = getClientIdentifier(request);
  const result = await limiter.check(`${prefix}:${identifier}`);

  if (!result.success) {
    const resetDate = new Date(result.reset);
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.',
          resetAt: resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limiter),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.reset),
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        }
      ),
    };
  }

  return { limited: false };
}
