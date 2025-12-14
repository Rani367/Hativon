import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import type { User } from "@/types/user.types";

// Mock dependencies before importing
vi.mock("../queries", () => ({
  getUserWithPassword: vi.fn(),
}));

import { validatePassword } from "../auth";
import { getUserWithPassword } from "../queries";

interface UserWithPassword extends User {
  passwordHash: string;
}

const createMockUserWithPassword = (
  overrides: Partial<UserWithPassword> = {},
): UserWithPassword => ({
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  passwordHash: bcrypt.hashSync("correctpassword", 10),
  ...overrides,
});

describe("User Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validatePassword", () => {
    it("returns user for valid credentials", async () => {
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user).not.toBeNull();
      expect(user?.id).toBe("user-123");
      expect(user?.username).toBe("testuser");
    });

    it("removes password hash from returned user", async () => {
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user).not.toBeNull();
      // Check that passwordHash is not present in the returned object
      expect("passwordHash" in (user as object)).toBe(false);
    });

    it("returns null for incorrect password", async () => {
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "wrongpassword");

      expect(user).toBeNull();
    });

    it("returns null when user not found", async () => {
      vi.mocked(getUserWithPassword).mockResolvedValue(null);

      const user = await validatePassword("nonexistent", "anypassword");

      expect(user).toBeNull();
    });

    it("queries database with correct username", async () => {
      vi.mocked(getUserWithPassword).mockResolvedValue(null);

      await validatePassword("myusername", "password");

      expect(getUserWithPassword).toHaveBeenCalledWith("myusername");
    });

    it("is case-sensitive for passwords", async () => {
      const mockUser = createMockUserWithPassword({
        passwordHash: bcrypt.hashSync("CaseSensitive", 10),
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "casesensitive");

      expect(user).toBeNull();
    });

    it("handles special characters in password", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      const mockUser = createMockUserWithPassword({
        passwordHash: bcrypt.hashSync(specialPassword, 10),
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", specialPassword);

      expect(user).not.toBeNull();
    });

    it("handles long passwords", async () => {
      const longPassword = "A".repeat(100);
      const mockUser = createMockUserWithPassword({
        passwordHash: bcrypt.hashSync(longPassword, 10),
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", longPassword);

      expect(user).not.toBeNull();
    });

    it("handles unicode in password", async () => {
      const unicodePassword = "סיסמה123";
      const mockUser = createMockUserWithPassword({
        passwordHash: bcrypt.hashSync(unicodePassword, 10),
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", unicodePassword);

      expect(user).not.toBeNull();
    });

    it("preserves all user fields except password", async () => {
      const mockUser = createMockUserWithPassword({
        id: "custom-id",
        displayName: "Custom Name",
        email: "custom@example.com",
        grade: "י",
        classNumber: 4,
        lastLogin: "2024-01-02T00:00:00.000Z",
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user?.id).toBe("custom-id");
      expect(user?.displayName).toBe("Custom Name");
      expect(user?.email).toBe("custom@example.com");
      expect(user?.grade).toBe("י");
      expect(user?.classNumber).toBe(4);
      expect(user?.lastLogin).toBe("2024-01-02T00:00:00.000Z");
    });

    it("handles empty password string", async () => {
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "");

      expect(user).toBeNull();
    });

    it("handles whitespace-only password", async () => {
      const mockUser = createMockUserWithPassword({
        passwordHash: bcrypt.hashSync("   ", 10),
      });
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "   ");

      expect(user).not.toBeNull();
    });
  });

  describe("bcrypt integration", () => {
    it("uses bcrypt.compare for password verification", async () => {
      const compareSpy = vi.spyOn(bcrypt, "compare");
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      await validatePassword("testuser", "correctpassword");

      expect(compareSpy).toHaveBeenCalled();
      compareSpy.mockRestore();
    });

    it("passes correct arguments to bcrypt.compare", async () => {
      const compareSpy = vi.spyOn(bcrypt, "compare");
      const mockUser = createMockUserWithPassword();
      vi.mocked(getUserWithPassword).mockResolvedValue(mockUser);

      await validatePassword("testuser", "testpassword");

      expect(compareSpy).toHaveBeenCalledWith(
        "testpassword",
        mockUser.passwordHash,
      );
      compareSpy.mockRestore();
    });
  });
});
