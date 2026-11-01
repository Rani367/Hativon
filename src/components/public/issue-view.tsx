import type { CSSProperties } from "react";
import { copy } from "@/lib/copy";
import type { Issue } from "@/lib/issues/issues";
import { getLabelWidth } from "@/lib/issues/label-width";
import { Story } from "./story";

// Enough to fill the first screen on any device.
const EAGER_PHOTOS = 3;

export function IssueView({ issue }: { issue: Issue }) {
  const [lead, ...rest] = issue.posts;

  return (
    <main id="main" className="issue">
      <header className="issue-header">
        <h1
          className="issue-month"
          style={{ "--label-width": getLabelWidth(issue.label) } as CSSProperties}
        >
          <span className="issue-month-mask">
            <span className="issue-month-text">{issue.label}</span>
          </span>
        </h1>
        <p className="issue-meta">
          <bdi>{issue.year}</bdi>
          <span>{copy.issue.articleCount(issue.posts.length)}</span>
          <a className="issue-print-link ink-link" href={`${issue.path}/print`}>
            {copy.print.link}
          </a>
        </p>
      </header>

      <Story post={lead} lead eager />

      <div className="issue-stories">
        {rest.map((post, index) => (
          <Story key={post.id} post={post} eager={index < EAGER_PHOTOS - 1} />
        ))}
      </div>
    </main>
  );
}
