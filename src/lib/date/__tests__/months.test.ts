import { describe, expect, it } from "bun:test";
import { formatHebrewDate } from "../format";
import {
  englishMonthToNumber,
  monthNumberToEnglish,
  monthNumberToHebrew,
} from "../months";

describe("month names", () => {
  it("maps numbers to names in both languages", () => {
    expect(monthNumberToEnglish(6)).toBe("june");
    expect(monthNumberToHebrew(6)).toBe("יוני");
  });

  it("spells September correctly", () => {
    expect(monthNumberToHebrew(9)).toBe("ספטמבר");
  });

  it("rejects numbers outside the year", () => {
    expect(monthNumberToEnglish(0)).toBeNull();
    expect(monthNumberToEnglish(13)).toBeNull();
    expect(monthNumberToHebrew(13)).toBeNull();
  });

  it("reads URL month names in any letter case", () => {
    expect(englishMonthToNumber("may")).toBe(5);
    expect(englishMonthToNumber("May")).toBe(5);
    expect(englishMonthToNumber("MAY")).toBe(5);
  });

  it("rejects unknown month names", () => {
    expect(englishMonthToNumber("notamonth")).toBeNull();
    expect(englishMonthToNumber("")).toBeNull();
  });
});

describe("formatHebrewDate", () => {
  it("uses Israel's date, not the server's", () => {
    // 22:30 UTC on 31 December is already 1 January in Israel.
    expect(formatHebrewDate("2025-12-31T22:30:00Z")).toContain("בינואר");
  });
});
