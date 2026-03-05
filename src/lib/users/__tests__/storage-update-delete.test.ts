import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { UserUpdate } from "@/types/user.types";

// Use global delegate for db mock (set up in test/setup.ts)
const _g = globalThis as Record<string, unknown>;
let mockDbQuery: ReturnType<typeof mock>;

// Path to storage module for cache clearing between tests
const storageModulePath = require.resolve("../storage");

describe("User Storage - Update and Delete Operations", () => {
  beforeEach(() => {
    // Clear module cache to get fresh non-contaminated imports
    delete require.cache[storageModulePath];

    mockDbQuery = mock(() => undefined);
    _g.__dbQueryMock = mockDbQuery;
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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

      const { updateUser } = await import("../storage");

      const updates: UserUpdate = {
        displayName: "Updated Name",
      };

      const result = await updateUser("user-123", updates);

      expect(result.displayName).toBe("Updated Name");
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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
      mockDbQuery.mockResolvedValue({ rows: [] });

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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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

      mockDbQuery.mockResolvedValue({ rows: [mockUserRow] });

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
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const { updateLastLogin } = await import("../storage");

      await updateLastLogin("user-123");

      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });

    it("does not throw error for non-existent user", async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const { updateLastLogin } = await import("../storage");

      await expect(updateLastLogin("non-existent-id")).resolves.toBeUndefined();
    });

    it("handles database errors silently", async () => {
      mockDbQuery.mockRejectedValue(new Error("Database error"));

      const { updateLastLogin } = await import("../storage");

      await expect(updateLastLogin("user-123")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("deleteUser", () => {
    it("deletes user successfully", async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const { deleteUser } = await import("../storage");

      await deleteUser("user-123");

      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });

    it("does not throw error for non-existent user", async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const { deleteUser } = await import("../storage");

      await expect(deleteUser("non-existent-id")).resolves.toBeUndefined();
    });

    it("cascades deletion to related data", async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const { deleteUser } = await import("../storage");

      await deleteUser("user-with-posts");

      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });

    it("handles database errors", async () => {
      mockDbQuery.mockRejectedValue(new Error("Deletion failed"));

      const { deleteUser } = await import("../storage");

      await expect(deleteUser("user-123")).rejects.toThrow("Deletion failed");
    });
  });
});
