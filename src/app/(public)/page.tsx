import { IssueView } from "@/components/public/issue-view";
import { copy } from "@/lib/copy";
import { getHomeIssue } from "@/lib/issues/issues";
import { shouldSkipPrerender } from "@/lib/site";

// Publishing refreshes this page straight away. The hour is only a safety net in
// case a refresh is ever lost.
export const revalidate = 3600;

export default async function HomePage() {
  const issue = shouldSkipPrerender() ? null : await getHomeIssue();

  if (!issue) {
    return (
      <main id="main" className="issue">
        <p className="issue-empty">{copy.issue.empty}</p>
      </main>
    );
  }

  return <IssueView issue={issue} />;
}
