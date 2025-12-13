/**
 * Performance tests for post fetching
 * These tests enforce strict timing requirements to ensure instant loading
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QueryResult, QueryResultRow } from "pg";

// Mock the database client
vi.mock("@/lib/db/client", () => ({
  db: {
    query: vi.fn(),
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
}));

import { db } from "@/lib/db/client";
import {
  getPosts,
  getPostById,
  getPostBySlug,
  getPostsByMonth,
  getArchiveMonths,
  getPostStats,
} from "../queries";

// Helper to create a properly typed mock QueryResult
function mockQueryResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return {
    rows,
    command: "SELECT",
    rowCount: rows.length,
    oid: 0,
    fields: [],
  };
}

// Strict timing requirements (in milliseconds)
const TIMING_REQUIREMENTS = {
  // Single post fetch should be under 50ms
  SINGLE_POST_MAX_MS: 50,
  // List of posts should be under 100ms
  POST_LIST_MAX_MS: 100,
  // Archive months query should be under 50ms
  ARCHIVE_MONTHS_MAX_MS: 50,
  // Stats query should be under 50ms
  STATS_MAX_MS: 50,
};

// Helper to measure execution time
async function measureTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

// Mock post data
const mockPostRow = {
  id: "test-id-123",
  title: "Test Post",
  slug: "test-post",
  content: "Test content",
  cover_image: null,
  description: "Test description",
  date: new Date(),
  author: "Test Author",
  author_id: "author-123",
  author_grade: null,
  author_class: null,
  tags: [],
  category: null,
  status: "published",
  created_at: new Date(),
  updated_at: new Date(),
  author_deleted: false,
};

describe("Post Fetching Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Single Post Queries", () => {
    it(`getPostById completes under ${TIMING_REQUIREMENTS.SINGLE_POST_MAX_MS}ms`, async () => {
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([mockPostRow]));

      const { timeMs } = await measureTime(() => getPostById("test-id"));

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.SINGLE_POST_MAX_MS);
    });

    it(`getPostBySlug completes under ${TIMING_REQUIREMENTS.SINGLE_POST_MAX_MS}ms`, async () => {
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([mockPostRow]));

      const { timeMs } = await measureTime(() => getPostBySlug("test-slug"));

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.SINGLE_POST_MAX_MS);
    });

    it("getPostById returns null for non-existent post quickly", async () => {
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([]));

      const { result, timeMs } = await measureTime(() =>
        getPostById("non-existent"),
      );

      expect(result).toBeNull();
      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.SINGLE_POST_MAX_MS);
    });
  });

  describe("Post List Queries", () => {
    it(`getPosts (all) completes under ${TIMING_REQUIREMENTS.POST_LIST_MAX_MS}ms`, async () => {
      const manyPosts = Array(100)
        .fill(mockPostRow)
        .map((p, i) => ({
          ...p,
          id: `post-${i}`,
          slug: `post-${i}`,
        }));
      vi.mocked(db.query).mockResolvedValue(mockQueryResult(manyPosts));

      const { timeMs } = await measureTime(() => getPosts(false));

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });

    it(`getPosts (published only) completes under ${TIMING_REQUIREMENTS.POST_LIST_MAX_MS}ms`, async () => {
      const manyPosts = Array(100)
        .fill(mockPostRow)
        .map((p, i) => ({
          ...p,
          id: `post-${i}`,
          slug: `post-${i}`,
        }));
      vi.mocked(db.query).mockResolvedValue(mockQueryResult(manyPosts));

      const { timeMs } = await measureTime(() => getPosts(true));

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });

    it(`getPostsByMonth completes under ${TIMING_REQUIREMENTS.POST_LIST_MAX_MS}ms`, async () => {
      const monthPosts = Array(50)
        .fill(mockPostRow)
        .map((p, i) => ({
          ...p,
          id: `post-${i}`,
          slug: `post-${i}`,
        }));
      vi.mocked(db.query).mockResolvedValue(mockQueryResult(monthPosts));

      const { timeMs } = await measureTime(() => getPostsByMonth(2025, 12));

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });

    it("handles empty results quickly", async () => {
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([]));

      const { result, timeMs } = await measureTime(() => getPosts(true));

      expect(result).toEqual([]);
      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });
  });

  describe("Archive Queries", () => {
    it(`getArchiveMonths completes under ${TIMING_REQUIREMENTS.ARCHIVE_MONTHS_MAX_MS}ms`, async () => {
      const archiveData = [
        { year: 2025, month: 12, count: "10" },
        { year: 2025, month: 11, count: "15" },
        { year: 2025, month: 10, count: "8" },
        { year: 2024, month: 12, count: "12" },
      ];
      vi.mocked(db.query).mockResolvedValue(mockQueryResult(archiveData));

      const { timeMs } = await measureTime(() => getArchiveMonths());

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.ARCHIVE_MONTHS_MAX_MS);
    });
  });

  describe("Stats Queries", () => {
    it(`getPostStats completes under ${TIMING_REQUIREMENTS.STATS_MAX_MS}ms`, async () => {
      const statsData = {
        total: "100",
        published: "80",
        drafts: "20",
        today: "5",
        this_week: "15",
        this_month: "30",
      };
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([statsData]));

      const { timeMs } = await measureTime(() => getPostStats());

      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.STATS_MAX_MS);
    });
  });

  describe("Error Handling Performance", () => {
    it("handles database errors quickly without hanging", async () => {
      vi.mocked(db.query).mockRejectedValue(new Error("Connection timeout"));

      const { result, timeMs } = await measureTime(() => getPosts(true));

      // Should return empty array on error, not hang
      expect(result).toEqual([]);
      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });

    it("handles missing table error gracefully and quickly", async () => {
      vi.mocked(db.query).mockRejectedValue(
        new Error('relation "posts" does not exist'),
      );

      const { result, timeMs } = await measureTime(() => getPosts(true));

      expect(result).toEqual([]);
      expect(timeMs).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    });
  });

  describe("Concurrent Query Performance", () => {
    it("handles multiple concurrent queries efficiently", async () => {
      vi.mocked(db.query).mockResolvedValue(mockQueryResult([mockPostRow]));

      const start = performance.now();

      // Run 10 queries concurrently
      await Promise.all([
        getPostById("id-1"),
        getPostById("id-2"),
        getPostById("id-3"),
        getPostBySlug("slug-1"),
        getPostBySlug("slug-2"),
        getPosts(true),
        getPosts(false),
        getArchiveMonths(),
        getPostStats(),
        getPostsByMonth(2025, 12),
      ]);

      const totalTime = performance.now() - start;

      // All 10 queries running concurrently should complete under 200ms
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe("Data Transformation Performance", () => {
    it("transforms large result sets quickly", async () => {
      // 500 posts - a realistic large dataset
      const largePosts = Array(500)
        .fill(mockPostRow)
        .map((p, i) => ({
          ...p,
          id: `post-${i}`,
          slug: `post-${i}`,
          title: `Post Title ${i}`,
          content: `Content for post ${i}. `.repeat(100), // ~2KB per post
          tags: ["tag1", "tag2", "tag3"],
        }));
      vi.mocked(db.query).mockResolvedValue(mockQueryResult(largePosts));

      const { result, timeMs } = await measureTime(() => getPosts(false));

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(500);
      }
      // Even with 500 posts, should complete under 200ms
      expect(timeMs).toBeLessThan(200);
    });
  });
});

describe("Cached Query Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cached functions have minimal overhead", async () => {
    vi.mocked(db.query).mockResolvedValue(mockQueryResult([mockPostRow]));

    // Import cached versions
    const { getCachedPostsByMonth, getCachedArchiveMonths } =
      await import("../cached-queries");

    const { timeMs: cachedTime } = await measureTime(() =>
      getCachedPostsByMonth(2025, 12),
    );
    const { timeMs: archiveTime } = await measureTime(() =>
      getCachedArchiveMonths(),
    );

    // Cached versions should still be fast
    expect(cachedTime).toBeLessThan(TIMING_REQUIREMENTS.POST_LIST_MAX_MS);
    expect(archiveTime).toBeLessThan(TIMING_REQUIREMENTS.ARCHIVE_MONTHS_MAX_MS);
  });
});
