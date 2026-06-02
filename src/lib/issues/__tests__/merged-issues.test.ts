import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  findMergeGroup,
  rangeBoundsOf,
  collapseArchiveMonths,
  getMergeGroups,
  resolveMergeGroup,
  getIssue,
  type MergeGroup,
} from "@/lib/issues/merged-issues";
import type { ArchiveMonth } from "@/lib/posts/queries";

const _g = globalThis as Record<string, unknown>;

const MAY_JUNE: MergeGroup = {
  startYear: 2026,
  startMonth: 5,
  endYear: 2026,
  endMonth: 6,
  canonicalYear: 2026,
  canonicalMonth: 6,
  label: "מאי–יוני",
};

/**
 * A DB mock that answers the three query shapes merged-issues touches:
 * the settings read (merged_issues), the range COUNT, and the range SELECT.
 */
function makeDbMock(opts: {
  groups?: MergeGroup[] | null;
  count?: number;
  rows?: unknown[];
}) {
  const sqlText = (args: unknown[]): string => {
    const first = args[0];
    return Array.isArray(first) ? (first as string[]).join(" ") : String(first);
  };

  return mock((...args: unknown[]) => {
    const sql = sqlText(args);

    if (sql.includes("FROM settings WHERE key")) {
      const key = args[args.length - 1];
      if (key === "merged_issues" && opts.groups) {
        return Promise.resolve({
          rows: [{ value: JSON.stringify(opts.groups) }],
        });
      }
      return Promise.resolve({ rows: [] });
    }

    if (sql.includes("COUNT(*)")) {
      return Promise.resolve({ rows: [{ count: String(opts.count ?? 0) }] });
    }

    if (sql.includes("p.id")) {
      return Promise.resolve({ rows: opts.rows ?? [] });
    }

    return Promise.resolve({ rows: [] });
  });
}

describe("merged-issues pure helpers", () => {
  describe("findMergeGroup", () => {
    const groups = [MAY_JUNE];

    it("maps both member months to the group", () => {
      expect(findMergeGroup(groups, 2026, 5)).toBe(MAY_JUNE);
      expect(findMergeGroup(groups, 2026, 6)).toBe(MAY_JUNE);
    });

    it("returns null for months outside the range", () => {
      expect(findMergeGroup(groups, 2026, 4)).toBeNull();
      expect(findMergeGroup(groups, 2026, 7)).toBeNull();
      expect(findMergeGroup(groups, 2025, 5)).toBeNull();
    });

    it("returns null when there are no groups", () => {
      expect(findMergeGroup([], 2026, 5)).toBeNull();
    });
  });

  describe("rangeBoundsOf", () => {
    it("produces a half-open range with the exclusive end one month past", () => {
      expect(rangeBoundsOf(MAY_JUNE)).toEqual({
        startInclusive: "2026-05-01 00:00:00",
        endExclusive: "2026-07-01 00:00:00",
      });
    });

    it("rolls the year over when the range ends in December", () => {
      const decJan: MergeGroup = {
        startYear: 2026,
        startMonth: 11,
        endYear: 2026,
        endMonth: 12,
        canonicalYear: 2026,
        canonicalMonth: 12,
        label: "נובמבר–דצמבר",
      };
      expect(rangeBoundsOf(decJan)).toEqual({
        startInclusive: "2026-11-01 00:00:00",
        endExclusive: "2027-01-01 00:00:00",
      });
    });
  });

  describe("collapseArchiveMonths", () => {
    it("folds member rows into one canonical row with summed count + label", () => {
      const raw: ArchiveMonth[] = [
        { year: 2026, month: 6, count: 9 },
        { year: 2026, month: 5, count: 7 },
        { year: 2026, month: 3, count: 4 },
      ];

      const collapsed = collapseArchiveMonths(raw, [MAY_JUNE]);

      expect(collapsed).toEqual([
        { year: 2026, month: 6, count: 16, label: "מאי–יוני" },
        { year: 2026, month: 3, count: 4 },
      ]);
    });

    it("still emits a canonical row when only a non-canonical member has posts", () => {
      const raw: ArchiveMonth[] = [{ year: 2026, month: 5, count: 7 }];

      const collapsed = collapseArchiveMonths(raw, [MAY_JUNE]);

      expect(collapsed).toEqual([
        { year: 2026, month: 6, count: 7, label: "מאי–יוני" },
      ]);
    });

    it("returns the input unchanged when there are no groups", () => {
      const raw: ArchiveMonth[] = [{ year: 2026, month: 5, count: 7 }];
      expect(collapseArchiveMonths(raw, [])).toBe(raw);
    });
  });
});

describe("merged-issues DB-backed helpers", () => {
  beforeEach(() => {
    _g.__dbQueryMock = makeDbMock({ groups: [MAY_JUNE], count: 16 });
  });

  afterEach(() => {
    _g.__dbQueryMock = mock(() => Promise.resolve({ rows: [] }));
  });

  it("getMergeGroups parses configured groups", async () => {
    const groups = await getMergeGroups();
    expect(groups).toEqual([MAY_JUNE]);
  });

  it("getMergeGroups returns [] when unset", async () => {
    _g.__dbQueryMock = makeDbMock({ groups: null });
    expect(await getMergeGroups()).toEqual([]);
  });

  it("resolveMergeGroup resolves members and rejects non-members", async () => {
    expect(await resolveMergeGroup(2026, 5)).toEqual(MAY_JUNE);
    expect(await resolveMergeGroup(2026, 6)).toEqual(MAY_JUNE);
    expect(await resolveMergeGroup(2026, 4)).toBeNull();
  });

  it("getIssue serves a merged member from the combined range", async () => {
    const issue = await getIssue(2026, 5, { limit: 12, offset: 0 });

    expect(issue.isMerged).toBe(true);
    expect(issue.canonicalYear).toBe(2026);
    expect(issue.canonicalMonth).toBe(6);
    expect(issue.canonicalMonthEn).toBe("june");
    expect(issue.hebrewLabel).toBe("מאי–יוני");
    expect(issue.result.total).toBe(16);
  });

  it("getIssue falls back to a single month when not merged", async () => {
    const issue = await getIssue(2026, 3, { limit: 12, offset: 0 });

    expect(issue.isMerged).toBe(false);
    expect(issue.canonicalMonth).toBe(3);
    expect(issue.canonicalMonthEn).toBe("march");
    expect(issue.hebrewLabel).toBe("מרץ");
  });
});
