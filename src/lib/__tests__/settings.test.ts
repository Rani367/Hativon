import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the db client
const mockDbQuery = vi.fn();
const mockIsDatabaseAvailable = vi.fn();

vi.mock("../db/client", () => ({
  db: {
    query: (...args: unknown[]) => mockDbQuery(...args),
  },
  isDatabaseAvailable: () => mockIsDatabaseAvailable(),
}));

// Mock the date/months module
vi.mock("../date/months", () => ({
  getCurrentMonthYear: () => ({ year: 2025, month: "january" }),
  monthNumberToEnglish: (month: number) => {
    const months: Record<number, string> = {
      1: "january",
      2: "february",
      3: "march",
      4: "april",
      5: "may",
      6: "june",
      7: "july",
      8: "august",
      9: "september",
      10: "october",
      11: "november",
      12: "december",
    };
    return months[month] || null;
  },
}));

describe("Settings Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getSetting", () => {
    it("returns null when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { getSetting } = await import("../settings");
      const result = await getSetting("test_key");

      expect(result).toBeNull();
    });

    it("returns null when setting is not found", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const { getSetting } = await import("../settings");
      const result = await getSetting("nonexistent_key");

      expect(result).toBeNull();
    });

    it("returns value when setting exists", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [{ value: "test_value" }] });

      const { getSetting } = await import("../settings");
      const result = await getSetting("test_key");

      expect(result).toBe("test_value");
    });

    it("returns null on database error", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockRejectedValue(new Error("DB error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { getSetting } = await import("../settings");
      const result = await getSetting("test_key");

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("setSetting", () => {
    it("throws error when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { setSetting } = await import("../settings");

      await expect(setSetting("test_key", "test_value")).rejects.toThrow(
        "Database not available",
      );
    });

    it("calls database query with correct parameters", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const { setSetting } = await import("../settings");
      await setSetting("test_key", "test_value");

      expect(mockDbQuery).toHaveBeenCalled();
    });

    it("throws error on database failure", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockRejectedValue(new Error("DB error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { setSetting } = await import("../settings");

      await expect(setSetting("test_key", "test_value")).rejects.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe("getAllSettings", () => {
    it("returns empty object when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { getAllSettings } = await import("../settings");
      const result = await getAllSettings();

      expect(result).toEqual({});
    });

    it("returns all settings as key-value pairs", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({
        rows: [
          { key: "setting1", value: "value1" },
          { key: "setting2", value: "value2" },
        ],
      });

      const { getAllSettings } = await import("../settings");
      const result = await getAllSettings();

      expect(result).toEqual({
        setting1: "value1",
        setting2: "value2",
      });
    });
  });

  describe("getDefaultMonth", () => {
    it("returns null when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { getDefaultMonth } = await import("../settings");
      const result = await getDefaultMonth();

      expect(result).toBeNull();
    });

    it("returns null when month setting is missing", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ value: "2025" }] });

      const { getDefaultMonth } = await import("../settings");
      const result = await getDefaultMonth();

      expect(result).toBeNull();
    });

    it("returns null when year setting is missing", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "january" }] })
        .mockResolvedValueOnce({ rows: [] });

      const { getDefaultMonth } = await import("../settings");
      const result = await getDefaultMonth();

      expect(result).toBeNull();
    });

    it("returns year and month when both settings exist", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "january" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2025" }] });

      const { getDefaultMonth } = await import("../settings");
      const result = await getDefaultMonth();

      expect(result).toEqual({ year: 2025, month: "january" });
    });

    it("returns null when year is not a valid number", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "january" }] })
        .mockResolvedValueOnce({ rows: [{ value: "invalid" }] });

      const { getDefaultMonth } = await import("../settings");
      const result = await getDefaultMonth();

      expect(result).toBeNull();
    });
  });

  describe("setDefaultMonth", () => {
    it("throws error when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { setDefaultMonth } = await import("../settings");

      await expect(setDefaultMonth(2025, "january")).rejects.toThrow(
        "Database not available",
      );
    });

    it("sets both month and year settings", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const { setDefaultMonth } = await import("../settings");
      await setDefaultMonth(2025, "January");

      // Should have been called twice (once for month, once for year)
      expect(mockDbQuery).toHaveBeenCalledTimes(2);
    });

    it("converts month to lowercase", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const { setDefaultMonth } = await import("../settings");
      await setDefaultMonth(2025, "JANUARY");

      // The month should be converted to lowercase
      expect(mockDbQuery).toHaveBeenCalled();
    });
  });

  describe("getDefaultMonthWithFallback", () => {
    it("returns current month when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const { getDefaultMonthWithFallback } = await import("../settings");
      const result = await getDefaultMonthWithFallback();

      expect(result).toEqual({ year: 2025, month: "january" });
    });

    it("returns current month when no settings exist", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const { getDefaultMonthWithFallback } = await import("../settings");
      const result = await getDefaultMonthWithFallback();

      expect(result).toEqual({ year: 2025, month: "january" });
    });

    it("returns configured default when settings exist", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "december" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2024" }] });

      const { getDefaultMonthWithFallback } = await import("../settings");
      const result = await getDefaultMonthWithFallback();

      expect(result).toEqual({ year: 2024, month: "december" });
    });
  });

  describe("getPendingMonth", () => {
    it("returns null when no default is set", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const mockGetPostCount = vi.fn().mockResolvedValue(5);

      const { getPendingMonth } = await import("../settings");
      const result = await getPendingMonth(mockGetPostCount);

      expect(result).toBeNull();
    });

    it("returns null when current month equals default", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      // Return january 2025 as default (matches mocked getCurrentMonthYear)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "january" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2025" }] });

      const mockGetPostCount = vi.fn().mockResolvedValue(5);

      const { getPendingMonth } = await import("../settings");
      const result = await getPendingMonth(mockGetPostCount);

      expect(result).toBeNull();
    });

    it("returns null when current month has no posts", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      // Return december 2024 as default (different from current january 2025)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "december" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2024" }] });

      const mockGetPostCount = vi.fn().mockResolvedValue(0);

      const { getPendingMonth } = await import("../settings");
      const result = await getPendingMonth(mockGetPostCount);

      expect(result).toBeNull();
    });

    it("returns pending month when different from default and has posts", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      // Return december 2024 as default (different from current january 2025)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "december" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2024" }] });

      const mockGetPostCount = vi.fn().mockResolvedValue(5);

      const { getPendingMonth } = await import("../settings");
      const result = await getPendingMonth(mockGetPostCount);

      expect(result).toEqual({
        year: 2025,
        month: "january",
        monthNumber: 1,
        postCount: 5,
      });
    });
  });

  describe("getArchiveMonthsWithDefault", () => {
    it("returns empty array when database is not available", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(false);

      const mockGetArchiveMonths = vi.fn().mockResolvedValue([]);

      const { getArchiveMonthsWithDefault } = await import("../settings");
      const result = await getArchiveMonthsWithDefault(mockGetArchiveMonths);

      expect(result).toEqual([]);
    });

    it("marks current default month correctly", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      // Set default to january 2025
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ value: "january" }] })
        .mockResolvedValueOnce({ rows: [{ value: "2025" }] });

      const mockGetArchiveMonths = vi.fn().mockResolvedValue([
        { year: 2025, month: 1, count: 10 },
        { year: 2024, month: 12, count: 5 },
      ]);

      const { getArchiveMonthsWithDefault } = await import("../settings");
      const result = await getArchiveMonthsWithDefault(mockGetArchiveMonths);

      expect(result).toHaveLength(2);
      expect(result[0].isDefault).toBe(true);
      expect(result[0].year).toBe(2025);
      expect(result[0].monthName).toBe("january");
      expect(result[1].isDefault).toBe(false);
    });

    it("includes Hebrew month names", async () => {
      mockIsDatabaseAvailable.mockResolvedValue(true);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const mockGetArchiveMonths = vi.fn().mockResolvedValue([
        { year: 2025, month: 1, count: 10 },
      ]);

      const { getArchiveMonthsWithDefault } = await import("../settings");
      const result = await getArchiveMonthsWithDefault(mockGetArchiveMonths);

      expect(result[0].hebrewMonth).toBe("ינואר");
    });
  });
});
