import {
  getCachedDefaultMonth,
  getCachedIssue,
} from "@/lib/posts/cached-queries";
import { englishMonthToNumber } from "@/lib/date/months";
import { IssuePage } from "@/components/features/posts/issue-page";

export const revalidate = false;

export default async function Home() {
  const { year, month } = await getCachedDefaultMonth();
  const monthNumber = englishMonthToNumber(month);

  if (!monthNumber) {
    return null;
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
