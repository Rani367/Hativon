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
  darkModeAnnouncementDismissed: false,
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
});
