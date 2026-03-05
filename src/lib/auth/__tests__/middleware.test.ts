import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import type { User } from "@/types/user.types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Mock dependencies before importing the module under test
mock.module("next/headers", () => ({
  cookies: mock(() => undefined),
}));
mock.module("../jwt", () => ({
  verifyToken: mock(() => undefined),
}));
// Must provide ALL barrel exports to avoid contaminating sub-module imports
mock.module("../../users", () => ({
  getUserById: mock(() => undefined),
  getUserByUsername: mock(() => undefined),
  getAllUsers: mock(() => undefined),
  usernameExists: mock(() => undefined),
  createUser: mock(() => undefined),
  updateUser: mock(() => undefined),
  updateLastLogin: mock(() => undefined),
  deleteUser: mock(() => undefined),
  setPasswordResetFlag: mock(() => undefined),
  clearPasswordResetFlag: mock(() => undefined),
  resetUserPassword: mock(() => undefined),
  validatePassword: mock(() => undefined),
}));
// @/lib/db/client is mocked via global delegates in test/setup.ts

// Import after mocking
import { getCurrentUser, requireAuth, isAuthenticated } from "../middleware";
import { cookies } from "next/headers";
import { verifyToken } from "../jwt";
import { getUserById } from "../../users";

// isDatabaseAvailable is controlled via global delegate
const _g = globalThis as Record<string, unknown>;

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

describe("Authentication Middleware", () => {
  const mockGet = mock(() => undefined);
  const mockSet = mock(() => undefined);
  const mockDelete = mock(() => undefined);

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockDelete.mockReset();
    (cookies as ReturnType<typeof mock>).mockReset();
    (verifyToken as ReturnType<typeof mock>).mockReset();
    (getUserById as ReturnType<typeof mock>).mockReset();

    // Reset global delegate for isDatabaseAvailable
    _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(true));

    const mockCookieStore = {
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    } as unknown as ReadonlyRequestCookies;

    (cookies as ReturnType<typeof mock>).mockResolvedValue(mockCookieStore);
  });

  describe("getCurrentUser", () => {
    it("returns null when no auth token cookie exists", async () => {
      mockGet.mockReturnValue(undefined);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns null when auth token is empty", async () => {
      mockGet.mockReturnValue({ value: "" });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns null when token verification fails", async () => {
      mockGet.mockReturnValue({ value: "invalid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns legacy admin user for legacy-admin userId", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "legacy-admin",
        username: "admin",
      });

      const user = await getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe("legacy-admin");
      expect(user?.username).toBe("admin");
      expect(user?.displayName).toBe("Admin");
      expect(user?.grade).toBe("ז");
      expect(user?.classNumber).toBe(1);
    });

    it("returns fallback user from JWT when database is not available", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(false));

      const user = await getCurrentUser();

      // Should return a user constructed from JWT payload, not null
      // This ensures users stay authenticated during temporary DB issues
      expect(user).not.toBeNull();
      expect(user?.id).toBe("user-123");
      expect(user?.username).toBe("testuser");
      expect(user?.displayName).toBe("testuser"); // Falls back to username
      expect(user?.isTeacher).toBe(false); // Conservative default
      expect(getUserById).not.toHaveBeenCalled(); // DB was not queried
    });

    it("returns user from database when authenticated", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      (getUserById as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(getUserById).toHaveBeenCalledWith("user-123");
    });

    it("returns null when user not found in database", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      (getUserById as ReturnType<typeof mock>).mockResolvedValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns null on unexpected error", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
      (cookies as ReturnType<typeof mock>).mockRejectedValue(new Error("Cookie access failed"));

      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("requireAuth", () => {
    it("returns user when authenticated", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      (getUserById as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await requireAuth();

      expect(user).toEqual(mockUser);
    });

    it("throws error when not authenticated", async () => {
      mockGet.mockReturnValue(undefined);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("throws error when token is invalid", async () => {
      mockGet.mockReturnValue({ value: "invalid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue(null);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("throws error when user not found in database", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      (getUserById as ReturnType<typeof mock>).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when user is authenticated", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      (getUserById as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("returns false when no token", async () => {
      mockGet.mockReturnValue(undefined);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false when token is invalid", async () => {
      mockGet.mockReturnValue({ value: "invalid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("returns true for legacy admin user", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      (verifyToken as ReturnType<typeof mock>).mockReturnValue({
        userId: "legacy-admin",
        username: "admin",
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });
  });
});
