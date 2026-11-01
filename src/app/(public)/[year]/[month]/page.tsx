import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueView } from "@/components/public/issue-view";
import { copy } from "@/lib/copy";
import { englishMonthToNumber } from "@/lib/date/months";
import {
  type Issue,
  getIssue,
  getIssuePath,
  getIssues,
} from "@/lib/issues/issues";
import { getSiteUrl, shouldSkipPrerender } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

interface IssuePageProps {
  params: Promise<{ year: string; month: string }>;
}

export async function generateStaticParams() {
  if (shouldSkipPrerender()) return [];

  const issues = await getIssues();
  return issues.map(({ year, month }) => {
    const [, yearPart, monthPart] = getIssuePath(year, month).split("/");
    return { year: yearPart, month: monthPart };
  });
}

async function loadIssue({ year, month }: Awaited<IssuePageProps["params"]>) {
  const monthNumber = englishMonthToNumber(month);
  if (!/^\d{4}$/.test(year) || !monthNumber) return null;
  return getIssue(Number(year), monthNumber);
}

export async function generateMetadata({
  params,
}: IssuePageProps): Promise<Metadata> {
  const issue = await loadIssue(await params);
  if (!issue) return { title: copy.errors.notFoundTitle };

  return {
    title: `גיליון ${issue.label} ${issue.year}`,
    // /2026/may and /2026/june show the same merged issue. This names the main one.
    alternates: { canonical: `${getSiteUrl()}${issue.path}` },
  };
}

export default async function IssuePage({ params }: IssuePageProps) {
  const issue: Issue | null = await loadIssue(await params);

  // Only reached after a successful query, so an outage can't become a 404.
  if (!issue) notFound();

  return <IssueView issue={issue} />;
}
