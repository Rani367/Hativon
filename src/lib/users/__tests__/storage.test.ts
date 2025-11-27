import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserRegistration, UserUpdate } from "@/types/user.types";
import bcrypt from "bcryptjs";

describe("User Storage", () => {
  let mockDb: { query: ReturnType<typeof vi.fn> };
  let mockBcrypt: {
    hash: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();

    mockDb = {
      query: vi.fn(),
    };

    mockBcrypt = {
      hash: vi.fn(),
      compare: vi.fn(),
    };

    vi.doMock("@/lib/db/client", () => ({
      db: mockDb,
    }));

    vi.doMock("bcryptjs", () => ({
      default: mockBcrypt,
    }));
  });

  describe("createUser", () => {
    it("creates user with hashed password", async () => {
      const mockUserRow = {
        id: "user-123",
        username: "testuser",
        displayName: "Test User",
        email: null,
        grade: "י",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        lastLogin: null,
      };

      mockBcrypt.hash.mockResolvedValue("hashed-password-abc123");
      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "testuser",
        password: "plaintext-password",
        displayName: "Test User",
        grade: "י",
        classNumber: 1,
      };

      const result = await createUser(input);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("plaintext-password", 12);
      expect(result.id).toBe("user-123");
      expect(result.username).toBe("testuser");
      expect(result.displayName).toBe("Test User");
      expect(result.grade).toBe("י");
      expect(result.classNumber).toBe(1);
    });

    it("verifies password is hashed and not stored in plaintext", async () => {
      const mockUserRow = {
        id: "user-456",
        username: "secureuser",
        displayName: "Secure User",
        email: null,
        grade: "ח",
        classNumber: 2,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        lastLogin: null,
      };

      const hashedPassword = "bcrypt-hashed-value-different-from-plaintext";
      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "secureuser",
        password: "mysecretpassword",
        displayName: "Secure User",
        grade: "ח",
        classNumber: 2,
      };

      await createUser(input);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("mysecretpassword", 12);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("populates all user fields correctly", async () => {
      const mockUserRow = {
        id: "user-789",
        username: "fulluser",
        displayName: "Full User Name",
        email: null,
        grade: "ט",
        classNumber: 3,
        createdAt: new Date("2025-01-15T10:00:00Z"),
        updatedAt: new Date("2025-01-15T10:00:00Z"),
        lastLogin: null,
      };

      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "fulluser",
        password: "password123",
        displayName: "Full User Name",
        grade: "ט",
        classNumber: 3,
      };

      const result = await createUser(input);

      expect(result).toEqual({
        id: "user-789",
        username: "fulluser",
        displayName: "Full User Name",
        email: null,
        grade: "ט",
        classNumber: 3,
        createdAt: new Date("2025-01-15T10:00:00Z"),
        updatedAt: new Date("2025-01-15T10:00:00Z"),
        lastLogin: null,
      });
    });

    it("throws Hebrew error for duplicate username", async () => {
      const dbError = new Error(
        'duplicate key value violates unique constraint "users_username_key"',
      );
      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockRejectedValue(dbError);

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "duplicateuser",
        password: "password123",
        displayName: "Duplicate User",
        grade: "י",
        classNumber: 1,
      };

      await expect(createUser(input)).rejects.toThrow(
        "שם המשתמש כבר קיים במערכת",
      );
    });

    it("throws Hebrew error for duplicate email", async () => {
      const dbError = new Error(
        'duplicate key value violates unique constraint "users_email_key"',
      );
      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockRejectedValue(dbError);

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "newuser",
        password: "password123",
        displayName: "New User",
        grade: "י",
        classNumber: 1,
      };

      await expect(createUser(input)).rejects.toThrow(
        "כתובת האימייל כבר קיימת במערכת",
      );
    });

    it("re-throws other database errors without modification", async () => {
      const dbError = new Error("Connection timeout");
      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockRejectedValue(dbError);

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "testuser",
        password: "password123",
        displayName: "Test User",
        grade: "י",
        classNumber: 1,
      };

      await expect(createUser(input)).rejects.toThrow("Connection timeout");
    });

    it("handles non-Error thrown objects", async () => {
      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockRejectedValue("String error message");

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "testuser",
        password: "password123",
        displayName: "Test User",
        grade: "י",
        classNumber: 1,
      };

      await expect(createUser(input)).rejects.toBe("String error message");
    });

    it("sets email to null initially", async () => {
      const mockUserRow = {
        id: "user-999",
        username: "nomail",
        displayName: "No Email User",
        email: null,
        grade: "ז",
        classNumber: 4,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        lastLogin: null,
      };

      mockBcrypt.hash.mockResolvedValue("hashed-password");
      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "nomail",
        password: "password123",
        displayName: "No Email User",
        grade: "ז",
        classNumber: 4,
      };

      const result = await createUser(input);

      expect(result.email).toBeNull();
    });

    it("uses BCRYPT_SALT_ROUNDS constant for hashing", async () => {
      const mockUserRow = {
        id: "user-salt",
        username: "saltuser",
        displayName: "Salt User",
        email: null,
        grade: "י",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        lastLogin: null,
      };

      mockBcrypt.hash.mockResolvedValue("hashed-with-10-rounds");
      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "saltuser",
        password: "testpassword",
        displayName: "Salt User",
        grade: "י",
        classNumber: 1,
      };

      await createUser(input);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("testpassword", 12);
    });
  });

  describe("updateUser", () => {
    it("updates displayName using COALESCE", async () => {
      const mockUserRow = {
        id: "user-123",
        username: "testuser",
        displayName: "Updated Name",
        email: null,
        grade: "י",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "Updated Name",
      };

      const result = await updateUser("user-123", updates);

      expect(result.displayName).toBe("Updated Name");
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("updates email using COALESCE", async () => {
      const mockUserRow = {
        id: "user-123",
        username: "testuser",
        displayName: "Test User",
        email: "newemail@example.com",
        grade: "י",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        email: "newemail@example.com",
      };

      const result = await updateUser("user-123", updates);

      expect(result.email).toBe("newemail@example.com");
    });

    it("updates grade using COALESCE", async () => {
      const mockUserRow = {
        id: "user-123",
        username: "testuser",
        displayName: "Test User",
        email: null,
        grade: "ח",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        grade: "ח",
      };

      const result = await updateUser("user-123", updates);

      expect(result.grade).toBe("ח");
    });

    it("updates classNumber using COALESCE", async () => {
      const mockUserRow = {
        id: "user-123",
        username: "testuser",
        displayName: "Test User",
        email: null,
        grade: "י",
        classNumber: 3,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        classNumber: 3,
      };

      const result = await updateUser("user-123", updates);

      expect(result.classNumber).toBe(3);
    });

    it("updates multiple fields at once", async () => {
      const mockUserRow = {
        id: "user-456",
        username: "multiuser",
        displayName: "Multi Update",
        email: "multi@example.com",
        grade: "ט",
        classNumber: 2,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-03"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "Multi Update",
        email: "multi@example.com",
        grade: "ט",
        classNumber: 2,
      };

      const result = await updateUser("user-456", updates);

      expect(result.displayName).toBe("Multi Update");
      expect(result.email).toBe("multi@example.com");
      expect(result.grade).toBe("ט");
      expect(result.classNumber).toBe(2);
    });

    it("throws Hebrew error when user not found", async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "New Name",
      };

      await expect(updateUser("non-existent-id", updates)).rejects.toThrow(
        "משתמש לא נמצא",
      );
    });

    it("updates timestamp on every update", async () => {
      const originalDate = new Date("2025-01-01T10:00:00Z");
      const updatedDate = new Date("2025-01-02T15:30:00Z");

      const mockUserRow = {
        id: "user-time",
        username: "timeuser",
        displayName: "Time User",
        email: null,
        grade: "י",
        classNumber: 1,
        createdAt: originalDate,
        updatedAt: updatedDate,
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "Time User",
      };

      const result = await updateUser("user-time", updates);

      expect(result.updatedAt).toEqual(updatedDate);
      expect(result.updatedAt).not.toEqual(result.createdAt);
    });

    it("preserves unchanged fields with COALESCE", async () => {
      const mockUserRow = {
        id: "user-preserve",
        username: "preserveuser",
        displayName: "Original Name",
        email: "original@example.com",
        grade: "י",
        classNumber: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        lastLogin: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "Original Name",
      };

      const result = await updateUser("user-preserve", updates);

      expect(result.email).toBe("original@example.com");
      expect(result.grade).toBe("י");
      expect(result.classNumber).toBe(1);
    });
  });

  describe("updateLastLogin", () => {
    it("updates last login timestamp to current time", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      const { updateLastLogin } = await import("../storage");

      await updateLastLogin("user-123");

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("does not throw error for non-existent user", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 0 });

      const { updateLastLogin } = await import("../storage");

      await expect(updateLastLogin("non-existent-id")).resolves.toBeUndefined();
    });

    it("handles database errors silently", async () => {
      mockDb.query.mockRejectedValue(new Error("Database error"));

      const { updateLastLogin } = await import("../storage");

      await expect(updateLastLogin("user-123")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("deleteUser", () => {
    it("deletes user successfully", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      const { deleteUser } = await import("../storage");

      await deleteUser("user-123");

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("does not throw error for non-existent user", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 0 });

      const { deleteUser } = await import("../storage");

      await expect(deleteUser("non-existent-id")).resolves.toBeUndefined();
    });

    it("cascades deletion to related data", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      const { deleteUser } = await import("../storage");

      await deleteUser("user-with-posts");

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("handles database errors", async () => {
      mockDb.query.mockRejectedValue(new Error("Deletion failed"));

      const { deleteUser } = await import("../storage");

      await expect(deleteUser("user-123")).rejects.toThrow("Deletion failed");
    });
  });
});
