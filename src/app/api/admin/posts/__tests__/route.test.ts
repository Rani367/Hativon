import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Access global delegates for assertions and mock control
const _g = globalThis as Record<string, unknown>;
_g.__getCurrentUserMock = mock(() => undefined);
_g.__isAdminAuthenticatedMock = mock(() => Promise.resolve(false));

// @/lib/auth/middleware mirrors the user-posts test: only getCurrentUser is
// imported by this route, routed through the shared global delegate so load
// order between test files can't change behavior.
mock.module("@/lib/auth/middleware", () => ({
  getCurrentUser: (...args: unknown[]) =>
    (_g.__getCurrentUserMock as (...a: unknown[]) => unknown)(...args),
}));

// @/lib/auth/admin: include ALL exports (only isAdminAuthenticated is routed to
// a delegate) so this mock can't break the other admin-auth test files.
mock.module("@/lib/auth/admin", () => ({
  verifyAdminPassword: mock(() => Promise.resolve(false)),
  setAdminAuth: mock(() => Promise.resolve(undefined)),
  clearAdminAuth: mock(() => Promise.resolve(undefined)),
  getAdminClearCookie: mock(() => ""),
  requireAdminAuth: mock(() => Promise.resolve(undefined)),
  isAdminAuthenticated: (...args: unknown[]) =>
    (_g.__isAdminAuthenticatedMock as (...a: unknown[]) => unknown)(...args),
}));

// Mock rate-limit with ALL exports to avoid contaminating rate-limit.test.ts
const _rlCheck = mock(() =>
  Promise.resolve({ success: true, remaining: 5, reset: Date.now() + 60000 }),
);
mock.module("@/lib/rate-limit", () => ({
  checkRateLimit: mock(() => Promise.resolve({ limited: false })),
  createRateLimiter: mock(() => ({ check: _rlCheck })),
  getClientIdentifier: mock(() => "test-ip"),
  loginRateLimiter: { check: _rlCheck },
  registerRateLimiter: { check: _rlCheck },
  authRateLimiter: { check: _rlCheck },
}));

// @/lib/posts barrel and @/lib/logger are mocked via global delegates in test.setup.ts

import { GET } from "../route";
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
  themePreference: "light",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const ownPost: Post = {
  id: "post-own",
  title: "My Own Post",
  content: "Content of my own post",
  description: "Mine",
  date: "2024-01-02",
  authorId: "user-123",
  author: "Test User",
  status: "published",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

const otherPost: Post = {
  ...ownPost,
  id: "post-other",
  title: "Someone Else's Post",
  authorId: "user-999",
  author: "Other User",
  createdAt: "2024-01-03T00:00:00.000Z",
};

function createRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/posts${query}`);
}

describe("GET /api/admin/posts", () => {
  let mockGetAllPosts: ReturnType<typeof mock>;
  let mockGetPostsByAuthor: ReturnType<typeof mock>;

  beforeEach(() => {
    _g.__getCurrentUserMock = mock(() => Promise.resolve(null));
    _g.__isAdminAuthenticatedMock = mock(() => Promise.resolve(false));

    // getAllPosts returns the paginated shape when pagination is requested
    mockGetAllPosts = mock(() =>
      Promise.resolve({
        posts: [otherPost, ownPost],
        total: 2,
        hasMore: false,
      }),
    );
    mockGetPostsByAuthor = mock(() => Promise.resolve([ownPost]));

    _g.__postsBarrelGetAllPostsMock = mockGetAllPosts;
    _g.__postsBarrelGetPostsByAuthorMock = mockGetPostsByAuthor;
    _g.__logErrorMock = mock(() => undefined);
  });

  it("returns only the current user's posts for an admin session when scope=mine (regression)", async () => {
    _g.__isAdminAuthenticatedMock = mock(() => Promise.resolve(true));
    _g.__getCurrentUserMock = mock(() => Promise.resolve(mockUser));

    const response = await GET(createRequest("?scope=mine&limit=20&offset=0"));
    const body = await response.json();

    // Must take the user-scoped branch, NOT the all-posts branch
    expect(mockGetPostsByAuthor).toHaveBeenCalledTimes(1);
    expect(mockGetPostsByAuthor).toHaveBeenCalledWith(mockUser.id);
    expect(mockGetAllPosts).not.toHaveBeenCalled();

    expect(response.status).toBe(200);
    expect(body.posts.map((p: Post) => p.id)).toEqual([ownPost.id]);
  });

  it("returns all posts for an admin session without scope (admin panel unchanged)", async () => {
    _g.__isAdminAuthenticatedMock = mock(() => Promise.resolve(true));
    _g.__getCurrentUserMock = mock(() => Promise.resolve(mockUser));

    const response = await GET(createRequest("?limit=20&offset=0"));
    const body = await response.json();

    expect(mockGetAllPosts).toHaveBeenCalledTimes(1);
    expect(mockGetPostsByAuthor).not.toHaveBeenCalled();

    expect(response.status).toBe(200);
    expect(body.posts.map((p: Post) => p.id).sort()).toEqual(
      [ownPost.id, otherPost.id].sort(),
    );
  });

  it("returns only the user's posts for a non-admin user session", async () => {
    _g.__isAdminAuthenticatedMock = mock(() => Promise.resolve(false));
    _g.__getCurrentUserMock = mock(() => Promise.resolve(mockUser));

    const response = await GET(createRequest("?limit=20&offset=0"));
    const body = await response.json();

    expect(mockGetPostsByAuthor).toHaveBeenCalledTimes(1);
    expect(mockGetPostsByAuthor).toHaveBeenCalledWith(mockUser.id);
    expect(mockGetAllPosts).not.toHaveBeenCalled();

    expect(response.status).toBe(200);
    expect(body.posts.map((p: Post) => p.id)).toEqual([ownPost.id]);
  });

  it("returns 401 when neither admin nor user is authenticated", async () => {
    const response = await GET(createRequest("?scope=mine"));

    expect(response.status).toBe(401);
    expect(mockGetAllPosts).not.toHaveBeenCalled();
    expect(mockGetPostsByAuthor).not.toHaveBeenCalled();
  });
});
