import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/check-auth/route";
import { User } from "@/types/user.types";

// Mock the auth modules
vi.mock("@/lib/auth/middleware", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  isAdminAuthenticated: vi.fn(),
  setAdminAuth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/middleware";
import { isAdminAuthenticated, setAdminAuth } from "@/lib/auth/admin";

// Helper to create a valid mock user
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    username: "testuser",
    displayName: "Test User",
    isTeacher: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/check-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authenticated: false when no user is logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false });
    expect(isAdminAuthenticated).not.toHaveBeenCalled();
  });

  it("returns user info when user is authenticated", async () => {
    const mockUser = createMockUser();

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      authenticated: true,
      user: mockUser,
      isAdmin: false,
      isTeacher: false,
    });
  });

  it("returns isAdmin: true when user has admin authentication", async () => {
    const mockUser = createMockUser({
      username: "admin",
      displayName: "Admin User",
    });

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(data.isAdmin).toBe(true);
    expect(setAdminAuth).not.toHaveBeenCalled();
  });

  it("auto-sets admin auth for teachers who are not already admin authenticated", async () => {
    const mockTeacher = createMockUser({
      id: "teacher-123",
      username: "teacher",
      displayName: "Teacher User",
      isTeacher: true,
    });

    vi.mocked(getCurrentUser).mockResolvedValue(mockTeacher);
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    // Should have called setAdminAuth for the teacher
    expect(setAdminAuth).toHaveBeenCalled();
    expect(data.isAdmin).toBe(true);
    expect(data.isTeacher).toBe(true);
  });

  it("does not call setAdminAuth if teacher is already admin authenticated", async () => {
    const mockTeacher = createMockUser({
      id: "teacher-123",
      username: "teacher",
      displayName: "Teacher User",
      isTeacher: true,
    });

    vi.mocked(getCurrentUser).mockResolvedValue(mockTeacher);
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    // Should NOT call setAdminAuth since already authenticated
    expect(setAdminAuth).not.toHaveBeenCalled();
    expect(data.isAdmin).toBe(true);
    expect(data.isTeacher).toBe(true);
  });

  it("returns isTeacher: false when user.isTeacher is false", async () => {
    const mockUser = createMockUser({
      username: "regular",
      displayName: "Regular User",
      isTeacher: false,
    });

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(isAdminAuthenticated).mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(data.isTeacher).toBe(false);
  });

  it("handles errors gracefully and returns authenticated: false", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false });
  });

  it("does not leak admin status to unauthenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    // Should only return authenticated: false, nothing about admin status
    expect(data).toEqual({ authenticated: false });
    expect(data.isAdmin).toBeUndefined();
    expect(isAdminAuthenticated).not.toHaveBeenCalled();
  });
});
