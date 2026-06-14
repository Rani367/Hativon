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
import {
  MERGED_ISSUES_SETTING_KEY,
  findMergeGroup,
  rangeBoundsOf,
  collapseArchiveMonths,
  parseMergeGroups,
  type MergeGroup,
} from "./merge-core";

// Pure merge math now lives in `merge-core.ts` (a dependency-free leaf module,
// so `lib/settings.ts` can reuse it without an import cycle). Re-export the
// names callers already import from here so their import paths stay unchanged.
export {
  MERGED_ISSUES_SETTING_KEY,
  findMergeGroup,
  rangeBoundsOf,
  collapseArchiveMonths,
  type MergeGroup,
} from "./merge-core";

/**
 * Load and validate all configured merge groups. Returns [] when unset or the
 * database is unavailable (graceful no-merge fallback).
 */
export async function getMergeGroups(): Promise<MergeGroup[]> {
  try {
    return parseMergeGroups(await getSetting(MERGED_ISSUES_SETTING_KEY));
  } catch (error) {
    console.error("[MERGED-ISSUES] Failed to load merge groups:", error);
    return [];
  }
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
