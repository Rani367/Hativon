/**
 * Pure merge-group math for "double issue" support.
 *
 * This module holds only pure functions and types — it imports nothing at
 * runtime (the `ArchiveMonth` import is type-only and erased at compile time).
 * That keeps it a dependency-free leaf so both `lib/settings.ts` and
 * `lib/issues/merged-issues.ts` can depend on it without forming an import
 * cycle (merged-issues imports `getSetting` from settings).
 *
 * See `lib/issues/merged-issues.ts` for the DB-backed wrappers that load merge
 * groups from the `settings` table and resolve issues at query/render time.
 */

import type { ArchiveMonth } from "@/lib/posts/queries";

export const MERGED_ISSUES_SETTING_KEY = "merged_issues";

/**
 * A contiguous span of months presented as one combined issue.
 */
export interface MergeGroup {
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number; // 1-12
  /** Month the merged issue lives under (its canonical URL/month). */
  canonicalYear: number;
  canonicalMonth: number; // 1-12
  /** Hebrew month span only (year appended at render time), e.g. "מאי–יוני". */
  label: string;
}

/** Absolute month index for ordering/containment math. */
export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isValidMergeGroup(value: unknown): value is MergeGroup {
  if (!value || typeof value !== "object") return false;
  const g = value as Record<string, unknown>;
  const numericKeys = [
    "startYear",
    "startMonth",
    "endYear",
    "endMonth",
    "canonicalYear",
    "canonicalMonth",
  ] as const;
  for (const key of numericKeys) {
    if (typeof g[key] !== "number" || !Number.isInteger(g[key])) return false;
  }
  if (typeof g.label !== "string" || g.label.length === 0) return false;
  // start must not be after end
  return (
    monthIndex(g.startYear as number, g.startMonth as number) <=
    monthIndex(g.endYear as number, g.endMonth as number)
  );
}

/**
 * Pure: parse and validate the raw `merged_issues` setting value. Returns [] for
 * null/empty input, non-JSON, a non-array, and drops any invalid group entries.
 */
export function parseMergeGroups(raw: string | null): MergeGroup[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidMergeGroup);
  } catch {
    return [];
  }
}

/**
 * Pure: find the group whose contiguous range contains (year, month).
 */
export function findMergeGroup(
  groups: MergeGroup[],
  year: number,
  month: number,
): MergeGroup | null {
  const idx = monthIndex(year, month);
  return (
    groups.find(
      (g) =>
        idx >= monthIndex(g.startYear, g.startMonth) &&
        idx <= monthIndex(g.endYear, g.endMonth),
    ) ?? null
  );
}

/**
 * Pure: resolve (year, month) to the canonical (year, month) of the merge group
 * it belongs to, or the input unchanged when it is not part of any group.
 */
export function canonicalMonthOf(
  groups: MergeGroup[],
  year: number,
  month: number,
): { year: number; month: number } {
  const group = findMergeGroup(groups, year, month);
  if (!group) return { year, month };
  return { year: group.canonicalYear, month: group.canonicalMonth };
}

/**
 * Half-open timestamp-string bounds for a merge group's full range.
 * `endExclusive` is the first day of the month AFTER the range.
 */
export function rangeBoundsOf(group: MergeGroup): {
  startInclusive: string;
  endExclusive: string;
} {
  const startInclusive = `${group.startYear}-${pad2(group.startMonth)}-01 00:00:00`;
  const endYear = group.endMonth === 12 ? group.endYear + 1 : group.endYear;
  const endMonth = group.endMonth === 12 ? 1 : group.endMonth + 1;
  const endExclusive = `${endYear}-${pad2(endMonth)}-01 00:00:00`;
  return { startInclusive, endExclusive };
}

/**
 * Pure: collapse each merge group's member rows into a single canonical archive
 * row carrying the summed count and the Hebrew span label. Non-member rows pass
 * through unchanged. The merged row is emitted at the position of its first
 * (highest-index, i.e. latest) member so the year-DESC/month-DESC ordering of
 * the input is preserved.
 */
export function collapseArchiveMonths(
  raw: ArchiveMonth[],
  groups: MergeGroup[],
): ArchiveMonth[] {
  if (groups.length === 0) return raw;

  // Total post count per group across all present member rows.
  const totals = new Map<number, number>();
  for (const row of raw) {
    const gi = groups.findIndex(
      (g) =>
        monthIndex(row.year, row.month) >=
          monthIndex(g.startYear, g.startMonth) &&
        monthIndex(row.year, row.month) <= monthIndex(g.endYear, g.endMonth),
    );
    if (gi !== -1) {
      totals.set(gi, (totals.get(gi) ?? 0) + row.count);
    }
  }

  const emitted = new Set<number>();
  const result: ArchiveMonth[] = [];

  for (const row of raw) {
    const gi = groups.findIndex(
      (g) =>
        monthIndex(row.year, row.month) >=
          monthIndex(g.startYear, g.startMonth) &&
        monthIndex(row.year, row.month) <= monthIndex(g.endYear, g.endMonth),
    );

    if (gi === -1) {
      result.push(row);
      continue;
    }

    if (!emitted.has(gi)) {
      const g = groups[gi];
      result.push({
        year: g.canonicalYear,
        month: g.canonicalMonth,
        count: totals.get(gi) ?? row.count,
        label: g.label,
      });
      emitted.add(gi);
    }
    // Drop member rows (the canonical row above replaces them).
  }

  return result;
}

/**
 * Pure: decide which month the homepage should treat as its default/main issue.
 *
 * Merge-aware: a month that belongs to a merge group is evaluated as its whole
 * combined span (summed post count) and promoted under the group's canonical
 * month. With no groups this reduces exactly to the per-calendar-month behavior.
 *
 * Returns the chosen (year, month) plus `switched` — true only when the current
 * month's (merged) issue clears `minPosts` and differs from the stored default,
 * signalling the caller to persist the new default.
 */
export function resolveDefaultMonth(params: {
  storedDefault: { year: number; month: number }; // month 1-12
  current: { year: number; month: number }; // month 1-12
  archives: ArchiveMonth[]; // RAW per-calendar-month counts
  groups: MergeGroup[];
  minPosts: number;
}): { year: number; month: number; switched: boolean } {
  const { storedDefault, current, archives, groups, minPosts } = params;

  const storedCanonical = canonicalMonthOf(
    groups,
    storedDefault.year,
    storedDefault.month,
  );
  const currentCanonical = canonicalMonthOf(groups, current.year, current.month);

  // Stored default already represents the current (possibly merged) issue.
  if (
    storedCanonical.year === currentCanonical.year &&
    storedCanonical.month === currentCanonical.month
  ) {
    return { ...storedDefault, switched: false };
  }

  // Compare the current month's combined post count against the threshold.
  const collapsed = collapseArchiveMonths(archives, groups);
  const currentRow = collapsed.find(
    (a) => a.year === currentCanonical.year && a.month === currentCanonical.month,
  );

  if (currentRow && currentRow.count >= minPosts) {
    return { ...currentCanonical, switched: true };
  }

  return { ...storedDefault, switched: false };
}
