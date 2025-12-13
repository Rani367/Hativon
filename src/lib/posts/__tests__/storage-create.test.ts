import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostInput } from "@/types/post.types";

describe("Post Storage - Create Operations", () => {
  let mockDb: { query: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetModules();

    mockDb = {
      query: vi.fn(),
    };

    vi.doMock("@/lib/db/client", () => ({
      db: mockDb,
    }));

    vi.doMock("uuid", () => ({
      v4: vi.fn(() => "test-uuid-1234"),
    }));

    vi.doMock("@/lib/posts/queries", () => ({
      getPostById: vi.fn(),
    }));
  });

  describe("createPost", () => {
    it("creates post with auto-generated ID, slug, and description", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Test Post",
        slug: "test-post",
        content: "This is test content",
        cover_image: null,
        description: "This is test content",
        date: new Date("2025-01-01"),
        author: "Test Author",
        author_id: "user-123",
        author_grade: "י",
        author_class: 1,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Test Post",
        content: "This is test content",
        author: "Test Author",
        authorId: "user-123",
        authorGrade: "י",
        authorClass: 1,
      };

      const result = await createPost(input);

      expect(result.id).toBe("test-uuid-1234");
      expect(result.slug).toBe("test-post");
      expect(result.description).toBe("This is test content");
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("uses custom description when provided", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Test Post",
        slug: "test-post",
        content:
          "This is test content that is very long and would normally be truncated",
        cover_image: null,
        description: "Custom description",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Test Post",
        content:
          "This is test content that is very long and would normally be truncated",
        description: "Custom description",
      };

      const result = await createPost(input);

      expect(result.description).toBe("Custom description");
    });

    it("trims custom description whitespace", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Test Post",
        slug: "test-post",
        content: "Content",
        cover_image: null,
        description: "Trimmed description",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Test Post",
        content: "Content",
        description: "   Trimmed description   ",
      };

      const result = await createPost(input);

      expect(result.description).toBe("Trimmed description");
    });

    it("ignores empty custom description and auto-generates", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Test Post",
        slug: "test-post",
        content: "Auto-generated content",
        cover_image: null,
        description: "Auto-generated content",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Test Post",
        content: "Auto-generated content",
        description: "   ",
      };

      const result = await createPost(input);

      expect(result.description).toBe("Auto-generated content");
    });

    it("creates post with all optional fields", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Complete Post",
        slug: "complete-post",
        content: "Full content",
        cover_image: "https://example.com/image.jpg",
        description: "Full description",
        date: new Date("2025-01-01"),
        author: "Full Author",
        author_id: "user-456",
        author_grade: "ט",
        author_class: 3,
        tags: ["tag1", "tag2"],
        category: "News",
        status: "published",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Complete Post",
        content: "Full content",
        coverImage: "https://example.com/image.jpg",
        description: "Full description",
        author: "Full Author",
        authorId: "user-456",
        authorGrade: "ט",
        authorClass: 3,
        tags: ["tag1", "tag2"],
        category: "News",
        status: "published",
      };

      const result = await createPost(input);

      expect(result.coverImage).toBe("https://example.com/image.jpg");
      expect(result.tags).toEqual(["tag1", "tag2"]);
      expect(result.category).toBe("News");
      expect(result.status).toBe("published");
    });

    it("creates post with minimal fields (null author data)", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Minimal Post",
        slug: "minimal-post",
        content: "Minimal content",
        cover_image: null,
        description: "Minimal content",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Minimal Post",
        content: "Minimal content",
      };

      const result = await createPost(input);

      expect(result.author).toBeUndefined();
      expect(result.authorId).toBeUndefined();
      expect(result.coverImage).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it("defaults to draft status when not specified", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Draft Post",
        slug: "draft-post",
        content: "Content",
        cover_image: null,
        description: "Content",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Draft Post",
        content: "Content",
      };

      const result = await createPost(input);

      expect(result.status).toBe("draft");
    });

    it("throws error when database insertion fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDb.query.mockRejectedValue(dbError);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Failing Post",
        content: "Content",
      };

      await expect(createPost(input)).rejects.toThrow(
        "Database connection failed",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] Failed to create post:",
        dbError,
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles special characters in title", async () => {
      const mockRow = {
        id: "test-uuid-1234",
        title: "Test & Special <> Characters!",
        slug: "test-special-characters",
        content: "Content",
        cover_image: null,
        description: "Content",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Test & Special <> Characters!",
        content: "Content",
      };

      const result = await createPost(input);

      expect(result.slug).toBe("test-special-characters");
    });

    it("handles very long content", async () => {
      const longContent = "a".repeat(10000);
      const mockRow = {
        id: "test-uuid-1234",
        title: "Long Content Post",
        slug: "long-content-post",
        content: longContent,
        cover_image: null,
        description: longContent.substring(0, 160),
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      mockDb.query.mockResolvedValue({ rows: [mockRow] });

      const { createPost } = await import("../storage");

      const input: PostInput = {
        title: "Long Content Post",
        content: longContent,
      };

      const result = await createPost(input);

      expect(result.description.length).toBeLessThanOrEqual(160);
    });
  });
});
