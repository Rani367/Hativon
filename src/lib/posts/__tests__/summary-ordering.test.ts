import { describe, it, expect, mock, beforeEach } from "bun:test";
import { getPostSummariesByMonth } from "@/lib/posts/queries";

const _g = globalThis as Record<string, unknown>;

/**
 * Joins a tagged-template `db.query` call's static strings into an
 * inspectable SQL string (placeholders are irrelevant here).
 */
function callToSql(call: unknown[]): string {
  return (call[0] as string[]).join(" ? ");
}

describe("getPostSummariesByMonth ordering", () => {
  beforeEach(() => {
    // Ensure the queries delegate runs the real implementation against the mock db.
    const realQueries = _g.__realPostsQueries as Record<
      string,
      (...args: unknown[]) => unknown
    >;
    _g.__postsQueriesGetPostSummariesByMonthMock =
      realQueries.getPostSummariesByMonth;
  });

  it("selects ai_generated_image and orders AI-generated images last", async () => {
    const calls: unknown[][] = [];
    const mockDbQuery = mock((...args: unknown[]) => {
      calls.push(args);
      // First query is the COUNT, the rest return rows.
      if (calls.length === 1) {
        return Promise.resolve({ rows: [{ count: "0" }] });
      }
      return Promise.resolve({ rows: [] });
    });
    _g.__dbQueryMock = mockDbQuery;

    await getPostSummariesByMonth(2026, 6);

    const mainQuery = calls.map(callToSql).find((sql) => sql.includes("ORDER BY"));
    expect(mainQuery).toBeDefined();
    expect(mainQuery).toContain("p.ai_generated_image,");
    expect(mainQuery).toContain("ai_generated_image ASC");
    // AI ordering must come before the cover-image priority so AI posts sink last.
    expect(mainQuery!.indexOf("ai_generated_image ASC")).toBeLessThan(
      mainQuery!.indexOf("cover_image IS NOT NULL"),
    );
  });
});
