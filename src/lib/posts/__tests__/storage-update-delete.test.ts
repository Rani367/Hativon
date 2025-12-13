import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Post Storage - Update and Delete Operations", () => {
  let mockDb: { query: ReturnType<typeof vi.fn> };
  let mockGetPostById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();

    mockDb = {
      query: vi.fn(),
    };

    mockGetPostById = vi.fn();

    vi.doMock("@/lib/db/client", () => ({
      db: mockDb,
    }));

    vi.doMock("uuid", () => ({
      v4: vi.fn(() => "test-uuid-1234"),
    }));

    vi.doMock("@/lib/posts/queries", () => ({
      getPostById: mockGetPostById,
    }));
  });

  describe("updatePost", () => {
    it("updates post with partial data", async () => {
      const existingPost = {
        id: "post-123",
        title: "Original Title",
        slug: "original-title",
        content: "Original content",
        description: "Original content",
        date: "2025-01-01T00:00:00.000Z",
        status: "draft",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      mockGetPostById.mockResolvedValue(existingPost);

      const updatedRow = {
        id: "post-123",
        title: "Updated Title",
        slug: "updated-title",
        content: "Original content",
        cover_image: null,
        description: "Original content",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-02"),
      };

      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", { title: "Updated Title" });

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Updated Title");
      expect(result?.slug).toBe("updated-title");
      expect(mockGetPostById).toHaveBeenCalledWith("post-123");
    });

    it("regenerates slug when title changes", async () => {
      mockGetPostById.mockResolvedValue({
        id: "post-123",
        title: "Old Title",
        slug: "old-title",
      });

      const updatedRow = {
        id: "post-123",
        title: "New Title",
        slug: "new-title",
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
        updated_at: new Date("2025-01-02"),
      };

      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", { title: "New Title" });

      expect(result?.slug).toBe("new-title");
    });

    it("regenerates description when content changes", async () => {
      mockGetPostById.mockResolvedValue({
        id: "post-123",
        content: "Old content",
        description: "Old content",
      });

      const newContent = "New content for the post";
      const updatedRow = {
        id: "post-123",
        title: "Title",
        slug: "title",
        content: newContent,
        cover_image: null,
        description: newContent,
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-02"),
      };

      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", { content: newContent });

      expect(result?.description).toBe(newContent);
    });

    it("returns null for non-existent post", async () => {
      mockGetPostById.mockResolvedValue(null);

      const { updatePost } = await import("../storage");

      const result = await updatePost("non-existent", { title: "New Title" });

      expect(result).toBeNull();
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it("updates all fields independently", async () => {
      mockGetPostById.mockResolvedValue({ id: "post-123" });

      const updatedRow = {
        id: "post-123",
        title: "Title",
        slug: "title",
        content: "Content",
        cover_image: "new-image.jpg",
        description: "Content",
        date: new Date("2025-01-01"),
        author: "New Author",
        author_id: "user-999",
        author_grade: "ח",
        author_class: 2,
        tags: ["new", "tags"],
        category: "Tech",
        status: "published",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-02"),
      };

      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", {
        coverImage: "new-image.jpg",
        author: "New Author",
        authorId: "user-999",
        authorGrade: "ח",
        authorClass: 2,
        tags: ["new", "tags"],
        category: "Tech",
        status: "published",
      });

      expect(result?.coverImage).toBe("new-image.jpg");
      expect(result?.author).toBe("New Author");
      expect(result?.authorId).toBe("user-999");
      expect(result?.authorGrade).toBe("ח");
      expect(result?.authorClass).toBe(2);
      expect(result?.tags).toEqual(["new", "tags"]);
      expect(result?.category).toBe("Tech");
      expect(result?.status).toBe("published");
    });

    it("returns null when update query returns no rows", async () => {
      mockGetPostById.mockResolvedValue({ id: "post-123" });
      mockDb.query.mockResolvedValue({ rows: [] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", { title: "New Title" });

      expect(result).toBeNull();
    });

    it("throws error when database update fails", async () => {
      mockGetPostById.mockResolvedValue({ id: "post-123" });

      const dbError = new Error("Update failed");
      mockDb.query.mockRejectedValue(dbError);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { updatePost } = await import("../storage");

      await expect(
        updatePost("post-123", { title: "New Title" }),
      ).rejects.toThrow("Update failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] Failed to update post:",
        dbError,
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles empty update object", async () => {
      mockGetPostById.mockResolvedValue({ id: "post-123" });

      const updatedRow = {
        id: "post-123",
        title: "Title",
        slug: "title",
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
        updated_at: new Date("2025-01-02"),
      };

      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const { updatePost } = await import("../storage");

      const result = await updatePost("post-123", {});

      expect(result).not.toBeNull();
    });
  });

  describe("deletePost", () => {
    it("returns true when post is successfully deleted", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      const { deletePost } = await import("../storage");

      const result = await deletePost("post-123");

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("returns false when post is not found", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 0 });

      const { deletePost } = await import("../storage");

      const result = await deletePost("non-existent");

      expect(result).toBe(false);
    });

    it("returns false when database deletion fails", async () => {
      const dbError = new Error("Delete failed");
      mockDb.query.mockRejectedValue(dbError);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { deletePost } = await import("../storage");

      const result = await deletePost("post-123");

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] Failed to delete post:",
        dbError,
      );

      consoleErrorSpy.mockRestore();
    });

    it("handles multiple row deletion (returns true for rowCount > 0)", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 2 });

      const { deletePost } = await import("../storage");

      const result = await deletePost("post-123");

      expect(result).toBe(true);
    });
  });
});
