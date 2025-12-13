import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateToken,
  verifyToken,
  createAuthCookie,
  clearAuthCookie,
  extractTokenFromCookies,
} from "../jwt";
import type { User } from "@/types/user.types";

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("JWT Token Management", () => {
  describe("module initialization", () => {
    it("throws error when JWT_SECRET is not set", async () => {
      vi.stubEnv("JWT_SECRET", "");

      vi.resetModules();

      await expect(async () => {
        await import("../jwt");
      }).rejects.toThrow(
        "JWT_SECRET environment variable must be set. Generate one with: openssl rand -base64 32",
      );

      vi.unstubAllEnvs();
    });
  });

  describe("generateToken", () => {
    it("generates a valid JWT token", () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("includes userId and username in payload", () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as { userId: string; username: string };

      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
    });

    it("includes expiration claim", () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as { exp: number };

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe("number");
    });

    it("sets expiration to 7 days by default", () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as { iat: number; exp: number };
      const sevenDaysInSeconds = 604800;

      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(sevenDaysInSeconds);
    });

    it("does not include sensitive user information", () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.email).toBeUndefined();
      expect(decoded.displayName).toBeUndefined();
      expect(decoded.grade).toBeUndefined();
      expect(decoded.classNumber).toBeUndefined();
    });
  });

  describe("verifyToken", () => {
    it("returns payload for valid token", () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.username).toBe(mockUser.username);
    });

    it("returns null for invalid tokens", () => {
      const invalidTokens = [
        "invalid-token",
        "not.a.valid.jwt.token",
        "",
        jwt.sign(
          { userId: mockUser.id, username: mockUser.username },
          "wrong-secret",
        ),
        jwt.sign(
          { userId: mockUser.id, username: mockUser.username },
          process.env.JWT_SECRET || "test-jwt-secret-key-at-least-32-chars",
          { expiresIn: -1 },
        ),
      ];

      invalidTokens.forEach((token) => {
        expect(verifyToken(token)).toBeNull();
      });
    });
  });

  describe("createAuthCookie", () => {
    it("creates cookie string with token", () => {
      const cookie = createAuthCookie(mockUser);

      expect(cookie).toContain("authToken=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
      expect(cookie).toContain("Path=/");
    });

    it("sets MaxAge to session duration", () => {
      const cookie = createAuthCookie(mockUser);

      expect(cookie).toContain("Max-Age=");
    });

    it("sets Secure flag in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const cookie = createAuthCookie(mockUser);
      expect(cookie).toContain("Secure");

      vi.unstubAllEnvs();
    });

    it("does not set Secure flag in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const cookie = createAuthCookie(mockUser);
      expect(cookie).not.toContain("Secure");

      vi.unstubAllEnvs();
    });
  });

  describe("clearAuthCookie", () => {
    it("creates cookie with empty value", () => {
      const cookie = clearAuthCookie();

      expect(cookie).toContain("authToken=");
    });

    it("sets MaxAge to 0", () => {
      const cookie = clearAuthCookie();

      expect(cookie).toContain("Max-Age=0");
    });

    it("includes HttpOnly and SameSite flags", () => {
      const cookie = clearAuthCookie();

      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });
  });

  describe("extractTokenFromCookies", () => {
    it("extracts token from cookie string", () => {
      const cookieHeader = "authToken=jwt.token.here; other=value";
      const token = extractTokenFromCookies(cookieHeader);

      expect(token).toBe("jwt.token.here");
    });

    it("returns null for null cookie header", () => {
      const token = extractTokenFromCookies(null);

      expect(token).toBeNull();
    });

    it("returns null when authToken is not present", () => {
      const cookieHeader = "other=value; another=test";
      const token = extractTokenFromCookies(cookieHeader);

      expect(token).toBeNull();
    });

    it("handles multiple cookies correctly", () => {
      const cookieHeader = "session=abc; authToken=jwt.token.value; user=123";
      const token = extractTokenFromCookies(cookieHeader);

      expect(token).toBe("jwt.token.value");
    });

    it("handles cookies with spaces", () => {
      const cookieHeader = "  authToken=token.with.spaces  ; other=val";
      const token = extractTokenFromCookies(cookieHeader);

      expect(token).toBe("token.with.spaces");
    });

    it("returns null for empty token value", () => {
      const cookieHeader = "authToken=; other=value";
      const token = extractTokenFromCookies(cookieHeader);

      // Empty string is falsy, so || null returns null
      expect(token).toBeNull();
    });
  });
});
