import { notFound } from "next/navigation";
import {
  getCachedPostSummariesByMonth,
  getCachedArchiveMonths,
} from "@/lib/posts/cached-queries";
import {
  englishMonthToNumber,
  englishToHebrewMonth,
  isValidYearMonth,
  monthNumberToEnglish,
} from "@/lib/date/months";
import { IssuePage } from "@/components/features/posts/issue-page";

// Static generation with publish-triggered revalidation.
export const revalidate = false;

// Allow dynamic rendering for months not pre-generated at build time
export const dynamicParams = true;

// Generate static params for all archive pages at build time
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

  const hebrewMonth = englishToHebrewMonth(monthStr);
  const result = await getCachedPostSummariesByMonth(year, monthNumber, {
    limit: 12,
    offset: 0,
  });

  return (
    <IssuePage
      year={year}
      month={monthStr}
      hebrewMonth={hebrewMonth}
      result={result}
    />
  );
}
