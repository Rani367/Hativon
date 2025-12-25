import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";

// We need to test verifyAdminPassword in isolation
// The module reads ADMIN_PASSWORD at import time, so we test with current env value
describe("Admin Authentication", () => {
  describe("verifyAdminPassword", () => {
    // Use the value set in test setup
    const TEST_ADMIN_PASSWORD = "test-admin-password";

    beforeEach(() => {
      vi.resetModules();
    });

    it("returns true for correct password", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      const result = await verifyAdminPassword(TEST_ADMIN_PASSWORD);

      expect(result).toBe(true);
    });

    it("returns false for incorrect password", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      const result = await verifyAdminPassword("wrong-password");

      expect(result).toBe(false);
    });

    it("returns false for empty password input", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      const result = await verifyAdminPassword("");

      expect(result).toBe(false);
    });

    it("throws error when ADMIN_PASSWORD env is not set", async () => {
      process.env.ADMIN_PASSWORD = "";

      await expect(async () => {
        await import("../admin");
      }).rejects.toThrow(
        "ADMIN_PASSWORD environment variable must be set for admin panel access.",
      );
    });

    it("is case-sensitive and requires exact match", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      expect(await verifyAdminPassword("TEST-ADMIN-PASSWORD")).toBe(false);
      expect(await verifyAdminPassword("test-admin")).toBe(false);
      expect(await verifyAdminPassword("test-admin-password-extra")).toBe(
        false,
      );
    });

    it("handles special characters and whitespace correctly", async () => {
      process.env.ADMIN_PASSWORD = "p@ssw0rd!#$%";
      const { verifyAdminPassword } = await import("../admin");

      expect(await verifyAdminPassword("p@ssw0rd!#$%")).toBe(true);

      vi.resetModules();
      process.env.ADMIN_PASSWORD = " password with spaces ";
      const { verifyAdminPassword: verify2 } = await import("../admin");

      expect(await verify2(" password with spaces ")).toBe(true);
      expect(await verify2("password with spaces")).toBe(false);
    });

    it("verifies bcrypt hashed passwords correctly", async () => {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
      process.env.ADMIN_PASSWORD = hashedPassword;
      const { verifyAdminPassword } = await import("../admin");

      expect(await verifyAdminPassword(TEST_ADMIN_PASSWORD)).toBe(true);
      expect(await verifyAdminPassword("wrong-password")).toBe(false);
    });

    it("shows warning for plain text passwords", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      await verifyAdminPassword(TEST_ADMIN_PASSWORD);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[SECURITY WARNING] Admin password is not hashed. Run: pnpm run hash-admin-password",
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("setAdminAuth", () => {
    let mockCookies: {
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      vi.resetModules();

      mockCookies = {
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      };

      vi.doMock("next/headers", () => ({
        cookies: vi.fn(() => Promise.resolve(mockCookies)),
      }));

      process.env.ADMIN_PASSWORD = "test-admin-password";
      process.env.JWT_SECRET = "test-jwt-secret-32-characters-long";
    });

    afterEach(() => {
      vi.doUnmock("next/headers");
    });

    it("creates JWT token and sets HTTP-only session cookie", async () => {
      const { setAdminAuth } = await import("../admin");

      await setAdminAuth();

      expect(mockCookies.set).toHaveBeenCalledTimes(1);
      const [cookieName, token, options] = mockCookies.set.mock.calls[0];

      expect(cookieName).toBe("adminAuth");
      expect(typeof token).toBe("string");
      // Session cookie: no maxAge means it expires when browser closes
      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/",
      });

      const decoded = jwt.verify(
        token,
        "test-jwt-secret-32-characters-long",
      ) as { authenticated: boolean; timestamp: number };
      expect(decoded.authenticated).toBe(true);
      expect(decoded.timestamp).toBeGreaterThan(0);
    });

    it("sets secure flag in production environment", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const { setAdminAuth } = await import("../admin");

      await setAdminAuth();

      expect(mockCookies.set).toHaveBeenCalledTimes(1);
      const [, , options] = mockCookies.set.mock.calls[0];

      expect(options.secure).toBe(true);

      vi.unstubAllEnvs();
    });

    it("creates session cookie without maxAge (expires on browser close)", async () => {
      const { setAdminAuth } = await import("../admin");

      await setAdminAuth();

      const [, , options] = mockCookies.set.mock.calls[0];

      // Session cookies have no maxAge - they expire when browser closes
      expect(options.maxAge).toBeUndefined();
    });
  });

  describe("clearAdminAuth", () => {
    let mockCookies: {
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      vi.resetModules();

      mockCookies = {
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      };

      vi.doMock("next/headers", () => ({
        cookies: vi.fn(() => Promise.resolve(mockCookies)),
      }));
    });

    afterEach(() => {
      vi.doUnmock("next/headers");
    });

    it("deletes adminAuth cookie", async () => {
      const { clearAdminAuth } = await import("../admin");

      await clearAdminAuth();

      expect(mockCookies.delete).toHaveBeenCalledTimes(1);
      expect(mockCookies.delete).toHaveBeenCalledWith("adminAuth");
    });
  });

  describe("getAdminClearCookie", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("returns serialized cookie string with maxAge 0", async () => {
      const { getAdminClearCookie } = await import("../admin");

      const result = getAdminClearCookie();

      expect(result).toContain("adminAuth=");
      expect(result).toContain("Max-Age=0");
      expect(result).toContain("HttpOnly");
      expect(result).toContain("SameSite=Strict");
      expect(result).toContain("Path=/");
    });

    it("includes Secure flag in production", async () => {
      vi.stubEnv("NODE_ENV", "production");

      vi.resetModules();
      const { getAdminClearCookie } = await import("../admin");

      const result = getAdminClearCookie();

      expect(result).toContain("Secure");

      vi.unstubAllEnvs();
    });

    it("excludes Secure flag in development", async () => {
      vi.stubEnv("NODE_ENV", "development");

      vi.resetModules();
      const { getAdminClearCookie } = await import("../admin");

      const result = getAdminClearCookie();

      expect(result).not.toContain("Secure");

      vi.unstubAllEnvs();
    });
  });

  describe("isAdminAuthenticated", () => {
    let mockCookies: {
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };
    const JWT_SECRET = "test-jwt-secret-32-characters-long";

    beforeEach(async () => {
      vi.resetModules();

      mockCookies = {
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      };

      vi.doMock("next/headers", () => ({
        cookies: vi.fn(() => Promise.resolve(mockCookies)),
      }));

      process.env.JWT_SECRET = JWT_SECRET;
    });

    afterEach(() => {
      vi.doUnmock("next/headers");
    });

    it("returns true for valid token", async () => {
      const validToken = jwt.sign(
        { authenticated: true, timestamp: Date.now() },
        JWT_SECRET,
      );
      mockCookies.get.mockReturnValue({ value: validToken });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(true);
      expect(mockCookies.get).toHaveBeenCalledWith("adminAuth");
    });

    it("returns false for missing token", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false for empty token value", async () => {
      mockCookies.get.mockReturnValue({ value: "" });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false for invalid JWT token", async () => {
      mockCookies.get.mockReturnValue({ value: "invalid.jwt.token" });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false for token with wrong secret", async () => {
      const wrongToken = jwt.sign(
        { authenticated: true, timestamp: Date.now() },
        "wrong-secret",
      );
      mockCookies.get.mockReturnValue({ value: wrongToken });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false for malformed token", async () => {
      mockCookies.get.mockReturnValue({ value: "not-a-jwt" });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false when authenticated field is false", async () => {
      const invalidPayloadToken = jwt.sign(
        { authenticated: false, timestamp: Date.now() },
        JWT_SECRET,
      );
      mockCookies.get.mockReturnValue({ value: invalidPayloadToken });

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false and logs error when cookies() throws", async () => {
      vi.resetModules();

      vi.doMock("next/headers", () => ({
        cookies: vi.fn(() => Promise.reject(new Error("Cookie access failed"))),
      }));

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { isAdminAuthenticated } = await import("../admin");

      const result = await isAdminAuthenticated();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error checking admin authentication:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("requireAdminAuth", () => {
    let mockCookies: {
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };
    const JWT_SECRET = "test-jwt-secret-32-characters-long";

    beforeEach(async () => {
      vi.resetModules();

      mockCookies = {
        set: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      };

      vi.doMock("next/headers", () => ({
        cookies: vi.fn(() => Promise.resolve(mockCookies)),
      }));

      process.env.JWT_SECRET = JWT_SECRET;
    });

    afterEach(() => {
      vi.doUnmock("next/headers");
    });

    it("does not throw for authenticated admin", async () => {
      const validToken = jwt.sign(
        { authenticated: true, timestamp: Date.now() },
        JWT_SECRET,
      );
      mockCookies.get.mockReturnValue({ value: validToken });

      const { requireAdminAuth } = await import("../admin");

      await expect(requireAdminAuth()).resolves.toBeUndefined();
    });

    it("throws error when not authenticated", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const { requireAdminAuth } = await import("../admin");

      await expect(requireAdminAuth()).rejects.toThrow(
        "Admin authentication required",
      );
    });

    it("throws error for invalid token", async () => {
      mockCookies.get.mockReturnValue({ value: "invalid.token" });

      const { requireAdminAuth } = await import("../admin");

      await expect(requireAdminAuth()).rejects.toThrow(
        "Admin authentication required",
      );
    });
  });
});
