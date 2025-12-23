import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before importing route handlers
vi.mock("@/lib/auth/middleware", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/posts", () => ({
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { GET, PATCH, DELETE } from "../[id]/route";
import { getCurrentUser } from "@/lib/auth/middleware";
import { getPostById, updatePost, deletePost } from "@/lib/posts";
import { logError } from "@/lib/logger";
import type { Post } from "@/types/post.types";
import type { User } from "@/types/user.types";

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockPost: Post = {
  id: "post-456",
  title: "Test Post",
  slug: "test-post",
  content: "Test content for the post",
  description: "Test description",
  date: "2024-01-01",
  authorId: "user-123",
  author: "Test User",
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function createMockRequest(body?: Record<string, unknown>): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body || {}),
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("User Posts API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue({
        ...mockPost,
        authorId: "different-user",
      });

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(body.error).toContain("only access your own posts");
    });

    it("returns post when user owns it", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("post-456");
      expect(body.title).toBe("Test Post");
    });

    it("returns 500 on database errors", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to fetch post");
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue({
        ...mockPost,
        authorId: "different-user",
      });

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(body.error).toContain("only edit your own posts");
    });

    it("updates post when user owns it", async () => {
      const updatedPost = { ...mockPost, title: "Updated Title" };
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(updatePost).mockResolvedValue(updatedPost);

      const request = createMockRequest({ title: "Updated Title" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.title).toBe("Updated Title");
      expect(updatePost).toHaveBeenCalledWith("post-456", {
        title: "Updated Title",
      });
    });

    it("returns 404 when updatePost returns null", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(updatePost).mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database errors", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(updatePost).mockRejectedValue(new Error("Database error"));

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to update post");
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue({
        ...mockPost,
        authorId: "different-user",
      });

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
      expect(body.error).toContain("only delete your own posts");
    });

    it("deletes post when user owns it", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(deletePost).mockResolvedValue(true);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(deletePost).toHaveBeenCalledWith("post-456");
    });

    it("returns 404 when deletePost returns false", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(deletePost).mockResolvedValue(false);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database errors", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);
      vi.mocked(deletePost).mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to delete post");
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles post with undefined authorId", async () => {
      const postWithoutAuthor = { ...mockPost, authorId: undefined };
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(postWithoutAuthor);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      // undefined !== mockUser.id, so should be forbidden
      expect(response.status).toBe(403);
    });

    it("handles concurrent request params resolution", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const request = createMockRequest();
      const paramsPromise = Promise.resolve({ id: "post-456" });

      const response = await GET(request, { params: paramsPromise });

      expect(response.status).toBe(200);
      expect(getPostById).toHaveBeenCalledWith("post-456");
    });
  });
});
