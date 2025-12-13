/**
 * Simple in-memory cache with TTL support and LRU eviction
 * Used for caching database query results to reduce load
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

// Maximum number of entries in the cache
const DEFAULT_MAX_SIZE = 1000;

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize: number = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   * Updates lastAccessed for LRU tracking
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Set value in cache with TTL (in seconds)
   * Evicts least recently used entries if cache is full
   */
  set<T>(key: string, value: T, ttl: number): void {
    // If adding new entry would exceed max size, evict LRU entries
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      keys: Array.from(this.store.keys()),
    };
  }
}

/**
 * Global cache instance
 */
export const cache = new Cache();

/**
 * Memoize an async function with cache
 *
 * @param fn - Function to memoize
 * @param options - Cache options
 * @returns Memoized function
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    keyGenerator: (...args: Args) => string;
    ttl: number; // Time to live in seconds
  },
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    const key = options.keyGenerator(...args);

    const cached = cache.get<Result>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, options.ttl);

    return result;
  };
}

/**
 * Clear cache entries by prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  const stats = cache.getStats();
  stats.keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  });
}

/**
 * Setup periodic cleanup of expired cache entries
 * Run every 5 minutes
 */
if (typeof window === "undefined") {
  // Only run on server
  setInterval(
    () => {
      cache.clearExpired();
    },
    5 * 60 * 1000,
  );
}
