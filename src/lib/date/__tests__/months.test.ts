import { describe, expect, it } from "bun:test";
import { getArchivePathForDate } from "../months";

describe("getArchivePathForDate", () => {
  it("builds an archive path from a date string", () => {
    expect(getArchivePathForDate("2025-12-22T12:00:00.000Z")).toBe(
      "/2025/december",
    );
  });

  it("builds an archive path from a Date object", () => {
    expect(getArchivePathForDate(new Date("2026-05-03T12:00:00.000Z"))).toBe(
      "/2026/may",
    );
  });
});
