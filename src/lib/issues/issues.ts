import { cache } from "react";
import { monthNumberToEnglish, monthNumberToHebrew } from "@/lib/date/months";
import {
  getArchiveMonths,
  getPublishedArticlesInRange,
  getPublishedPostsInRange,
} from "@/lib/posts/queries";
import type { Post, PostSummary } from "@/lib/posts/types";
import { getSetting } from "@/lib/settings";
import {
  type ArchiveMonth,
  HOME_ISSUE_PIN_SETTING_KEY,
  MERGED_ISSUES_SETTING_KEY,
  type MergeGroup,
  chooseHomeIssue,
  collapseArchiveMonths,
  findMergeGroup,
  monthRangeBounds,
  parseHomeIssuePin,
  parseMergeGroups,
} from "./merge-core";

export interface Issue {
  year: number;
  month: number;
  /** Where this issue lives. Member months of a merge point here too. */
  path: string;
  /** Hebrew month or span without the year, for example "מאי–יוני". */
  label: string;
  posts: PostSummary[];
}

export function getIssuePath(year: number, month: number): string {
  return `/${year}/${monthNumberToEnglish(month)}`;
}

export function getIssueLabel(issue: ArchiveMonth): string {
  return issue.label ?? monthNumberToHebrew(issue.month) ?? "";
}

export const getMergeGroups = cache(async (): Promise<MergeGroup[]> => {
  return parseMergeGroups(await getSetting(MERGED_ISSUES_SETTING_KEY));
});

/** Every issue that has posts, newest first, with merged months collapsed. */
export const getIssues = cache(async (): Promise<ArchiveMonth[]> => {
  const [months, groups] = await Promise.all([
    getArchiveMonths(),
    getMergeGroups(),
  ]);
  return collapseArchiveMonths(months, groups);
});

/**
 * The issue containing a month, or null if it has no posts. A member month of a
 * merge returns the whole merged issue, so /2026/may and /2026/june show the
 * same thing and the page points search engines at the canonical address.
 *
 * Member months deliberately don't redirect: a redirect from a prerendered page
 * reaches browsers with a doubled Location header on Vercel, and answering here
 * also stays correct if the months are unmerged later.
 */
export async function getIssue(
  year: number,
  month: number,
): Promise<Issue | null> {
  const span = await getIssueSpan(year, month);
  const posts = await getPublishedPostsInRange(
    span.startInclusive,
    span.endExclusive,
  );

  return posts.length > 0 ? { ...span.issue, posts } : null;
}

/** The same issue with each article's full text, for printing. */
export async function getIssueWithArticles(
  year: number,
  month: number,
): Promise<(Omit<Issue, "posts"> & { articles: Post[] }) | null> {
  const span = await getIssueSpan(year, month);
  const articles = await getPublishedArticlesInRange(
    span.startInclusive,
    span.endExclusive,
  );

  return articles.length > 0 ? { ...span.issue, articles } : null;
}

async function getIssueSpan(year: number, month: number) {
  const group = findMergeGroup(await getMergeGroups(), year, month);

  const start = group
    ? { year: group.startYear, month: group.startMonth }
    : { year, month };
  const end = group
    ? { year: group.endYear, month: group.endMonth }
    : { year, month };
  const canonical = group
    ? { year: group.canonicalYear, month: group.canonicalMonth }
    : { year, month };

  return {
    ...monthRangeBounds(start, end),
    issue: {
      ...canonical,
      path: getIssuePath(canonical.year, canonical.month),
      label: group?.label ?? monthNumberToHebrew(month) ?? "",
    },
  };
}

/** The issue the homepage shows, or null if nothing is published yet. */
export async function getHomeIssue(): Promise<Issue | null> {
  const [issues, groups, rawPin] = await Promise.all([
    getIssues(),
    getMergeGroups(),
    getSetting(HOME_ISSUE_PIN_SETTING_KEY),
  ]);

  const chosen = chooseHomeIssue(parseHomeIssuePin(rawPin), issues, groups);
  return chosen ? getIssue(chosen.year, chosen.month) : null;
}
