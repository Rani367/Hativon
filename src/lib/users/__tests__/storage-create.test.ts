import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import bcrypt from "bcryptjs";
import type { UserRegistration } from "@/types/user.types";

// Use global delegate for db mock (set up in test/setup.ts)
const _g = globalThis as Record<string, unknown>;
let mockDbQuery: ReturnType<typeof mock>;
let originalBcryptHash: typeof bcrypt.hash;

// Path to storage module for cache clearing between tests
const storageModulePath = require.resolve("../storage");

describe("User Storage - Create Operations", () => {
  beforeEach(() => {
    // Clear module cache to get fresh non-contaminated imports
    delete require.cache[storageModulePath];

    mockDbQuery = mock(() => undefined);
    _g.__dbQueryMock = mockDbQuery;

    originalBcryptHash = bcrypt.hash;
  });

  afterEach(() => {
    bcrypt.hash = originalBcryptHash;
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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password-abc123")) as typeof bcrypt.hash;
      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "testuser",
        password: "plaintext-password",
        displayName: "Test User",
        grade: "י",
        classNumber: 1,
      };

      const result = await createUser(input);

      expect(bcrypt.hash).toHaveBeenCalledWith("plaintext-password", 12);
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
      bcrypt.hash = mock(() => Promise.resolve(hashedPassword)) as typeof bcrypt.hash;
      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "secureuser",
        password: "mysecretpassword",
        displayName: "Secure User",
        grade: "ח",
        classNumber: 2,
      };

      await createUser(input);

      expect(bcrypt.hash).toHaveBeenCalledWith("mysecretpassword", 12);
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "fulluser",
        password: "password123",
        displayName: "Full User Name",
        grade: "ט",
        classNumber: 3,
      };

      const result = await createUser(input);

      // The storage layer returns Date objects (pg driver) and null, while the
      // User type models these fields as string/optional — widen for the compare.
      expect(result as unknown).toEqual({
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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockRejectedValue(dbError);

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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockRejectedValue(dbError);

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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockRejectedValue(dbError);

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
      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockRejectedValue("String error message");

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

      bcrypt.hash = mock(() => Promise.resolve("hashed-password")) as typeof bcrypt.hash;
      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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

      bcrypt.hash = mock(() => Promise.resolve("hashed-with-10-rounds")) as typeof bcrypt.hash;
      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

      const { createUser } = await import("../storage");

      const input: UserRegistration = {
        username: "saltuser",
        password: "testpassword",
        displayName: "Salt User",
        grade: "י",
        classNumber: 1,
      };

      await createUser(input);

      expect(bcrypt.hash).toHaveBeenCalledWith("testpassword", 12);
    });
  });
});
