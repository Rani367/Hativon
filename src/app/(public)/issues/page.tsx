import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { getIssueLabel, getIssuePath, getIssues } from "@/lib/issues/issues";
import { shouldSkipPrerender } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = { title: copy.issue.issuesTitle };

export default async function IssuesPage() {
  const issues = shouldSkipPrerender() ? [] : await getIssues();

  const years = [...new Set(issues.map((issue) => issue.year))];

  return (
    <main id="main" className="archive">
      <h1 className="archive-title">{copy.issue.issuesTitle}</h1>

      {years.map((year) => (
        <section key={year} className="archive-year">
          <h2>
            <bdi>{year}</bdi>
          </h2>
          <ul>
            {issues
              .filter((issue) => issue.year === year)
              .map((issue) => (
                <li key={issue.month}>
                  <a href={getIssuePath(issue.year, issue.month)}>
                    <span>{getIssueLabel(issue)}</span>
                    <span>{copy.issue.articleCount(issue.count)}</span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
