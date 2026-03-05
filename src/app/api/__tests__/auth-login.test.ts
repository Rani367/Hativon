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

import { POST } from "@/app/api/auth/login/route";
import { validatePassword, updateLastLogin } from "@/lib/users";
import { createAuthCookie } from "@/lib/auth/jwt";

// isDatabaseAvailable and checkRateLimit are controlled via global delegates
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

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    (validatePassword as ReturnType<typeof mock>).mockReset();
    (updateLastLogin as ReturnType<typeof mock>).mockReset();
    (createAuthCookie as ReturnType<typeof mock>).mockReset();

    // Reset global delegate for db/client
    _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(true));
    // Reset rate-limit mock
    _rlCheckRateLimit.mockImplementation(() => Promise.resolve({ limited: false }));

    (createAuthCookie as ReturnType<typeof mock>).mockReturnValue("authToken=test; HttpOnly");
  });

  describe("Validation", () => {
    it("returns 400 when username is missing or empty", async () => {
      const missingRequest = createRequest({ password: "password123" });
      const missingResponse = await POST(missingRequest);
      const missingData = await missingResponse.json();

      expect(missingResponse.status).toBe(400);
      expect(missingData.success).toBe(false);
      expect(missingData.message).toContain("שם משתמש");

      const emptyRequest = createRequest({
        username: "",
        password: "password123",
      });
      const emptyResponse = await POST(emptyRequest);

      expect(emptyResponse.status).toBe(400);
    });

    it("returns 400 when password is missing or empty", async () => {
      const missingRequest = createRequest({ username: "testuser" });
      const missingResponse = await POST(missingRequest);
      const missingData = await missingResponse.json();

      expect(missingResponse.status).toBe(400);
      expect(missingData.success).toBe(false);
      expect(missingData.message).toContain("סיסמה");

      const emptyRequest = createRequest({
        username: "testuser",
        password: "",
      });
      const emptyResponse = await POST(emptyRequest);

      expect(emptyResponse.status).toBe(400);
    });
  });

  describe("Database Authentication", () => {
    it("returns 200 with user data for valid credentials", async () => {
      (validatePassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const request = createRequest({
        username: "testuser",
        password: "correctpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });

    it("sets auth cookie and clears admin cookie in response headers", async () => {
      (validatePassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const request = createRequest({
        username: "testuser",
        password: "correctpassword",
      });

      const response = await POST(request);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("authToken=test; HttpOnly");
      expect(setCookie).toContain("adminAuth=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("updates last login timestamp", async () => {
      (validatePassword as ReturnType<typeof mock>).mockResolvedValue(mockUser);

      const request = createRequest({
        username: "testuser",
        password: "correctpassword",
      });

      await POST(request);

      expect(updateLastLogin).toHaveBeenCalledWith("user-123");
    });

    it("returns 401 for invalid credentials", async () => {
      (validatePassword as ReturnType<typeof mock>).mockResolvedValue(null);

      const request = createRequest({
        username: "testuser",
        password: "wrongpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("שגויים");
    });
  });

  describe("Legacy Admin Mode", () => {
    beforeEach(() => {
      _g.__isDatabaseAvailableMock = mock(() => Promise.resolve(false));
      process.env.ADMIN_PASSWORD = "admin123";
    });

    it("returns 200 for admin credentials in legacy mode", async () => {
      const request = createRequest({
        username: "admin",
        password: "admin123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe("legacy-admin");
      expect(data.user.username).toBe("admin");
    });

    it("returns 401 for wrong admin password", async () => {
      const request = createRequest({
        username: "admin",
        password: "wrongpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 401 for non-admin username", async () => {
      const request = createRequest({
        username: "notadmin",
        password: "admin123",
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("returns 503 when ADMIN_PASSWORD is not set", async () => {
      process.env.ADMIN_PASSWORD = "";

      const request = createRequest({
        username: "admin",
        password: "anypassword",
      });

      const response = await POST(request);

      expect(response.status).toBe(503);
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on unexpected error", async () => {
      (validatePassword as ReturnType<typeof mock>).mockRejectedValue(
        new Error("Database error"),
      );

      const request = createRequest({
        username: "testuser",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("handles JSON parse error gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: "invalid-json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      // Improved error handling: JSON parse errors return 400 instead of 500
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
