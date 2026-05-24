import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import type { User, UserPreferencesUpdate } from "@/types/user.types";

const mockRequireAuth = mock(async (): Promise<User> => {
  throw new Error("requireAuth mock not configured");
});
const mockUpdateUserPreferences = mock(
  async (
    _userId: string,
    _updates: UserPreferencesUpdate,
  ): Promise<User> => {
    throw new Error("updateUserPreferences mock not configured");
  },
);

mock.module("@/lib/auth/middleware", () => ({
  requireAuth: mockRequireAuth,
}));

mock.module("@/lib/users", () => ({
  getUserById: mock(() => undefined),
  getUserByUsername: mock(() => undefined),
  getAllUsers: mock(() => undefined),
  usernameExists: mock(() => undefined),
  createUser: mock(() => undefined),
  updateUser: mock(() => undefined),
  updateUserPreferences: mockUpdateUserPreferences,
  updateLastLogin: mock(() => undefined),
  deleteUser: mock(() => undefined),
  setPasswordResetFlag: mock(() => undefined),
  clearPasswordResetFlag: mock(() => undefined),
  resetUserPassword: mock(() => undefined),
  createResetToken: mock(() => undefined),
  validateResetToken: mock(() => undefined),
  consumeResetToken: mock(() => undefined),
  validatePassword: mock(() => undefined),
}));

import { PATCH } from "../route";

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  passwordResetRequested: false,
  themePreference: "light",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/user/preferences", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("PATCH /api/user/preferences", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockUpdateUserPreferences.mockReset();
    mockRequireAuth.mockResolvedValue(mockUser);
    mockUpdateUserPreferences.mockResolvedValue(mockUser);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Authentication required"));

    const response = await PATCH(createRequest({ themePreference: "dark" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty body", async () => {
    const response = await PATCH(createRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid preferences data");
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid theme preference", async () => {
    const response = await PATCH(createRequest({ themePreference: "system" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors.themePreference).toBeTruthy();
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it("updates the theme preference", async () => {
    const updatedUser = { ...mockUser, themePreference: "dark" as const };
    mockUpdateUserPreferences.mockResolvedValue(updatedUser);

    const response = await PATCH(createRequest({ themePreference: "dark" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith("user-123", {
      themePreference: "dark",
    });
    expect(body.preferences.themePreference).toBe("dark");
  });

});
