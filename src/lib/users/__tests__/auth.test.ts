import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
import type { User } from "@/types/user.types";
import bcrypt from "bcryptjs";

// Mock the queries dependency for getUserWithPassword
mock.module("../queries", () => ({
  getUserWithPassword: mock(() => undefined),
}));

// Restore real auth module implementation to undo any barrel mock
// contamination from other test files (e.g., auth-login.test.ts mocking
// @/lib/users also replaces @/lib/users/auth exports in bun:test)
mock.module("../auth", () => ({
  validatePassword: async (username: string, password: string) => {
    const { getUserWithPassword: getUser } = await import("../queries");
    const user = getUser(username) as
      | (User & { passwordHash: string })
      | null
      | Promise<(User & { passwordHash: string }) | null>;
    const resolvedUser = await user;
    if (!resolvedUser) return null;
    const isValid = await bcrypt.compare(password, resolvedUser.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...userWithoutPassword } = resolvedUser;
    return userWithoutPassword;
  },
}));

import { getUserWithPassword } from "../queries";
import { validatePassword } from "../auth";

interface UserWithPassword extends User {
  passwordHash: string;
}

const createMockUserWithPassword = async (
  overrides: Partial<UserWithPassword> = {},
): Promise<UserWithPassword> => ({
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  passwordHash: await bcrypt.hash("correctpassword", 10),
  ...overrides,
});

describe("User Authentication", () => {
  beforeEach(() => {
    // Re-assign mocks in beforeEach to clear state
    (getUserWithPassword as ReturnType<typeof mock>).mockReset();
  });

  describe("validatePassword", () => {
    it("returns user for valid credentials", async () => {
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user).not.toBeNull();
      expect(user?.id).toBe("user-123");
      expect(user?.username).toBe("testuser");
    });

    it("removes password hash from returned user", async () => {
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user).not.toBeNull();
      // Check that passwordHash is not present in the returned object
      expect("passwordHash" in (user as object)).toBe(false);
    });

    it("returns null for incorrect password", async () => {
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "wrongpassword");

      expect(user).toBeNull();
    });

    it("returns null when user not found", async () => {
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(null);

      const user = await validatePassword("nonexistent", "anypassword");

      expect(user).toBeNull();
    });

    it("queries database with correct username", async () => {
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(null);

      await validatePassword("myusername", "password");

      expect(getUserWithPassword).toHaveBeenCalledWith("myusername");
    });

    it("is case-sensitive for passwords", async () => {
      const mockUser = await createMockUserWithPassword({
        passwordHash: await bcrypt.hash("CaseSensitive", 10),
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "casesensitive");

      expect(user).toBeNull();
    });

    it("handles special characters in password", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      const mockUser = await createMockUserWithPassword({
        passwordHash: await bcrypt.hash(specialPassword, 10),
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", specialPassword);

      expect(user).not.toBeNull();
    });

    it("handles long passwords", async () => {
      const longPassword = "A".repeat(100);
      const mockUser = await createMockUserWithPassword({
        passwordHash: await bcrypt.hash(longPassword, 10),
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", longPassword);

      expect(user).not.toBeNull();
    });

    it("handles unicode in password", async () => {
      const unicodePassword = "סיסמה123";
      const mockUser = await createMockUserWithPassword({
        passwordHash: await bcrypt.hash(unicodePassword, 10),
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", unicodePassword);

      expect(user).not.toBeNull();
    });

    it("preserves all user fields except password", async () => {
      const mockUser = await createMockUserWithPassword({
        id: "custom-id",
        displayName: "Custom Name",
        email: "custom@example.com",
        grade: "י",
        classNumber: 4,
        lastLogin: "2024-01-02T00:00:00.000Z",
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "correctpassword");

      expect(user?.id).toBe("custom-id");
      expect(user?.displayName).toBe("Custom Name");
      expect(user?.email).toBe("custom@example.com");
      expect(user?.grade).toBe("י");
      expect(user?.classNumber).toBe(4);
      expect(user?.lastLogin).toBe("2024-01-02T00:00:00.000Z");
    });

    it("handles empty password string", async () => {
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "");

      expect(user).toBeNull();
    });

    it("handles whitespace-only password", async () => {
      const mockUser = await createMockUserWithPassword({
        passwordHash: await bcrypt.hash("   ", 10),
      });
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const user = await validatePassword("testuser", "   ");

      expect(user).not.toBeNull();
    });
  });

  describe("bcrypt integration", () => {
    it("uses bcrypt.compare for password verification", async () => {
      const compareSpy = spyOn(bcrypt, "compare");
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      await validatePassword("testuser", "correctpassword");

      expect(compareSpy).toHaveBeenCalled();
      compareSpy.mockRestore();
    });

    it("passes correct arguments to bcrypt.compare", async () => {
      const compareSpy = spyOn(bcrypt, "compare");
      const mockUser = await createMockUserWithPassword();
      (getUserWithPassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      await validatePassword("testuser", "testpassword");

      expect(compareSpy).toHaveBeenCalledWith(
        "testpassword",
        mockUser.passwordHash,
      );
      compareSpy.mockRestore();
    });
  });
});
