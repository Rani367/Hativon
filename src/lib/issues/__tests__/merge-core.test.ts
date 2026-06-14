import { describe, it, expect } from "bun:test";
import {
  parseMergeGroups,
  canonicalMonthOf,
  resolveDefaultMonth,
  type MergeGroup,
} from "@/lib/issues/merge-core";
import type { ArchiveMonth } from "@/lib/posts/queries";

const MAY_JUNE: MergeGroup = {
  startYear: 2026,
  startMonth: 5,
  endYear: 2026,
  endMonth: 6,
  canonicalYear: 2026,
  canonicalMonth: 6,
  label: "מאי–יוני",
};

describe("merge-core", () => {
  describe("parseMergeGroups", () => {
    it("returns [] for null", () => {
      expect(parseMergeGroups(null)).toEqual([]);
    });

    it("returns [] for invalid JSON", () => {
      expect(parseMergeGroups("not json")).toEqual([]);
    });

    it("returns [] for a non-array", () => {
      expect(parseMergeGroups(JSON.stringify({ foo: "bar" }))).toEqual([]);
    });

    it("parses a valid array of groups", () => {
      expect(parseMergeGroups(JSON.stringify([MAY_JUNE]))).toEqual([MAY_JUNE]);
    });

    it("drops invalid group entries", () => {
      const raw = JSON.stringify([
        MAY_JUNE,
        { startYear: 2026, label: "broken" }, // missing numeric fields
        { ...MAY_JUNE, startMonth: 7, endMonth: 6 }, // start after end
      ]);
      expect(parseMergeGroups(raw)).toEqual([MAY_JUNE]);
    });
  });

  describe("canonicalMonthOf", () => {
    it("maps an in-group month to the group canonical", () => {
      expect(canonicalMonthOf([MAY_JUNE], 2026, 5)).toEqual({
        year: 2026,
        month: 6,
      });
    });

    it("returns the input unchanged for an out-of-group month", () => {
      expect(canonicalMonthOf([MAY_JUNE], 2026, 4)).toEqual({
        year: 2026,
        month: 4,
      });
    });

    it("returns the input unchanged when there are no groups", () => {
      expect(canonicalMonthOf([], 2026, 6)).toEqual({ year: 2026, month: 6 });
    });
  });

  describe("resolveDefaultMonth", () => {
    // The headline regression: a combined May+June issue clears the threshold
    // on its SUMMED count even though June alone (7) is below it.
    it("promotes the merged issue on its combined count (May 10 + June 7 = 17)", () => {
      const archives: ArchiveMonth[] = [
        { year: 2026, month: 6, count: 7 },
        { year: 2026, month: 5, count: 10 },
        { year: 2026, month: 4, count: 20 },
      ];

      const decision = resolveDefaultMonth({
        storedDefault: { year: 2026, month: 4 },
        current: { year: 2026, month: 6 },
        archives,
        groups: [MAY_JUNE],
        minPosts: 15,
      });

      // Switches to the group's canonical month (June), not June alone.
      expect(decision).toEqual({ year: 2026, month: 6, switched: true });
    });

    it("does NOT promote when the combined count is below the threshold", () => {
      const archives: ArchiveMonth[] = [
        { year: 2026, month: 6, count: 4 },
        { year: 2026, month: 5, count: 6 },
      ];

      const decision = resolveDefaultMonth({
        storedDefault: { year: 2026, month: 4 },
        current: { year: 2026, month: 6 },
        archives,
        groups: [MAY_JUNE],
        minPosts: 15,
      });

      expect(decision).toEqual({ year: 2026, month: 4, switched: false });
    });

    it("keeps the stored default when it already resolves to the current issue", () => {
      // Stored default is the canonical June; current calendar month is May —
      // both belong to the same merge group, so no switch is needed.
      const archives: ArchiveMonth[] = [
        { year: 2026, month: 6, count: 7 },
        { year: 2026, month: 5, count: 10 },
      ];

      const decision = resolveDefaultMonth({
        storedDefault: { year: 2026, month: 6 },
        current: { year: 2026, month: 5 },
        archives,
        groups: [MAY_JUNE],
        minPosts: 15,
      });

      expect(decision).toEqual({ year: 2026, month: 6, switched: false });
    });

    describe("with no merge groups (parity with per-month behavior)", () => {
      it("switches to the current month when it clears the threshold", () => {
        const archives: ArchiveMonth[] = [{ year: 2026, month: 6, count: 16 }];

        const decision = resolveDefaultMonth({
          storedDefault: { year: 2026, month: 4 },
          current: { year: 2026, month: 6 },
          archives,
          groups: [],
          minPosts: 15,
        });

        expect(decision).toEqual({ year: 2026, month: 6, switched: true });
      });

      it("keeps the stored default when the current month is below the threshold", () => {
        const archives: ArchiveMonth[] = [{ year: 2026, month: 6, count: 9 }];

        const decision = resolveDefaultMonth({
          storedDefault: { year: 2026, month: 4 },
          current: { year: 2026, month: 6 },
          archives,
          groups: [],
          minPosts: 15,
        });

        expect(decision).toEqual({ year: 2026, month: 4, switched: false });
      });

      it("keeps the stored default when it equals the current month", () => {
        const archives: ArchiveMonth[] = [{ year: 2026, month: 6, count: 99 }];

        const decision = resolveDefaultMonth({
          storedDefault: { year: 2026, month: 6 },
          current: { year: 2026, month: 6 },
          archives,
          groups: [],
          minPosts: 15,
        });

        expect(decision).toEqual({ year: 2026, month: 6, switched: false });
      });
    });
  });
});
