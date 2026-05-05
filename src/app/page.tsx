import {
  getCachedDefaultMonth,
  getCachedPostSummariesByMonth,
} from "@/lib/posts/cached-queries";
import {
  englishMonthToNumber,
  englishToHebrewMonth,
} from "@/lib/date/months";
import { IssuePage } from "@/components/features/posts/issue-page";

export const revalidate = false;

export default async function Home() {
  const { year, month } = await getCachedDefaultMonth();
  const monthNumber = englishMonthToNumber(month);

  if (!monthNumber) {
    return null;
  }

  const result = await getCachedPostSummariesByMonth(year, monthNumber, {
    limit: 12,
    offset: 0,
  });

  return (
    <IssuePage
      year={year}
      month={month}
      hebrewMonth={englishToHebrewMonth(month)}
      result={result}
    />
  );
}
