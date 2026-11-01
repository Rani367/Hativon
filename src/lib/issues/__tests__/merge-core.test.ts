import { describe, expect, it } from "bun:test";
import {
  type ArchiveMonth,
  type MergeGroup,
  chooseHomeIssue,
  collapseArchiveMonths,
  findMergeGroup,
  monthRangeBounds,
  parseHomeIssuePin,
  parseMergeGroups,
} from "../merge-core";

// The real group in production.
const mayJune: MergeGroup = {
  startYear: 2026,
  startMonth: 5,
  endYear: 2026,
  endMonth: 6,
  canonicalYear: 2026,
  canonicalMonth: 6,
  label: "מאי–יוני",
};

const archive: ArchiveMonth[] = [
  { year: 2026, month: 10, count: 1 },
  { year: 2026, month: 6, count: 21 },
  { year: 2026, month: 5, count: 7 },
  { year: 2026, month: 4, count: 19 },
];

describe("parseMergeGroups", () => {
  it("reads the stored production value", () => {
    expect(parseMergeGroups(JSON.stringify([mayJune]))).toEqual([mayJune]);
  });

  it("treats empty, malformed and non-array values as no groups", () => {
    expect(parseMergeGroups(null)).toEqual([]);
    expect(parseMergeGroups("")).toEqual([]);
    expect(parseMergeGroups("not json")).toEqual([]);
    expect(parseMergeGroups('{"a":1}')).toEqual([]);
  });

  it("drops invalid groups and keeps valid ones", () => {
    const backwards = { ...mayJune, startMonth: 7, endMonth: 6 };
    const unlabelled = { ...mayJune, label: "" };
    const stringy = { ...mayJune, startYear: "2026" };

    expect(
      parseMergeGroups(JSON.stringify([backwards, mayJune, unlabelled, stringy])),
    ).toEqual([mayJune]);
  });
});

describe("findMergeGroup", () => {
  it("finds every month in the span", () => {
    expect(findMergeGroup([mayJune], 2026, 5)).toBe(mayJune);
    expect(findMergeGroup([mayJune], 2026, 6)).toBe(mayJune);
  });

  it("finds nothing outside the span", () => {
    expect(findMergeGroup([mayJune], 2026, 4)).toBeNull();
    expect(findMergeGroup([mayJune], 2026, 7)).toBeNull();
    expect(findMergeGroup([mayJune], 2025, 5)).toBeNull();
  });
});

describe("monthRangeBounds", () => {
  it("covers one month", () => {
    const month = { year: 2026, month: 4 };
    expect(monthRangeBounds(month, month)).toEqual({
      startInclusive: "2026-04-01 00:00:00",
      endExclusive: "2026-05-01 00:00:00",
    });
  });

  it("covers a merged span", () => {
    expect(
      monthRangeBounds({ year: 2026, month: 5 }, { year: 2026, month: 6 }),
    ).toEqual({
      startInclusive: "2026-05-01 00:00:00",
      endExclusive: "2026-07-01 00:00:00",
    });
  });

  it("rolls over the end of the year", () => {
    const december = { year: 2025, month: 12 };
    expect(monthRangeBounds(december, december).endExclusive).toBe(
      "2026-01-01 00:00:00",
    );
  });
});

describe("collapseArchiveMonths", () => {
  it("returns the input when there are no groups", () => {
    expect(collapseArchiveMonths(archive, [])).toBe(archive);
  });

  it("merges a group's months at the position of its newest month", () => {
    expect(collapseArchiveMonths(archive, [mayJune])).toEqual([
      { year: 2026, month: 10, count: 1 },
      { year: 2026, month: 6, count: 28, label: "מאי–יוני" },
      { year: 2026, month: 4, count: 19 },
    ]);
  });

  it("files a group under its canonical month when only one month has posts", () => {
    const onlyMay: ArchiveMonth[] = [{ year: 2026, month: 5, count: 7 }];

    expect(collapseArchiveMonths(onlyMay, [mayJune])).toEqual([
      { year: 2026, month: 6, count: 7, label: "מאי–יוני" },
    ]);
  });
});

describe("parseHomeIssuePin", () => {
  it("reads a stored pin", () => {
    expect(parseHomeIssuePin('{"year":2026,"month":4}')).toEqual({
      year: 2026,
      month: 4,
    });
  });

  it("treats anything malformed as no pin", () => {
    expect(parseHomeIssuePin(null)).toBeNull();
    expect(parseHomeIssuePin("")).toBeNull();
    expect(parseHomeIssuePin("not json")).toBeNull();
    expect(parseHomeIssuePin("null")).toBeNull();
    expect(parseHomeIssuePin('{"year":2026,"month":13}')).toBeNull();
    expect(parseHomeIssuePin('{"year":2026}')).toBeNull();
  });
});

describe("chooseHomeIssue", () => {
  const issues = collapseArchiveMonths(archive, [mayJune]);

  it("skips a thin new issue for the newest one with enough posts", () => {
    // Production today: October has 1 post, May–June has 28.
    expect(chooseHomeIssue(null, issues)).toMatchObject({ year: 2026, month: 6 });
  });

  it("moves on once a new issue reaches the threshold", () => {
    const grown = [{ year: 2026, month: 11, count: 15 }, ...issues];
    expect(chooseHomeIssue(null, grown)).toMatchObject({ year: 2026, month: 11 });
  });

  it("falls back to the newest issue when none has enough posts", () => {
    const small = [
      { year: 2026, month: 2, count: 3 },
      { year: 2026, month: 1, count: 9 },
    ];
    expect(chooseHomeIssue(null, small)).toMatchObject({ year: 2026, month: 2 });
  });

  it("returns nothing when there are no issues", () => {
    expect(chooseHomeIssue(null, [])).toBeNull();
  });

  it("prefers a teacher's pin, even for a thin issue", () => {
    expect(chooseHomeIssue({ year: 2026, month: 10 }, issues)).toMatchObject({
      year: 2026,
      month: 10,
    });
  });

  it("resolves a pin on a merged member month to the merged issue", () => {
    expect(
      chooseHomeIssue({ year: 2026, month: 5 }, issues, [mayJune]),
    ).toMatchObject({ year: 2026, month: 6, count: 28 });
  });

  it("ignores a pin on an issue that no longer has posts", () => {
    expect(chooseHomeIssue({ year: 2020, month: 1 }, issues)).toMatchObject({
      year: 2026,
      month: 6,
    });
  });
});
