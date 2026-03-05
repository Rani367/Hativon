import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import type { UserRegistration } from "@/types/user.types";

// Use global delegate for db mock (set up in test/setup.ts)
const _g = globalThis as Record<string, unknown>;
let mockDbQuery: ReturnType<typeof mock>;
let originalBunPasswordHash: typeof Bun.password.hash;

// Path to storage module for cache clearing between tests
const storageModulePath = require.resolve("../storage");

describe("User Storage - Create Operations", () => {
  beforeEach(() => {
    // Clear module cache to get fresh non-contaminated imports
    delete require.cache[storageModulePath];

    mockDbQuery = mock(() => undefined);
    _g.__dbQueryMock = mockDbQuery;

    // Save and mock Bun.password.hash
    originalBunPasswordHash = Bun.password.hash;
  });

  afterEach(() => {
    Bun.password.hash = originalBunPasswordHash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password-abc123")) as typeof Bun.password.hash;
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

      expect(Bun.password.hash).toHaveBeenCalledWith("plaintext-password", { algorithm: "bcrypt", cost: 12 });
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
      Bun.password.hash = mock(() => Promise.resolve(hashedPassword)) as typeof Bun.password.hash;
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

      expect(Bun.password.hash).toHaveBeenCalledWith("mysecretpassword", { algorithm: "bcrypt", cost: 12 });
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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
      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-password")) as typeof Bun.password.hash;
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

      Bun.password.hash = mock(() => Promise.resolve("hashed-with-10-rounds")) as typeof Bun.password.hash;
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

      expect(Bun.password.hash).toHaveBeenCalledWith("testpassword", { algorithm: "bcrypt", cost: 12 });
    });
  });
});
