/**
 * Pure math for issues. An issue isn't a table: it's every published post whose
 * date falls in a calendar month, or in a span of months merged into a "double
 * issue". Merge groups live in the `settings` table.
 */

export const MERGED_ISSUES_SETTING_KEY = "merged_issues";
export const HOME_ISSUE_PIN_SETTING_KEY = "home_issue_pin";

/** The homepage moves to a new issue once it has this many published posts. */
export const HOME_ISSUE_MIN_POSTS = 15;

export interface ArchiveMonth {
  year: number;
  month: number; // 1-12
  count: number;
  /** Hebrew span of a merged issue, for example "מאי–יוני". */
  label?: string;
}

/** A contiguous span of months presented as one issue. */
export interface MergeGroup {
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number; // 1-12
  /** The month the merged issue lives under. */
  canonicalYear: number;
  canonicalMonth: number; // 1-12
  /** Hebrew span only. The year is added when displaying it. */
  label: string;
}

export interface MonthRef {
  year: number;
  month: number; // 1-12
}

export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function isValidMergeGroup(value: unknown): value is MergeGroup {
  if (!value || typeof value !== "object") return false;

  const group = value as Record<string, unknown>;
  const numericKeys = [
    "startYear",
    "startMonth",
    "endYear",
    "endMonth",
    "canonicalYear",
    "canonicalMonth",
  ];

  for (const key of numericKeys) {
    if (typeof group[key] !== "number" || !Number.isInteger(group[key])) {
      return false;
    }
  }

  if (typeof group.label !== "string" || group.label.length === 0) return false;

  return (
    monthIndex(group.startYear as number, group.startMonth as number) <=
    monthIndex(group.endYear as number, group.endMonth as number)
  );
}

/** Reads the raw setting. Bad JSON and invalid groups are dropped. */
export function parseMergeGroups(raw: string | null): MergeGroup[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidMergeGroup) : [];
  } catch {
    return [];
  }
}

export function findMergeGroup(
  groups: MergeGroup[],
  year: number,
  month: number,
): MergeGroup | null {
  const index = monthIndex(year, month);
  return (
    groups.find(
      (group) =>
        index >= monthIndex(group.startYear, group.startMonth) &&
        index <= monthIndex(group.endYear, group.endMonth),
    ) ?? null
  );
}

/**
 * Half-open bounds of a span of months, as timestamp strings rather than Dates:
 * posts.date has no time zone, so a Date could shift across a month boundary.
 */
export function monthRangeBounds(
  start: MonthRef,
  end: MonthRef,
): { startInclusive: string; endExclusive: string } {
  const nextYear = end.month === 12 ? end.year + 1 : end.year;
  const nextMonth = end.month === 12 ? 1 : end.month + 1;

  return {
    startInclusive: `${start.year}-${pad2(start.month)}-01 00:00:00`,
    endExclusive: `${nextYear}-${pad2(nextMonth)}-01 00:00:00`,
  };
}

/**
 * Collapses each merge group's months into one row with the summed count and
 * the span label, keeping the newest-first order of the input.
 */
export function collapseArchiveMonths(
  raw: ArchiveMonth[],
  groups: MergeGroup[],
): ArchiveMonth[] {
  if (groups.length === 0) return raw;

  const totals = new Map<MergeGroup, number>();
  for (const row of raw) {
    const group = findMergeGroup(groups, row.year, row.month);
    if (group) totals.set(group, (totals.get(group) ?? 0) + row.count);
  }

  const emitted = new Set<MergeGroup>();
  const result: ArchiveMonth[] = [];

  for (const row of raw) {
    const group = findMergeGroup(groups, row.year, row.month);

    if (!group) {
      result.push(row);
    } else if (!emitted.has(group)) {
      emitted.add(group);
      result.push({
        year: group.canonicalYear,
        month: group.canonicalMonth,
        count: totals.get(group) ?? row.count,
        label: group.label,
      });
    }
  }

  return result;
}

/** Reads the stored pin. Anything malformed counts as no pin. */
export function parseHomeIssuePin(raw: string | null): MonthRef | null {
  if (!raw) return null;

  try {
    const pin = JSON.parse(raw) as Partial<MonthRef> | null;
    return pin &&
      Number.isInteger(pin.year) &&
      Number.isInteger(pin.month) &&
      (pin.month as number) >= 1 &&
      (pin.month as number) <= 12
      ? { year: pin.year as number, month: pin.month as number }
      : null;
  } catch {
    return null;
  }
}

/**
 * Picks the homepage issue: a teacher's pin if it still exists, otherwise the
 * newest issue with enough posts, otherwise the newest issue of any size.
 *
 * It takes no clock and writes nothing, so the homepage only ever changes
 * because a post or a teacher changed something, and each of those revalidates
 * the page. `issues` must be collapsed and sorted newest first.
 */
export function chooseHomeIssue(
  pin: MonthRef | null,
  issues: ArchiveMonth[],
  groups: MergeGroup[] = [],
): ArchiveMonth | null {
  if (pin) {
    const group = findMergeGroup(groups, pin.year, pin.month);
    const target = group
      ? { year: group.canonicalYear, month: group.canonicalMonth }
      : pin;
    const pinned = issues.find(
      (issue) => issue.year === target.year && issue.month === target.month,
    );
    if (pinned) return pinned;
  }

  return (
    issues.find((issue) => issue.count >= HOME_ISSUE_MIN_POSTS) ??
    issues[0] ??
    null
  );
}
