import { describe, expect, it } from "bun:test";
import { monthNumberToHebrew } from "@/lib/date/months";
import { getLabelWidth } from "../label-width";

describe("getLabelWidth", () => {
  it("knows every month's measured width", () => {
    for (let month = 1; month <= 12; month += 1) {
      const name = monthNumberToHebrew(month)!;
      expect(getLabelWidth(name)).not.toBe(name.length * 0.52);
    }
  });

  it("adds up a merged issue's months and its dash", () => {
    expect(getLabelWidth("מאי–יוני")).toBeCloseTo(1.43 + 0.47 + 1.29);
  });

  it("gives an unknown label a safe width from its length", () => {
    expect(getLabelWidth("גיליון מיוחד")).toBeCloseTo(12 * 0.52);
  });
});
