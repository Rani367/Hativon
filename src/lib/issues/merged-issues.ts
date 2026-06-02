/**
 * Merged "double issue" support.
 *
 * The app has no issue entity — an issue is "all published posts in a calendar
 * month" (see lib/posts/queries.ts). To present several consecutive months as a
 * single combined gilayon (e.g. "גיליון מאי–יוני 2026") without moving any post,
 * we store a small list of merge groups in the `settings` table (key
 * `merged_issues`) and resolve them at query/render time.
 *
 * A merge group is a CONTIGUOUS month range, so it maps to a single half-open
 * date-range query (`date >= start AND date < endExclusive`).
 */

import { getSetting } from "@/lib/settings";
import {
  getArchiveMonths,
  getPostSummariesByMonth,
  getPostSummariesByDateRange,
  type ArchiveMonth,
  type PaginatedPostSummaries,
  type PaginationOptions,
} from "@/lib/posts/queries";
import { monthNumberToEnglish, monthNumberToHebrew } from "@/lib/date/months";

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
function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isValidMergeGroup(value: unknown): value is MergeGroup {
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
 * Load and validate all configured merge groups. Returns [] when unset or the
 * database is unavailable (graceful no-merge fallback).
 */
export async function getMergeGroups(): Promise<MergeGroup[]> {
  try {
    const raw = await getSetting(MERGED_ISSUES_SETTING_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidMergeGroup);
  } catch (error) {
    console.error("[MERGED-ISSUES] Failed to load merge groups:", error);
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
 * Resolve (year, month) to the merge group it belongs to, or null. Does NOT
 * perform any redirect logic — callers decide what to do with the result.
 */
export async function resolveMergeGroup(
  year: number,
  month: number,
): Promise<MergeGroup | null> {
  const groups = await getMergeGroups();
  return findMergeGroup(groups, year, month);
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
 * Archive months with merge groups collapsed into single combined entries.
 */
export async function getMergedArchiveMonths(): Promise<ArchiveMonth[]> {
  const [raw, groups] = await Promise.all([getArchiveMonths(), getMergeGroups()]);
  return collapseArchiveMonths(raw, groups);
}

/**
 * Resolved issue: the canonical month it lives under, its Hebrew label (a month
 * span for merged issues, a single month otherwise), and the paginated posts.
 */
export interface ResolvedIssue {
  canonicalYear: number;
  canonicalMonth: number;
  canonicalMonthEn: string;
  /** Hebrew label (span for merged, single month otherwise); year added at render. */
  hebrewLabel: string;
  isMerged: boolean;
  result: PaginatedPostSummaries;
}

/**
 * Resolve a requested (year, month) into a renderable issue. Merged months are
 * served from the full combined range; everything else behaves exactly as the
 * plain per-month query.
 */
export async function getIssue(
  year: number,
  month: number,
  pagination: PaginationOptions = {},
): Promise<ResolvedIssue> {
  const group = await resolveMergeGroup(year, month);

  if (group) {
    const { startInclusive, endExclusive } = rangeBoundsOf(group);
    const result = await getPostSummariesByDateRange(
      startInclusive,
      endExclusive,
      pagination,
    );
    return {
      canonicalYear: group.canonicalYear,
      canonicalMonth: group.canonicalMonth,
      canonicalMonthEn: monthNumberToEnglish(group.canonicalMonth) ?? "",
      hebrewLabel: group.label,
      isMerged: true,
      result,
    };
  }

  const result = await getPostSummariesByMonth(year, month, pagination);
  return {
    canonicalYear: year,
    canonicalMonth: month,
    canonicalMonthEn: monthNumberToEnglish(month) ?? "",
    hebrewLabel: monthNumberToHebrew(month) ?? "",
    isMerged: false,
    result,
  };
}
