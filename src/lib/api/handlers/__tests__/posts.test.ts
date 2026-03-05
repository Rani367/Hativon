import { describe, it, expect, beforeEach, mock } from "bun:test";

// @/lib/posts barrel and @/lib/logger are mocked via global delegates in test/setup.ts
// next/cache is also mocked in setup.ts

import { handleGetPost, handleUpdatePost, handleDeletePost } from "../posts";
import { revalidateTag } from "next/cache";

// Access global delegates for assertions and mock control
const _g = globalThis as Record<string, unknown>;

// Local references to delegates for convenient mock control
let mockGetPostById: ReturnType<typeof mock>;
let mockUpdatePost: ReturnType<typeof mock>;
let mockDeletePost: ReturnType<typeof mock>;
let mockCanUserEditPost: ReturnType<typeof mock>;
let mockCanUserDeletePost: ReturnType<typeof mock>;
import type { Post } from "@/types/post.types";

const mockPost: Post = {
  id: "post-123",
  title: "Test Post",
  content: "Test content",
  description: "Test description",
  date: "2024-01-01",
  authorId: "user-456",
  author: "Test Author",
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("Post Handlers", () => {
  beforeEach(() => {
    mockGetPostById = mock(() => undefined);
    mockUpdatePost = mock(() => undefined);
    mockDeletePost = mock(() => undefined);
    mockCanUserEditPost = mock(() => undefined);
    mockCanUserDeletePost = mock(() => undefined);
    _g.__postsBarrelGetPostByIdMock = mockGetPostById;
    _g.__postsBarrelUpdatePostMock = mockUpdatePost;
    _g.__postsBarrelDeletePostMock = mockDeletePost;
    _g.__postsBarrelCanUserEditPostMock = mockCanUserEditPost;
    _g.__postsBarrelCanUserDeletePostMock = mockCanUserDeletePost;
    _g.__logErrorMock = mock(() => undefined);
    (revalidateTag as ReturnType<typeof mock>).mockReset();
  });

  describe("handleGetPost", () => {
    it("returns post when user is admin", async () => {
      mockGetPostById.mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", undefined, true);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("post-123");
      expect(mockGetPostById).toHaveBeenCalledWith("post-123");
    });

    it("returns post when user is the owner", async () => {
      mockGetPostById.mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("post-123");
    });

    it("returns 403 when user is not owner and not admin", async () => {
      mockGetPostById.mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", "different-user", false);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("returns 403 when userId is undefined and not admin", async () => {
      mockGetPostById.mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", undefined, false);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("returns 404 when post not found", async () => {
      mockGetPostById.mockResolvedValue(null);

      const response = await handleGetPost("nonexistent", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database error", async () => {
      mockGetPostById.mockRejectedValue(new Error("Database error"));

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to fetch post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });
  });

  describe("handleUpdatePost", () => {
    const validUpdateBody = {
      title: "Updated Title",
      content: "Updated content",
    };

    it("updates post when user has permission", async () => {
      const updatedPost = { ...mockPost, title: "Updated Title" };
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockResolvedValue(updatedPost);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.title).toBe("Updated Title");
      // Now passes existing post as 4th argument to avoid N+1 query
      expect(mockCanUserEditPost).toHaveBeenCalledWith(
        "user-456",
        "post-123",
        false,
        mockPost,
      );
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("updates post when admin", async () => {
      const updatedPost = { ...mockPost, title: "Updated Title" };
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockResolvedValue(updatedPost);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        undefined,
        true,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(mockCanUserEditPost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
        mockPost,
      );
    });

    it("returns 403 when user cannot edit post", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(false);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "different-user",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(body.error).toContain("only edit your own posts");
    });

    it("returns 400 for invalid update data", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);

      const invalidBody = {
        title: "", // Empty title is invalid
      };

      const response = await handleUpdatePost(
        "post-123",
        invalidBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid post data");
      expect(body.errors).toBeDefined();
    });

    it("returns 400 when body is empty object", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);

      const response = await handleUpdatePost(
        "post-123",
        {},
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid post data");
    });

    it("returns 404 when post not found during update", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockResolvedValue(null);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database error", async () => {
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockRejectedValue(new Error("Database error"));

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to update post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });

    it("validates content length", async () => {
      mockCanUserEditPost.mockResolvedValue(true);

      const longContent = "a".repeat(50001); // Exceeds 50000 char limit
      const response = await handleUpdatePost(
        "post-123",
        { content: longContent },
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.errors).toBeDefined();
    });

    it("allows partial updates with valid fields", async () => {
      const updatedPost = { ...mockPost, status: "draft" as const };
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockResolvedValue(updatedPost);

      const response = await handleUpdatePost(
        "post-123",
        { status: "draft" },
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe("draft");
    });
  });

  describe("handleDeletePost", () => {
    it("deletes post when user has permission", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserDeletePost.mockResolvedValue(true);
      mockDeletePost.mockResolvedValue(true);

      const response = await handleDeletePost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      // Now passes existing post as 4th argument to avoid N+1 query
      expect(mockCanUserDeletePost).toHaveBeenCalledWith(
        "user-456",
        "post-123",
        false,
        mockPost,
      );
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("deletes post when admin", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserDeletePost.mockResolvedValue(true);
      mockDeletePost.mockResolvedValue(true);

      const response = await handleDeletePost("post-123", undefined, true);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockCanUserDeletePost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
        mockPost,
      );
    });

    it("returns 403 when user cannot delete post", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserDeletePost.mockResolvedValue(false);

      const response = await handleDeletePost(
        "post-123",
        "different-user",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(body.error).toContain("only delete your own posts");
    });

    it("returns 404 when post not found", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserDeletePost.mockResolvedValue(true);
      mockDeletePost.mockResolvedValue(false);

      const response = await handleDeletePost("nonexistent", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database error", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserDeletePost.mockResolvedValue(true);
      mockDeletePost.mockRejectedValue(new Error("Database error"));

      const response = await handleDeletePost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to delete post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles post with no authorId", async () => {
      const postWithoutAuthor = { ...mockPost, authorId: undefined };
      mockGetPostById.mockResolvedValue(postWithoutAuthor);

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      // User is not owner (undefined !== "user-456")
      expect(response.status).toBe(403);
    });

    it("handles legacy admin user ID in permissions check", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);
      mockUpdatePost.mockResolvedValue(mockPost);

      await handleUpdatePost("post-123", { title: "Updated" }, undefined, true);

      expect(mockCanUserEditPost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
        mockPost,
      );
    });

    it("validates status enum values", async () => {
      mockGetPostById.mockResolvedValue(mockPost);
      mockCanUserEditPost.mockResolvedValue(true);

      const response = await handleUpdatePost(
        "post-123",
        { status: "invalid-status" as never },
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.errors?.status).toBeDefined();
    });
  });
});
