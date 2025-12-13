import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cache, memoize, clearCacheByPrefix } from "../cache";

describe("Cache", () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("cache.get", () => {
    it("returns undefined for non-existent key", () => {
      const result = cache.get("nonexistent");
      expect(result).toBeUndefined();
    });

    it("returns stored value", () => {
      cache.set("key1", "value1", 60);
      const result = cache.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("returns undefined for expired key", () => {
      cache.set("expiring", "value", 1); // 1 second TTL

      vi.advanceTimersByTime(2000); // 2 seconds

      const result = cache.get("expiring");
      expect(result).toBeUndefined();
    });

    it("returns value just before expiration", () => {
      cache.set("almost-expired", "value", 10);

      vi.advanceTimersByTime(9999); // Just under 10 seconds

      const result = cache.get<string>("almost-expired");
      expect(result).toBe("value");
    });

    it("handles different value types", () => {
      cache.set("string", "hello", 60);
      cache.set("number", 42, 60);
      cache.set("object", { foo: "bar" }, 60);
      cache.set("array", [1, 2, 3], 60);
      cache.set("boolean", true, 60);
      cache.set("null", null, 60);

      expect(cache.get<string>("string")).toBe("hello");
      expect(cache.get<number>("number")).toBe(42);
      expect(cache.get<{ foo: string }>("object")).toEqual({ foo: "bar" });
      expect(cache.get<number[]>("array")).toEqual([1, 2, 3]);
      expect(cache.get<boolean>("boolean")).toBe(true);
      expect(cache.get<null>("null")).toBeNull();
    });

    it("deletes expired entry on access", () => {
      cache.set("to-delete", "value", 1);

      vi.advanceTimersByTime(2000);

      cache.get("to-delete");

      const stats = cache.getStats();
      expect(stats.keys).not.toContain("to-delete");
    });
  });

  describe("cache.set", () => {
    it("stores value with TTL", () => {
      cache.set("new-key", "new-value", 60);

      const result = cache.get<string>("new-key");
      expect(result).toBe("new-value");
    });

    it("overwrites existing value", () => {
      cache.set("overwrite", "original", 60);
      cache.set("overwrite", "updated", 60);

      const result = cache.get<string>("overwrite");
      expect(result).toBe("updated");
    });

    it("resets TTL when value is updated", () => {
      cache.set("reset-ttl", "value", 5);

      vi.advanceTimersByTime(4000); // 4 seconds

      cache.set("reset-ttl", "value", 10);

      vi.advanceTimersByTime(6000); // 6 more seconds (10 total from start)

      const result = cache.get<string>("reset-ttl");
      expect(result).toBe("value"); // Should still be valid
    });

    it("handles zero TTL", () => {
      cache.set("zero-ttl", "value", 0);

      vi.advanceTimersByTime(1); // 1ms

      const result = cache.get("zero-ttl");
      expect(result).toBeUndefined();
    });

    it("handles very large TTL", () => {
      const oneDaySeconds = 86400;
      cache.set("large-ttl", "value", oneDaySeconds);

      vi.advanceTimersByTime(oneDaySeconds * 1000 - 1000); // 1 second before expiry

      const result = cache.get<string>("large-ttl");
      expect(result).toBe("value");
    });
  });

  describe("cache.delete", () => {
    it("removes existing key", () => {
      cache.set("to-remove", "value", 60);
      cache.delete("to-remove");

      const result = cache.get("to-remove");
      expect(result).toBeUndefined();
    });

    it("does not throw for non-existent key", () => {
      expect(() => cache.delete("nonexistent")).not.toThrow();
    });
  });

  describe("cache.clear", () => {
    it("removes all entries", () => {
      cache.set("key1", "value1", 60);
      cache.set("key2", "value2", 60);
      cache.set("key3", "value3", 60);

      cache.clear();

      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
      expect(cache.get("key3")).toBeUndefined();
    });

    it("resets cache size to zero", () => {
      cache.set("key1", "value1", 60);
      cache.set("key2", "value2", 60);

      cache.clear();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe("cache.clearExpired", () => {
    it("removes only expired entries", () => {
      cache.set("expired1", "value1", 1);
      cache.set("expired2", "value2", 2);
      cache.set("valid", "value3", 60);

      vi.advanceTimersByTime(3000); // 3 seconds

      cache.clearExpired();

      expect(cache.get("expired1")).toBeUndefined();
      expect(cache.get("expired2")).toBeUndefined();
      expect(cache.get<string>("valid")).toBe("value3");
    });

    it("keeps non-expired entries", () => {
      cache.set("keep1", "value1", 60);
      cache.set("keep2", "value2", 120);

      cache.clearExpired();

      expect(cache.get<string>("keep1")).toBe("value1");
      expect(cache.get<string>("keep2")).toBe("value2");
    });

    it("handles empty cache", () => {
      expect(() => cache.clearExpired()).not.toThrow();
    });
  });

  describe("cache.getStats", () => {
    it("returns correct size", () => {
      cache.set("key1", "value1", 60);
      cache.set("key2", "value2", 60);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it("returns list of keys", () => {
      cache.set("alpha", "value", 60);
      cache.set("beta", "value", 60);
      cache.set("gamma", "value", 60);

      const stats = cache.getStats();
      expect(stats.keys).toContain("alpha");
      expect(stats.keys).toContain("beta");
      expect(stats.keys).toContain("gamma");
    });

    it("returns empty stats for empty cache", () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe("memoize", () => {
    it("caches function result", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const memoized = memoize(fn, {
        keyGenerator: (arg: string) => `key:${arg}`,
        ttl: 60,
      });

      await memoized("input");
      await memoized("input");
      await memoized("input");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("returns cached result on subsequent calls", async () => {
      const fn = vi.fn().mockResolvedValue("expensive-result");
      const memoized = memoize(fn, {
        keyGenerator: (arg: string) => `memo:${arg}`,
        ttl: 60,
      });

      const result1 = await memoized("test");
      const result2 = await memoized("test");

      expect(result1).toBe("expensive-result");
      expect(result2).toBe("expensive-result");
    });

    it("uses different cache keys for different arguments", async () => {
      const fn = vi.fn().mockImplementation((arg: string) =>
        Promise.resolve(`result-${arg}`),
      );
      const memoized = memoize(fn, {
        keyGenerator: (arg: string) => `key:${arg}`,
        ttl: 60,
      });

      const result1 = await memoized("a");
      const result2 = await memoized("b");

      expect(fn).toHaveBeenCalledTimes(2);
      expect(result1).toBe("result-a");
      expect(result2).toBe("result-b");
    });

    it("re-fetches after TTL expires", async () => {
      const fn = vi.fn().mockResolvedValue("fresh");
      const memoized = memoize(fn, {
        keyGenerator: () => "ttl-test",
        ttl: 5, // 5 seconds
      });

      await memoized();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(6000); // 6 seconds

      await memoized();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("handles functions with multiple arguments", async () => {
      const fn = vi.fn().mockImplementation((a: number, b: number) =>
        Promise.resolve(a + b),
      );
      const memoized = memoize(fn, {
        keyGenerator: (a: number, b: number) => `sum:${a}:${b}`,
        ttl: 60,
      });

      const result = await memoized(2, 3);
      expect(result).toBe(5);

      await memoized(2, 3);
      expect(fn).toHaveBeenCalledTimes(1);

      await memoized(3, 4);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("handles async function errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Failed"));
      const memoized = memoize(fn, {
        keyGenerator: () => "error-test",
        ttl: 60,
      });

      await expect(memoized()).rejects.toThrow("Failed");
    });

    it("does not cache rejected promises", async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("First call failed"));
        }
        return Promise.resolve("success");
      });

      const memoized = memoize(fn, {
        keyGenerator: () => "retry-test",
        ttl: 60,
      });

      await expect(memoized()).rejects.toThrow("First call failed");
      const result = await memoized();
      expect(result).toBe("success");
    });
  });

  describe("clearCacheByPrefix", () => {
    it("clears all entries with matching prefix", () => {
      cache.set("posts:1", "value1", 60);
      cache.set("posts:2", "value2", 60);
      cache.set("posts:3", "value3", 60);
      cache.set("users:1", "user1", 60);

      clearCacheByPrefix("posts:");

      expect(cache.get("posts:1")).toBeUndefined();
      expect(cache.get("posts:2")).toBeUndefined();
      expect(cache.get("posts:3")).toBeUndefined();
      expect(cache.get<string>("users:1")).toBe("user1");
    });

    it("does nothing with non-matching prefix", () => {
      cache.set("keep:1", "value1", 60);
      cache.set("keep:2", "value2", 60);

      clearCacheByPrefix("delete:");

      expect(cache.get<string>("keep:1")).toBe("value1");
      expect(cache.get<string>("keep:2")).toBe("value2");
    });

    it("handles empty cache", () => {
      expect(() => clearCacheByPrefix("any:")).not.toThrow();
    });

    it("clears entries with exact prefix match", () => {
      cache.set("prefix", "value1", 60);
      cache.set("prefix:sub", "value2", 60);
      cache.set("prefixOther", "value3", 60);

      clearCacheByPrefix("prefix:");

      expect(cache.get<string>("prefix")).toBe("value1");
      expect(cache.get("prefix:sub")).toBeUndefined();
      expect(cache.get<string>("prefixOther")).toBe("value3");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string keys", () => {
      cache.set("", "empty-key", 60);
      expect(cache.get<string>("")).toBe("empty-key");
    });

    it("handles special characters in keys", () => {
      cache.set("key:with/special~chars!", "value", 60);
      expect(cache.get<string>("key:with/special~chars!")).toBe("value");
    });

    it("handles Hebrew characters in keys", () => {
      cache.set("מפתח:עברית", "ערך", 60);
      expect(cache.get<string>("מפתח:עברית")).toBe("ערך");
    });

    it("handles undefined value explicitly set", () => {
      cache.set("undefined-value", undefined, 60);
      // undefined is a valid cached value, so it should return undefined
      // but the cache returns undefined for both "not found" and "found undefined"
      const result = cache.get("undefined-value");
      expect(result).toBeUndefined();
    });

    it("handles very short TTL", () => {
      cache.set("short-ttl", "value", 0.001); // 1 millisecond

      vi.advanceTimersByTime(2);

      expect(cache.get("short-ttl")).toBeUndefined();
    });

    it("maintains separate entries for similar keys", () => {
      cache.set("user", "base", 60);
      cache.set("user1", "one", 60);
      cache.set("user11", "eleven", 60);
      cache.set("users", "plural", 60);

      expect(cache.get<string>("user")).toBe("base");
      expect(cache.get<string>("user1")).toBe("one");
      expect(cache.get<string>("user11")).toBe("eleven");
      expect(cache.get<string>("users")).toBe("plural");
    });
  });
});
