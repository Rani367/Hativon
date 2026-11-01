import { beforeEach, describe, expect, it, mock } from "bun:test";

const query = mock(async (): Promise<unknown[]> => []);
mock.module("@/lib/db", () => ({ db: () => query }));

const { getArchiveMonths, getPublishedPost, getPublishedPostStamps, getPublishedPostsInRange } =
  await import("../queries");
const { getHomeIssue, getIssue, getIssueWithArticles, getIssues } = await import(
  "@/lib/issues/issues"
);

const row = {
  id: "post-1",
  title: "כותרת",
  description: "תיאור",
  content: "גוף",
  cover_image: "https://example.com/full.webp",
  word_count: 120,
  date: new Date("2026-06-14T10:00:00Z"),
  updated_at: new Date("2026-06-15T10:00:00Z"),
  author: "דנה",
  author_grade: "ז",
  author_class: 2,
  is_teacher_post: false,
  ai_generated_image: false,
  tags: null,
  category: null,
  author_deleted: false,
  is_creator_post: false,
};

describe("public queries", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async () => []);
  });

  it("maps a row to a post", async () => {
    query.mockImplementation(async () => [row]);

    const [post] = await getPublishedPostsInRange("a", "b");

    expect(post).toMatchObject({
      id: "post-1",
      coverImage: "https://example.com/full.webp",
      date: "2026-06-14T10:00:00.000Z",
      authorClass: 2,
      authorDeleted: false,
    });
  });

  it("treats empty columns as missing, not as empty strings", async () => {
    query.mockImplementation(async () => [
      { ...row, cover_image: "", author: null, author_grade: null },
    ]);

    const [post] = await getPublishedPostsInRange("a", "b");

    expect(post.coverImage).toBeUndefined();
    expect(post.author).toBeUndefined();
    expect(post.authorGrade).toBeUndefined();
  });

  it("returns null for an article that doesn't exist", async () => {
    expect(await getPublishedPost("missing")).toBeNull();
  });

  // The rule that stops an outage being cached as an empty page or a 404.
  describe("when the database fails", () => {
    const failure = new Error("database down");

    beforeEach(() => {
      query.mockImplementation(async () => {
        throw failure;
      });
    });

    const loaders: [string, () => Promise<unknown>][] = [
      ["getPublishedPostsInRange", () => getPublishedPostsInRange("a", "b")],
      ["getPublishedPost", () => getPublishedPost("rejects-1")],
      ["getArchiveMonths", () => getArchiveMonths()],
      ["getPublishedPostStamps", () => getPublishedPostStamps()],
      ["getIssue", () => getIssue(2026, 6)],
      ["getIssueWithArticles", () => getIssueWithArticles(2026, 6)],
      ["getIssues", () => getIssues()],
      ["getHomeIssue", () => getHomeIssue()],
    ];

    for (const [name, load] of loaders) {
      it(`${name} rejects instead of returning something empty`, async () => {
        await expect(load()).rejects.toThrow("database down");
      });
    }
  });
});
