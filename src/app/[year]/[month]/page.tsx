import { notFound, permanentRedirect } from "next/navigation";
import {
  getCachedArchiveMonths,
  getCachedIssue,
} from "@/lib/posts/cached-queries";
import { resolveMergeGroup } from "@/lib/issues/merged-issues";
import {
  englishMonthToNumber,
  isValidYearMonth,
  monthNumberToEnglish,
} from "@/lib/date/months";
import { IssuePage } from "@/components/features/posts/issue-page";

// Static generation with publish-triggered revalidation.
export const revalidate = false;

// Allow dynamic rendering for months not pre-generated at build time
export const dynamicParams = true;

// Generate static params for all archive pages at build time. Archive months are
// already merge-collapsed, so only canonical months are pre-rendered; a merged
// member month (e.g. /2026/may) is handled dynamically and redirected below.
export async function generateStaticParams() {
  const archives = await getCachedArchiveMonths();
  return archives.map((archive) => ({
    year: String(archive.year),
    month: monthNumberToEnglish(archive.month) || "january",
  }));
}

interface ArchivePageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { year: yearStr, month: monthStr } = await params;

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  if (!isValidYearMonth(year, monthStr)) {
    notFound();
  }

  const monthNumber = englishMonthToNumber(monthStr);
  if (!monthNumber) {
    notFound();
  }

  // If this month is a member of a merged issue but not its canonical month,
  // redirect to the canonical combined issue (permanent — the merge is permanent).
  const group = await resolveMergeGroup(year, monthNumber);
  if (
    group &&
    (group.canonicalYear !== year || group.canonicalMonth !== monthNumber)
  ) {
    permanentRedirect(
      `/${group.canonicalYear}/${monthNumberToEnglish(group.canonicalMonth)}`,
    );
  }

  const issue = await getCachedIssue(year, monthNumber, {
    limit: 12,
    offset: 0,
  });

  return (
    <IssuePage
      year={issue.canonicalYear}
      month={issue.canonicalMonthEn}
      hebrewMonth={issue.hebrewLabel}
      result={issue.result}
    />
  );
}
