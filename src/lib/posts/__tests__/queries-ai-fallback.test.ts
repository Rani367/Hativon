import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getPostSummariesByMonth,
  getPostsByMonth,
  getPostsByAuthor,
} from "@/lib/posts/queries";

// db.query delegates to globalThis.__dbQueryMock (see test.setup.ts).
const _g = globalThis as Record<string, unknown>;

function missingColumnError(): Error & { code: string } {
  const e = new Error(
    "column p.is_ai_generated does not exist",
  ) as Error & { code: string };
  e.code = "42703";
  return e;
}

function sqlOf(args: unknown[]): string {
  const strings = args[0];
  return Array.isArray(strings) ? strings.join(" ") : String(strings);
}

const baseRow = {
  id: "p1",
  title: "Post",
  content: "hello world body",
  cover_image: null,
  description: "desc",
  word_count: 3,
  date: new Date("2026-04-10"),
  author: null,
  author_id: null,
  author_grade: null,
  author_class: null,
  author_deleted: false,
  is_teacher_post: false,
  tags: [],
  category: null,
  status: "published",
  created_at: new Date("2026-04-10"),
  updated_at: new Date("2026-04-10"),
};

describe("public feed queries fall back when is_ai_generated is missing", () => {
  beforeEach(() => {
    // Reject any query that references the not-yet-migrated column; otherwise
    // resolve. COUNT(*) returns a count row.
    _g.__dbQueryMock = mock((...args: unknown[]) => {
      const sql = sqlOf(args);
      if (sql.includes("COUNT(*)")) {
        return Promise.resolve({ rows: [{ count: "1" }] });
      }
      if (sql.includes("is_ai_generated")) {
        return Promise.reject(missingColumnError());
      }
      return Promise.resolve({ rows: [baseRow] });
    });
  });

  it("getPostSummariesByMonth retries without the AI column", async () => {
    const result = await getPostSummariesByMonth(2026, 4);
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].id).toBe("p1");
    expect(result.posts[0].isAiGenerated).toBe(false);
    expect(result.total).toBe(1);
  });

  it("getPostsByMonth retries without the AI column", async () => {
    const posts = await getPostsByMonth(2026, 4);
    expect(posts).toHaveLength(1);
    expect(posts[0].isAiGenerated).toBe(false);
  });

  it("getPostsByAuthor retries without the AI column", async () => {
    const posts = await getPostsByAuthor("user-1");
    expect(posts).toHaveLength(1);
    expect(posts[0].isAiGenerated).toBe(false);
  });

  it("does not swallow unrelated errors as a missing-column fallback", async () => {
    _g.__dbQueryMock = mock((...args: unknown[]) => {
      const sql = sqlOf(args);
      if (sql.includes("COUNT(*)")) {
        return Promise.resolve({ rows: [{ count: "1" }] });
      }
      // A non-42703 failure on every attempt -> returns empty (outer catch).
      return Promise.reject(new Error("connection reset"));
    });

    const result = await getPostSummariesByMonth(2026, 4);
    expect(result.posts).toHaveLength(0);
  });
});
