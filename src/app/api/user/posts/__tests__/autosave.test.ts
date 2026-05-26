import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import type { Post } from "@/types/post.types";
import type { User } from "@/types/user.types";

const _g = globalThis as Record<string, unknown>;
_g.__getCurrentUserMock = mock(() => undefined);

mock.module("@/lib/auth/middleware", () => ({
  getCurrentUser: (...args: unknown[]) =>
    (_g.__getCurrentUserMock as (...a: unknown[]) => unknown)(...args),
}));

import { POST } from "../autosave/route";

let mockGetCurrentUser: ReturnType<typeof mock>;
let mockGetPostById: ReturnType<typeof mock>;
let mockUpdatePost: ReturnType<typeof mock>;

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  themePreference: "light",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const publishedPost: Post = {
  id: "83161813-b783-4b3a-9b91-528d93ac1849",
  title: "Published Post",
  content: "Published content",
  description: "Published description",
  date: "2024-01-01T00:00:00.000Z",
  authorId: "user-123",
  author: "Test User",
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const draftPost: Post = {
  id: "2d3f8c5a-1b2c-4d5e-8f90-1a2b3c4d5e6f",
  title: "Draft Post",
  content: "Draft content",
  description: "Draft description",
  date: "2024-01-01T00:00:00.000Z",
  authorId: "user-123",
  author: "Test User",
  status: "draft",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: mock(() => Promise.resolve(body)),
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("POST /api/user/posts/autosave", () => {
  beforeEach(() => {
    mockGetCurrentUser = mock(() => undefined);
    mockGetPostById = mock(() => undefined);
    mockUpdatePost = mock(() => undefined);

    _g.__getCurrentUserMock = mockGetCurrentUser;
    _g.__postsBarrelGetPostByIdMock = mockGetPostById;
    _g.__postsBarrelUpdatePostMock = mockUpdatePost;
    _g.__logErrorMock = mock(() => undefined);
    (revalidatePath as ReturnType<typeof mock>).mockReset();
  });

  it("rejects server autosave for published posts", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockGetPostById.mockResolvedValue(publishedPost);

    const response = await POST(
      createMockRequest({
        postId: publishedPost.id,
        title: "Changed title",
        content: "Changed content",
        coverImage: "https://example.com/cover.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Published posts must be saved explicitly");
    expect(mockUpdatePost).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns 409 conflict when the server version is newer than expectedVersion", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockGetPostById.mockResolvedValue(draftPost);

    const response = await POST(
      createMockRequest({
        postId: draftPost.id,
        title: "My local edit",
        content: "My local content",
        // Older than draftPost.updatedAt (2024-01-02) -> conflict
        expectedVersion: "2024-01-01T00:00:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.conflict).toBe(true);
    expect(body.serverVersion).toBe(draftPost.updatedAt);
    expect(body.serverContent.title).toBe(draftPost.title);
    expect(body.serverContent.content).toBe(draftPost.content);
    // Must not overwrite when there is a real conflict
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("commits when expectedVersion equals the server version (overwrite path)", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockGetPostById.mockResolvedValue(draftPost);
    mockUpdatePost.mockResolvedValue({
      ...draftPost,
      updatedAt: "2024-01-03T00:00:00.000Z",
    });

    const response = await POST(
      createMockRequest({
        postId: draftPost.id,
        title: "Updated title",
        content: "Updated content",
        // Equal to draftPost.updatedAt -> must pass the strict ">" check
        expectedVersion: draftPost.updatedAt,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isNew).toBe(false);
    expect(body.updatedAt).toBe("2024-01-03T00:00:00.000Z");
    expect(mockUpdatePost).toHaveBeenCalledTimes(1);
  });

  it("commits when no expectedVersion is provided (initial save)", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockGetPostById.mockResolvedValue(draftPost);
    mockUpdatePost.mockResolvedValue({
      ...draftPost,
      updatedAt: "2024-01-03T00:00:00.000Z",
    });

    const response = await POST(
      createMockRequest({
        postId: draftPost.id,
        title: "Updated title",
        content: "Updated content",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdatePost).toHaveBeenCalledTimes(1);
  });
});
