import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Mock dependencies before importing
mock.module("@/lib/auth/admin", () => ({
  verifyAdminPassword: mock(() => undefined),
  setAdminAuth: mock(() => undefined),
}));

// @/lib/logger is mocked via global delegates in test/setup.ts.

// Mock rate-limit with ALL exports to avoid contaminating rate-limit.test.ts
const _rlCheck = mock(() =>
  Promise.resolve({ success: true, remaining: 5, reset: Date.now() + 60000 }),
);
mock.module("@/lib/rate-limit", () => ({
  checkRateLimit: mock(() => Promise.resolve({ limited: false })),
  createRateLimiter: mock(() => ({ check: _rlCheck })),
  getClientIdentifier: mock(() => "test-ip"),
  loginRateLimiter: { check: _rlCheck },
  registerRateLimiter: { check: _rlCheck },
  authRateLimiter: { check: _rlCheck },
}));

import { POST } from "@/app/api/admin/verify-password/route";
import { verifyAdminPassword, setAdminAuth } from "@/lib/auth/admin";

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return new NextRequest("http://localhost:3000/api/admin/verify-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

describe("POST /api/admin/verify-password", () => {
  beforeEach(() => {
    (verifyAdminPassword as ReturnType<typeof mock>).mockReset();
    (setAdminAuth as ReturnType<typeof mock>).mockReset();
  });

  describe("Validation", () => {
    it("returns 400 when password is missing or empty", async () => {
      const missingRequest = createRequest({});
      const missingResponse = await POST(missingRequest);
      const missingData = await missingResponse.json();

      expect(missingResponse.status).toBe(400);
      expect(missingData.error).toBe("Password is required");

      const emptyRequest = createRequest({ password: "" });
      const emptyResponse = await POST(emptyRequest);

      expect(emptyResponse.status).toBe(400);
    });
  });

  describe("Password Verification", () => {
    it("returns 200 for correct password", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(true);
      (setAdminAuth as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const request = createRequest({ password: "correct-password" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("calls verifyAdminPassword with provided password", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(true);
      (setAdminAuth as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const request = createRequest({ password: "test-password" });
      await POST(request);

      expect(verifyAdminPassword).toHaveBeenCalledWith("test-password");
    });

    it("sets admin auth cookie on success", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(true);
      (setAdminAuth as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const request = createRequest({ password: "correct-password" });
      await POST(request);

      expect(setAdminAuth).toHaveBeenCalled();
    });

    it("returns 401 for incorrect password", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(false);

      const request = createRequest({ password: "wrong-password" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid admin password");
    });

    it("does not set auth cookie on failed verification", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(false);

      const request = createRequest({ password: "wrong-password" });
      await POST(request);

      expect(setAdminAuth).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on setAdminAuth error", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(true);
      (setAdminAuth as ReturnType<typeof mock>).mockRejectedValue(new Error("Cookie error"));

      const request = createRequest({ password: "correct-password" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to verify password");
    });

    it("handles JSON parse error gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/verify-password",
        {
          method: "POST",
          body: "invalid-json",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      // JSON parse errors are caught in the catch block and return 500
      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Security", () => {
    it("does not leak information about admin password", async () => {
      (verifyAdminPassword as ReturnType<typeof mock>).mockResolvedValue(false);

      const request = createRequest({ password: "wrong" });
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe("Invalid admin password");
      expect(data.error).not.toContain("correct");
    });
  });
});
