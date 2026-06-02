import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

let mockGetPostSummariesByMonth: ReturnType<typeof mock>;
const _g = globalThis as Record<string, unknown>;

function createRequest(url: string): NextRequest {
  return { url } as NextRequest;
}

describe("GET /api/posts", () => {
  beforeEach(() => {
    // The route resolves through getIssue. With no merge configured, getIssue's
    // no-merge path calls getPostSummariesByMonth from @/lib/posts/queries.
    // Pin the DB mock so the settings read (merged_issues) returns nothing.
    _g.__dbQueryMock = mock(() => Promise.resolve({ rows: [] }));

    mockGetPostSummariesByMonth = mock(() =>
      Promise.resolve({
        posts: [],
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false,
      }),
    );

    _g.__postsQueriesGetPostSummariesByMonthMock = mockGetPostSummariesByMonth;
  });

  it("returns paginated post summaries for a valid month", async () => {
    mockGetPostSummariesByMonth.mockResolvedValue({
      posts: [
        {
          id: "post-1",
          title: "Title",
          coverImage: "https://example.com/posts/1/full.webp",
          description: "Description",
          wordCount: 42,
          date: "2026-05-01T00:00:00.000Z",
          status: "published",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
      total: 1,
      limit: 12,
      offset: 0,
      hasMore: false,
    });

    const { GET } = await import("../route");
    const response = await GET(
      createRequest("https://example.com/api/posts?year=2026&month=may"),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0]).not.toHaveProperty("content");
    expect(data.posts[0]).not.toHaveProperty("status");
    expect(data.posts[0]).not.toHaveProperty("createdAt");
    expect(data.posts[0]).not.toHaveProperty("updatedAt");
    expect(mockGetPostSummariesByMonth).toHaveBeenCalledWith(2026, 5, {
      limit: 12,
      offset: 0,
    });
  });

  it("supports explicit pagination", async () => {
    const { GET } = await import("../route");
    await GET(
      createRequest(
        "https://example.com/api/posts?year=2026&month=may&limit=6&offset=12",
      ),
    );

    expect(mockGetPostSummariesByMonth).toHaveBeenCalledWith(2026, 5, {
      limit: 6,
      offset: 12,
    });
  });

  it("rejects invalid month parameters", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      createRequest("https://example.com/api/posts?year=2026&month=not-a-month"),
    );

    expect(response.status).toBe(400);
    expect(mockGetPostSummariesByMonth).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      createRequest("https://example.com/api/posts?year=2026&month=may&limit=99"),
    );

    expect(response.status).toBe(400);
    expect(mockGetPostSummariesByMonth).not.toHaveBeenCalled();
  });
});
