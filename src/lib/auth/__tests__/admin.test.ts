import { describe, it, expect, vi, beforeEach } from "vitest";

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

      const result = verifyAdminPassword(TEST_ADMIN_PASSWORD);

      expect(result).toBe(true);
    });

    it("returns false for incorrect password", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      const result = verifyAdminPassword("wrong-password");

      expect(result).toBe(false);
    });

    it("returns false for empty password input", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      const result = verifyAdminPassword("");

      expect(result).toBe(false);
    });

    it("returns false when ADMIN_PASSWORD env is not set", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      process.env.ADMIN_PASSWORD = "";
      const { verifyAdminPassword } = await import("../admin");

      const result = verifyAdminPassword("any-password");

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "ADMIN_PASSWORD environment variable is not set",
      );

      consoleErrorSpy.mockRestore();
    });

    it("is case-sensitive and requires exact match", async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import("../admin");

      expect(verifyAdminPassword("TEST-ADMIN-PASSWORD")).toBe(false);
      expect(verifyAdminPassword("test-admin")).toBe(false);
      expect(verifyAdminPassword("test-admin-password-extra")).toBe(false);
    });

    it("handles special characters and whitespace correctly", async () => {
      process.env.ADMIN_PASSWORD = "p@ssw0rd!#$%";
      const { verifyAdminPassword } = await import("../admin");

      expect(verifyAdminPassword("p@ssw0rd!#$%")).toBe(true);

      vi.resetModules();
      process.env.ADMIN_PASSWORD = " password with spaces ";
      const { verifyAdminPassword: verify2 } = await import("../admin");

      expect(verify2(" password with spaces ")).toBe(true);
      expect(verify2("password with spaces")).toBe(false);
    });
  });
});
