import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";
import type { User } from "@/types/user.types";

// Mock dependencies before importing
// Must provide ALL barrel exports to avoid contaminating sub-module imports
mock.module("@/lib/users", () => ({
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

mock.module("@/lib/auth/jwt", () => ({
  createAuthCookie: mock(() => undefined),
}));

// @/lib/db/client and @/lib/logger are mocked via global delegates in test/setup.ts.

// Mock rate-limit with ALL exports to avoid contaminating rate-limit.test.ts
const _rlCheck = mock(() =>
  Promise.resolve({ success: true, remaining: 5, reset: Date.now() + 60000 }),
);
const _rlCheckRateLimit = mock(() => Promise.resolve({ limited: false }));
mock.module("@/lib/rate-limit", () => ({
  checkRateLimit: _rlCheckRateLimit,
  createRateLimiter: mock(() => ({ check: _rlCheck })),
  getClientIdentifier: mock(() => "test-ip"),
  loginRateLimiter: { check: _rlCheck },
  registerRateLimiter: { check: _rlCheck },
  authRateLimiter: { check: _rlCheck },
}));

import { POST } from "@/app/api/auth/register/route";
import { createUser, usernameExists } from "@/lib/users";
import { createAuthCookie } from "@/lib/auth/jwt";

// isDatabaseAvailable is controlled via global delegate
const _g = globalThis as Record<string, unknown>;

const mockUser: User = {
  id: "user-123",
  username: "newuser",
  displayName: "New User",
  email: undefined,
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const validRegistrationData = {
  username: "newuser",
  password: "password123",
  displayName: "New User",
  grade: "ח",
  classNumber: 2,
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    (createUser as ReturnType<typeof mock>).mockReset();
    (usernameExists as ReturnType<typeof mock>).mockReset();
    (createAuthCookie as ReturnType<typeof mock>).mockReset();

    // Reset global delegate for db/client
    _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(true));
    // Reset rate-limit mock
    _rlCheckRateLimit.mockImplementation(() => Promise.resolve({ limited: false }));

    (usernameExists as ReturnType<typeof mock>).mockResolvedValue(false);
    (createUser as ReturnType<typeof mock>).mockResolvedValue(mockUser);
    (createAuthCookie as ReturnType<typeof mock>).mockReturnValue("authToken=test; HttpOnly");
  });

  describe("Database Availability", () => {
    it("returns 503 when database is not available", async () => {
      _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(false));

      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.message).toContain("מקומי");
    });
  });

  describe("Validation", () => {
    it.each([
      [
        "username",
        {
          password: "password123",
          displayName: "User",
          grade: "ח",
          classNumber: 2,
        },
      ],
      [
        "password",
        {
          username: "newuser",
          displayName: "User",
          grade: "ח",
          classNumber: 2,
        },
      ],
      [
        "displayName",
        {
          username: "newuser",
          password: "password123",
          grade: "ח",
          classNumber: 2,
        },
      ],
      [
        "grade",
        {
          username: "newuser",
          password: "password123",
          displayName: "User",
          classNumber: 2,
        },
      ],
      [
        "classNumber",
        {
          username: "newuser",
          password: "password123",
          displayName: "User",
          grade: "ח",
        },
      ],
    ])("returns 400 when %s is missing", async (field, data) => {
      const request = createRequest(data);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Username Validation", () => {
    it.each([
      ["too short", "ab"],
      ["special characters", "user@name"],
      ["with spaces", "user name"],
    ])("returns 400 for username that is %s", async (reason, username) => {
      const request = createRequest({
        ...validRegistrationData,
        username,
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it.each([["user_name_123"], ["user123"]])(
      "accepts valid username: %s",
      async (username) => {
        const request = createRequest({
          ...validRegistrationData,
          username,
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      },
    );
  });

  describe("Password Validation", () => {
    it("validates password length (minimum 8 characters)", async () => {
      const tooShort = createRequest({
        ...validRegistrationData,
        password: "1234567",
      });
      const tooShortResponse = await POST(tooShort);
      const data = await tooShortResponse.json();

      expect(tooShortResponse.status).toBe(400);
      expect(data.success).toBe(false);
      // Zod validation returns Hebrew error message
      expect(data.message).toBeTruthy();

      const validLength = createRequest({
        ...validRegistrationData,
        password: "12345678",
      });
      const validResponse = await POST(validLength);

      expect(validResponse.status).toBe(201);
    });
  });

  describe("Grade Validation", () => {
    it.each([["ז"], ["ח"], ["ט"], ["י"]])(
      "accepts valid grade %s",
      async (grade) => {
        const request = createRequest({
          ...validRegistrationData,
          grade,
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      },
    );

    it("returns 400 for invalid grade", async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: "א",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Class Number Validation", () => {
    it.each([[1], [2], [3], [4]])(
      "accepts valid class number %i",
      async (classNumber) => {
        const request = createRequest({
          ...validRegistrationData,
          classNumber,
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      },
    );

    it.each([[0], [5]])(
      "returns 400 for invalid class number %i",
      async (classNumber) => {
        const request = createRequest({
          ...validRegistrationData,
          classNumber,
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      },
    );
  });

  describe("Duplicate Username", () => {
    it("returns 409 when username already exists", async () => {
      (usernameExists as ReturnType<typeof mock>).mockResolvedValue(true);

      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain("קיים");
    });
  });

  describe("Successful Registration", () => {
    it("returns 201 with user data", async () => {
      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });

    it("sets auth cookie and clears admin cookie in response headers", async () => {
      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("authToken=test; HttpOnly");
      expect(setCookie).toContain("adminAuth=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("calls createUser with registration data", async () => {
      const request = createRequest(validRegistrationData);
      await POST(request);

      expect(createUser).toHaveBeenCalledWith({
        ...validRegistrationData,
        isTeacher: false,
      });
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on unexpected error", async () => {
      (createUser as ReturnType<typeof mock>).mockRejectedValue(new Error("Database error"));

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("returns 409 when createUser throws duplicate error", async () => {
      (createUser as ReturnType<typeof mock>).mockRejectedValue(
        new Error("שם המשתמש כבר קיים במערכת"),
      );

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(409);
    });

    it("handles non-Error thrown objects", async () => {
      (createUser as ReturnType<typeof mock>).mockRejectedValue("String error");

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
