import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock dependencies before importing handlers
vi.mock("@/lib/posts", () => ({
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  canUserEditPost: vi.fn(),
  canUserDeletePost: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import {
  handleGetPost,
  handleUpdatePost,
  handleDeletePost,
} from "../posts";
import {
  getPostById,
  updatePost,
  deletePost,
  canUserEditPost,
  canUserDeletePost,
} from "@/lib/posts";
import { logError } from "@/lib/logger";
import { revalidateTag } from "next/cache";
import type { Post } from "@/types/post.types";

const mockPost: Post = {
  id: "post-123",
  title: "Test Post",
  slug: "test-post",
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
    vi.clearAllMocks();
  });

  describe("handleGetPost", () => {
    it("returns post when user is admin", async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", undefined, true);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("post-123");
      expect(getPostById).toHaveBeenCalledWith("post-123");
    });

    it("returns post when user is the owner", async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("post-123");
    });

    it("returns 403 when user is not owner and not admin", async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", "different-user", false);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("returns 403 when userId is undefined and not admin", async () => {
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const response = await handleGetPost("post-123", undefined, false);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("returns 404 when post not found", async () => {
      vi.mocked(getPostById).mockResolvedValue(null);

      const response = await handleGetPost("nonexistent", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database error", async () => {
      vi.mocked(getPostById).mockRejectedValue(new Error("Database error"));

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to fetch post");
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("handleUpdatePost", () => {
    const validUpdateBody = {
      title: "Updated Title",
      content: "Updated content",
    };

    it("updates post when user has permission", async () => {
      const updatedPost = { ...mockPost, title: "Updated Title" };
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockResolvedValue(updatedPost);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.title).toBe("Updated Title");
      expect(canUserEditPost).toHaveBeenCalledWith("user-456", "post-123", false);
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("updates post when admin", async () => {
      const updatedPost = { ...mockPost, title: "Updated Title" };
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockResolvedValue(updatedPost);

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        undefined,
        true,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(canUserEditPost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
      );
    });

    it("returns 403 when user cannot edit post", async () => {
      vi.mocked(canUserEditPost).mockResolvedValue(false);

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
      vi.mocked(canUserEditPost).mockResolvedValue(true);

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
      vi.mocked(canUserEditPost).mockResolvedValue(true);

      const response = await handleUpdatePost("post-123", {}, "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid post data");
    });

    it("returns 404 when post not found during update", async () => {
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockResolvedValue(null);

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
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockRejectedValue(new Error("Database error"));

      const response = await handleUpdatePost(
        "post-123",
        validUpdateBody,
        "user-456",
        false,
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to update post");
      expect(logError).toHaveBeenCalled();
    });

    it("validates content length", async () => {
      vi.mocked(canUserEditPost).mockResolvedValue(true);

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
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockResolvedValue(updatedPost);

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
      vi.mocked(canUserDeletePost).mockResolvedValue(true);
      vi.mocked(deletePost).mockResolvedValue(true);

      const response = await handleDeletePost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(canUserDeletePost).toHaveBeenCalledWith(
        "user-456",
        "post-123",
        false,
      );
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("deletes post when admin", async () => {
      vi.mocked(canUserDeletePost).mockResolvedValue(true);
      vi.mocked(deletePost).mockResolvedValue(true);

      const response = await handleDeletePost("post-123", undefined, true);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(canUserDeletePost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
      );
    });

    it("returns 403 when user cannot delete post", async () => {
      vi.mocked(canUserDeletePost).mockResolvedValue(false);

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
      vi.mocked(canUserDeletePost).mockResolvedValue(true);
      vi.mocked(deletePost).mockResolvedValue(false);

      const response = await handleDeletePost("nonexistent", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database error", async () => {
      vi.mocked(canUserDeletePost).mockResolvedValue(true);
      vi.mocked(deletePost).mockRejectedValue(new Error("Database error"));

      const response = await handleDeletePost("post-123", "user-456", false);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to delete post");
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles post with no authorId", async () => {
      const postWithoutAuthor = { ...mockPost, authorId: undefined };
      vi.mocked(getPostById).mockResolvedValue(postWithoutAuthor);

      const response = await handleGetPost("post-123", "user-456", false);
      const body = await response.json();

      // User is not owner (undefined !== "user-456")
      expect(response.status).toBe(403);
    });

    it("handles legacy admin user ID in permissions check", async () => {
      vi.mocked(canUserEditPost).mockResolvedValue(true);
      vi.mocked(updatePost).mockResolvedValue(mockPost);

      await handleUpdatePost(
        "post-123",
        { title: "Updated" },
        undefined,
        true,
      );

      expect(canUserEditPost).toHaveBeenCalledWith(
        "legacy-admin",
        "post-123",
        true,
      );
    });

    it("validates status enum values", async () => {
      vi.mocked(canUserEditPost).mockResolvedValue(true);

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
