import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import type { User } from "@/types/user.types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Mock dependencies before importing the module under test
vi.mock("next/headers");
vi.mock("../jwt", () => ({
  verifyToken: vi.fn(),
}));
vi.mock("../../users", () => ({
  getUserById: vi.fn(),
}));
vi.mock("../../db/client", () => ({
  isDatabaseAvailable: vi.fn(),
}));

// Import after mocking
import { getCurrentUser, requireAuth, isAuthenticated } from "../middleware";
import { verifyToken } from "../jwt";
import { getUserById } from "../../users";
import { isDatabaseAvailable } from "../../db/client";

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
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const mockCookieStore = {
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    } as unknown as ReadonlyRequestCookies;

    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);
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
      vi.mocked(verifyToken).mockReturnValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns legacy admin user for legacy-admin userId", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
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
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(isDatabaseAvailable).mockResolvedValue(false);

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
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(getUserById).mockResolvedValue(mockUser);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(getUserById).toHaveBeenCalledWith("user-123");
    });

    it("returns null when user not found in database", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(getUserById).mockResolvedValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns null on unexpected error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(cookies).mockRejectedValue(new Error("Cookie access failed"));

      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("requireAuth", () => {
    it("returns user when authenticated", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(getUserById).mockResolvedValue(mockUser);

      const user = await requireAuth();

      expect(user).toEqual(mockUser);
    });

    it("throws error when not authenticated", async () => {
      mockGet.mockReturnValue(undefined);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("throws error when token is invalid", async () => {
      mockGet.mockReturnValue({ value: "invalid-token" });
      vi.mocked(verifyToken).mockReturnValue(null);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("throws error when user not found in database", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(getUserById).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when user is authenticated", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
        userId: "user-123",
        username: "testuser",
      });
      vi.mocked(getUserById).mockResolvedValue(mockUser);

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
      vi.mocked(verifyToken).mockReturnValue(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("returns true for legacy admin user", async () => {
      mockGet.mockReturnValue({ value: "valid-token" });
      vi.mocked(verifyToken).mockReturnValue({
        userId: "legacy-admin",
        username: "admin",
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });
  });
});
