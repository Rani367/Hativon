import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before importing
vi.mock("@/lib/auth/admin", () => ({
  verifyAdminPassword: vi.fn(),
  setAdminAuth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// Mock rate limiter to always allow requests in tests
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => ({
    check: vi.fn().mockResolvedValue({
      success: true,
      remaining: 5,
      reset: Date.now() + 60000,
    }),
  })),
  getClientIdentifier: vi.fn().mockReturnValue("test-ip"),
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
    vi.clearAllMocks();
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
      vi.mocked(verifyAdminPassword).mockResolvedValue(true);
      vi.mocked(setAdminAuth).mockResolvedValue(undefined);

      const request = createRequest({ password: "correct-password" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("calls verifyAdminPassword with provided password", async () => {
      vi.mocked(verifyAdminPassword).mockResolvedValue(true);
      vi.mocked(setAdminAuth).mockResolvedValue(undefined);

      const request = createRequest({ password: "test-password" });
      await POST(request);

      expect(verifyAdminPassword).toHaveBeenCalledWith("test-password");
    });

    it("sets admin auth cookie on success", async () => {
      vi.mocked(verifyAdminPassword).mockResolvedValue(true);
      vi.mocked(setAdminAuth).mockResolvedValue(undefined);

      const request = createRequest({ password: "correct-password" });
      await POST(request);

      expect(setAdminAuth).toHaveBeenCalled();
    });

    it("returns 401 for incorrect password", async () => {
      vi.mocked(verifyAdminPassword).mockResolvedValue(false);

      const request = createRequest({ password: "wrong-password" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid admin password");
    });

    it("does not set auth cookie on failed verification", async () => {
      vi.mocked(verifyAdminPassword).mockResolvedValue(false);

      const request = createRequest({ password: "wrong-password" });
      await POST(request);

      expect(setAdminAuth).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on setAdminAuth error", async () => {
      vi.mocked(verifyAdminPassword).mockResolvedValue(true);
      vi.mocked(setAdminAuth).mockRejectedValue(new Error("Cookie error"));

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
      vi.mocked(verifyAdminPassword).mockResolvedValue(false);

      const request = createRequest({ password: "wrong" });
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe("Invalid admin password");
      expect(data.error).not.toContain("correct");
    });
  });
});
