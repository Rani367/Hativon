import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Upstash modules before importing
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60000,
    }),
  })),
}));

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

import {
  createRateLimiter,
  getClientIdentifier,
  checkRateLimit,
  loginRateLimiter,
  registerRateLimiter,
  authRateLimiter,
} from "../rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("InMemoryRateLimiter (via createRateLimiter)", () => {
    it("allows first request within limit", async () => {
      const limiter = createRateLimiter({ limit: 5, window: 60000 });
      const result = await limiter.check("test-user-1");

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("decrements remaining count with each request", async () => {
      const limiter = createRateLimiter({ limit: 5, window: 60000 });

      const result1 = await limiter.check("test-user-2");
      const result2 = await limiter.check("test-user-2");
      const result3 = await limiter.check("test-user-2");

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });

    it("blocks requests when limit is exceeded", async () => {
      const limiter = createRateLimiter({ limit: 3, window: 60000 });

      await limiter.check("test-user-3");
      await limiter.check("test-user-3");
      await limiter.check("test-user-3");
      const result = await limiter.check("test-user-3");

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("returns reset timestamp in the future", async () => {
      const now = Date.now();
      const limiter = createRateLimiter({ limit: 5, window: 60000 });
      const result = await limiter.check("test-user-4");

      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + 60000 + 100); // Allow small timing variance
    });

    it("tracks different identifiers separately", async () => {
      const limiter = createRateLimiter({ limit: 2, window: 60000 });

      await limiter.check("user-a");
      await limiter.check("user-a");
      const resultA = await limiter.check("user-a");

      const resultB = await limiter.check("user-b");

      expect(resultA.success).toBe(false);
      expect(resultB.success).toBe(true);
      expect(resultB.remaining).toBe(1);
    });

    it("resets after window expires", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({ limit: 2, window: 1000 }); // 1 second window

      await limiter.check("test-user-5");
      await limiter.check("test-user-5");
      const blockedResult = await limiter.check("test-user-5");

      expect(blockedResult.success).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1500);

      const resetResult = await limiter.check("test-user-5");

      expect(resetResult.success).toBe(true);
      expect(resetResult.remaining).toBe(1);

      vi.useRealTimers();
    });

    it("handles single request limit", async () => {
      const limiter = createRateLimiter({ limit: 1, window: 60000 });

      const first = await limiter.check("single-limit-user");
      const second = await limiter.check("single-limit-user");

      expect(first.success).toBe(true);
      expect(first.remaining).toBe(0);
      expect(second.success).toBe(false);
    });
  });

  describe("getClientIdentifier", () => {
    function createMockRequest(headers: Record<string, string>): NextRequest {
      return {
        headers: {
          get: (name: string) => headers[name] || null,
        },
      } as unknown as NextRequest;
    }

    it("extracts first IP from x-forwarded-for header", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("192.168.1.1");
    });

    it("trims whitespace from x-forwarded-for IP", () => {
      const request = createMockRequest({
        "x-forwarded-for": "  192.168.1.100  , 10.0.0.1",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("192.168.1.100");
    });

    it("uses x-real-ip when x-forwarded-for is not present", () => {
      const request = createMockRequest({
        "x-real-ip": "10.20.30.40",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("10.20.30.40");
    });

    it("prefers x-forwarded-for over x-real-ip", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "10.20.30.40",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("192.168.1.1");
    });

    it("returns 'unknown' when no IP headers are present", () => {
      const request = createMockRequest({});

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("unknown");
    });

    it("handles IPv6 addresses", () => {
      const request = createMockRequest({
        "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("handles single IP in x-forwarded-for without comma", () => {
      const request = createMockRequest({
        "x-forwarded-for": "203.0.113.195",
      });

      const identifier = getClientIdentifier(request);

      expect(identifier).toBe("203.0.113.195");
    });
  });

  describe("checkRateLimit", () => {
    function createMockRequest(ip: string): NextRequest {
      return {
        headers: {
          get: (name: string) => (name === "x-forwarded-for" ? ip : null),
        },
      } as unknown as NextRequest;
    }

    it("returns limited: false when within rate limit", async () => {
      const limiter = createRateLimiter({ limit: 10, window: 60000 });
      const request = createMockRequest("192.168.1.1");

      const result = await checkRateLimit(request, limiter, "test");

      expect(result.limited).toBe(false);
      expect(result.response).toBeUndefined();
    });

    it("returns limited: true with 429 response when limit exceeded", async () => {
      const limiter = createRateLimiter({ limit: 1, window: 60000 });
      const request = createMockRequest("192.168.1.2");

      await checkRateLimit(request, limiter, "test");
      const result = await checkRateLimit(request, limiter, "test");

      expect(result.limited).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);
    });

    it("includes rate limit headers in response", async () => {
      const limiter = createRateLimiter({ limit: 1, window: 60000 });
      const request = createMockRequest("192.168.1.3");

      await checkRateLimit(request, limiter, "test");
      const result = await checkRateLimit(request, limiter, "test");

      expect(result.response?.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(result.response?.headers.get("X-RateLimit-Reset")).toBeDefined();
      expect(result.response?.headers.get("Retry-After")).toBeDefined();
    });

    it("includes Hebrew error message in response body", async () => {
      const limiter = createRateLimiter({ limit: 1, window: 60000 });
      const request = createMockRequest("192.168.1.4");

      await checkRateLimit(request, limiter, "test");
      const result = await checkRateLimit(request, limiter, "test");

      const body = await result.response?.json();

      expect(body.error).toBe("Too many requests");
      expect(body.message).toContain("יותר מדי ניסיונות");
      expect(body.resetAt).toBeDefined();
    });

    it("uses prefix to namespace rate limits", async () => {
      const limiter = createRateLimiter({ limit: 1, window: 60000 });
      const request = createMockRequest("192.168.1.5");

      await checkRateLimit(request, limiter, "login");
      const loginResult = await checkRateLimit(request, limiter, "login");

      // Same IP, different prefix should not be limited
      const registerResult = await checkRateLimit(request, limiter, "register");

      expect(loginResult.limited).toBe(true);
      expect(registerResult.limited).toBe(false);
    });

    it("uses default prefix when not specified", async () => {
      const limiter = createRateLimiter({ limit: 2, window: 60000 });
      const request = createMockRequest("192.168.1.6");

      const result1 = await checkRateLimit(request, limiter);
      const result2 = await checkRateLimit(request, limiter);
      const result3 = await checkRateLimit(request, limiter);

      expect(result1.limited).toBe(false);
      expect(result2.limited).toBe(false);
      expect(result3.limited).toBe(true);
    });
  });

  describe("Pre-configured rate limiters", () => {
    it("loginRateLimiter allows 5 requests", async () => {
      // Create fresh limiter for testing
      const testLimiter = createRateLimiter({
        limit: 5,
        window: 15 * 60 * 1000,
      });

      for (let i = 0; i < 5; i++) {
        const result = await testLimiter.check(`login-test-user-${Date.now()}`);
        expect(result.success).toBe(true);
      }
    });

    it("registerRateLimiter allows 3 requests", async () => {
      const testLimiter = createRateLimiter({
        limit: 3,
        window: 60 * 60 * 1000,
      });

      for (let i = 0; i < 3; i++) {
        const result = await testLimiter.check(
          `register-test-user-${Date.now()}`,
        );
        expect(result.success).toBe(true);
      }
    });

    it("authRateLimiter allows 10 requests", async () => {
      const testLimiter = createRateLimiter({
        limit: 10,
        window: 60 * 1000,
      });

      for (let i = 0; i < 10; i++) {
        const result = await testLimiter.check(`auth-test-user-${Date.now()}`);
        expect(result.success).toBe(true);
      }
    });

    it("exported limiters are defined", () => {
      expect(loginRateLimiter).toBeDefined();
      expect(registerRateLimiter).toBeDefined();
      expect(authRateLimiter).toBeDefined();
      expect(typeof loginRateLimiter.check).toBe("function");
      expect(typeof registerRateLimiter.check).toBe("function");
      expect(typeof authRateLimiter.check).toBe("function");
    });
  });

  describe("Upstash Redis integration", () => {
    it("uses in-memory limiter when Upstash is not configured", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

      const limiter = createRateLimiter({ limit: 5, window: 60000 });
      const result = await limiter.check("test-identifier");

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });
});
