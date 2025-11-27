import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { User } from "@/types/user.types";

// Mock dependencies before importing
vi.mock("@/lib/users", () => ({
  createUser: vi.fn(),
  usernameExists: vi.fn(),
}));

vi.mock("@/lib/auth/jwt", () => ({
  createAuthCookie: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  isDatabaseAvailable: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";
import { createUser, usernameExists } from "@/lib/users";
import { createAuthCookie } from "@/lib/auth/jwt";
import { isDatabaseAvailable } from "@/lib/db/client";

const mockUser: User = {
  id: "user-123",
  username: "newuser",
  displayName: "New User",
  email: undefined,
  grade: "ח",
  classNumber: 2,
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
    vi.clearAllMocks();
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);
    vi.mocked(usernameExists).mockResolvedValue(false);
    vi.mocked(createUser).mockResolvedValue(mockUser);
    vi.mocked(createAuthCookie).mockReturnValue("authToken=test; HttpOnly");
  });

  describe("Database Availability", () => {
    it("returns 503 when database is not available", async () => {
      vi.mocked(isDatabaseAvailable).mockResolvedValue(false);

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
      expect(data.message).toContain("8");

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
      vi.mocked(usernameExists).mockResolvedValue(true);

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

      expect(createUser).toHaveBeenCalledWith(validRegistrationData);
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on unexpected error", async () => {
      vi.mocked(createUser).mockRejectedValue(new Error("Database error"));

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("returns 409 when createUser throws duplicate error", async () => {
      vi.mocked(createUser).mockRejectedValue(
        new Error("שם המשתמש כבר קיים במערכת"),
      );

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(409);
    });

    it("handles non-Error thrown objects", async () => {
      vi.mocked(createUser).mockRejectedValue("String error");

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
