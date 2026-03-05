import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Access global delegates for assertions and mock control
const _g = globalThis as Record<string, unknown>;
_g.__getCurrentUserMock = mock(() => undefined);

// @/lib/auth/middleware needs its own mock since it's not in setup.ts yet
mock.module("@/lib/auth/middleware", () => ({
  getCurrentUser: (...args: unknown[]) =>
    (_g.__getCurrentUserMock as (...a: unknown[]) => unknown)(...args),
}));

// @/lib/posts barrel, @/lib/logger, and next/cache are mocked via global delegates in test/setup.ts

import { GET, PATCH, DELETE } from "../[id]/route";
import { revalidateTag } from "next/cache";
import type { Post } from "@/types/post.types";
import type { User } from "@/types/user.types";

// Local references to delegates for convenient mock control
let mockGetCurrentUser: ReturnType<typeof mock>;
let mockGetPostById: ReturnType<typeof mock>;
let mockUpdatePost: ReturnType<typeof mock>;
let mockDeletePost: ReturnType<typeof mock>;

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
    json: mock(() => Promise.resolve(body || {})),
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("User Posts API Routes", () => {
  beforeEach(() => {
    mockGetCurrentUser = mock(() => undefined);
    mockGetPostById = mock(() => undefined);
    mockUpdatePost = mock(() => undefined);
    mockDeletePost = mock(() => undefined);

    _g.__getCurrentUserMock = mockGetCurrentUser;
    _g.__postsBarrelGetPostByIdMock = mockGetPostById;
    _g.__postsBarrelUpdatePostMock = mockUpdatePost;
    _g.__postsBarrelDeletePostMock = mockDeletePost;
    _g.__logErrorMock = mock(() => undefined);
    (revalidateTag as ReturnType<typeof mock>).mockReset();
  });

  describe("GET /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue({
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
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);

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
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to fetch post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue({
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
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockUpdatePost.mockResolvedValue(updatedPost);

      const request = createMockRequest({ title: "Updated Title" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.title).toBe("Updated Title");
      expect(mockUpdatePost).toHaveBeenCalledWith("post-456", {
        title: "Updated Title",
      });
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("returns 404 when updatePost returns null", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockUpdatePost.mockResolvedValue(null);

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database errors", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockUpdatePost.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest({ title: "Updated" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to update post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/user/posts/[id]", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 404 when post does not exist", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 403 when user does not own the post", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue({
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
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockDeletePost.mockResolvedValue(true);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockDeletePost).toHaveBeenCalledWith("post-456");
      expect(revalidateTag).toHaveBeenCalledWith("posts", "max");
    });

    it("returns 404 when deletePost returns false", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockDeletePost.mockResolvedValue(false);

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("returns 500 on database errors", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);
      mockDeletePost.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to delete post");
      expect(_g.__logErrorMock as ReturnType<typeof mock>).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles post with undefined authorId", async () => {
      const postWithoutAuthor = { ...mockPost, authorId: undefined };
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(postWithoutAuthor);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ id: "post-456" }),
      });
      const body = await response.json();

      // undefined !== mockUser.id, so should be forbidden
      expect(response.status).toBe(403);
    });

    it("handles concurrent request params resolution", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetPostById.mockResolvedValue(mockPost);

      const request = createMockRequest();
      const paramsPromise = Promise.resolve({ id: "post-456" });

      const response = await GET(request, { params: paramsPromise });

      expect(response.status).toBe(200);
      expect(mockGetPostById).toHaveBeenCalledWith("post-456");
    });
  });
});
