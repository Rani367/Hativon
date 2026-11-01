import { copy } from "@/lib/copy";
import type { Issue } from "@/lib/issues/issues";
import { Story } from "./story";

// Enough to fill the first screen on any device.
const EAGER_PHOTOS = 3;

export function IssueView({ issue }: { issue: Issue }) {
  const [lead, ...rest] = issue.posts;

  return (
    <main id="main" className="issue">
      <header className="issue-header">
        <div>
          <h1 className="issue-title">
            <span className="issue-title-mask">
              <span className="issue-title-text">{issue.label}</span>
            </span>
          </h1>
          <p className="issue-meta">
            <bdi>{issue.year}</bdi>
            <span>{copy.issue.articleCount(issue.posts.length)}</span>
          </p>
        </div>
        <a className="pill issue-print-link" href={`${issue.path}/print`}>
          {copy.print.link}
        </a>
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
