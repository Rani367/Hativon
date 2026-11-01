import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/public/article-body";
import { Byline, PostLabels } from "@/components/public/byline";
import { PrintButton } from "@/components/public/print-button";
import { copy } from "@/lib/copy";
import { formatHebrewDate } from "@/lib/date/format";
import { englishMonthToNumber } from "@/lib/date/months";
import { getIssueWithArticles } from "@/lib/issues/issues";
import { isOpeningOfArticle } from "@/lib/posts/reading";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import "./print.css";

export const revalidate = 3600;
export const dynamicParams = true;

interface PrintPageProps {
  params: Promise<{ year: string; month: string }>;
}

// Printed issues are made on demand: nothing links here but the issue itself, so
// prerendering every one would only slow the build.
export function generateStaticParams() {
  return [];
}

async function loadIssue({ year, month }: Awaited<PrintPageProps["params"]>) {
  const monthNumber = englishMonthToNumber(month);
  if (!/^\d{4}$/.test(year) || !monthNumber) return null;
  return getIssueWithArticles(Number(year), monthNumber);
}

export async function generateMetadata({
  params,
}: PrintPageProps): Promise<Metadata> {
  const issue = await loadIssue(await params);
  if (!issue) return { title: copy.errors.notFoundTitle };

  return {
    title: copy.print.title(issue.label, issue.year),
    // The same articles as the issue, so it shouldn't compete with it in search.
    robots: { index: false },
    alternates: { canonical: `${getSiteUrl()}${issue.path}` },
  };
}

export default async function PrintPage({ params }: PrintPageProps) {
  const issue = await loadIssue(await params);

  // Only reached after a successful query, so an outage can't become a 404.
  if (!issue) notFound();

  return (
    <main id="main" className="print-issue">
      <div className="print-toolbar">
        <PrintButton />
        <a className="pill" href={issue.path}>
          {copy.article.backToIssue(issue.label)}
        </a>
      </div>

      <section className="print-cover">
        <p className="print-name">{SITE_NAME}</p>
        <h1 className="print-month">{issue.label}</h1>
        <p className="print-edition">
          <bdi>{issue.year}</bdi>
          <span>{copy.issue.articleCount(issue.articles.length)}</span>
        </p>

        <ol className="print-contents">
          {issue.articles.map((article) => (
            <li key={article.id}>
              <a href={`#${article.id}`}>{article.title}</a>
              {article.author ? <span>{article.author}</span> : null}
            </li>
          ))}
        </ol>
      </section>

      {issue.articles.map((article) => (
        <article key={article.id} id={article.id} className="print-article">
          <header>
            <h2 className="print-title">{article.title}</h2>
            {isOpeningOfArticle(article.description, article.content) ? null : (
              <p className="print-description">{article.description}</p>
            )}
            <p className="print-meta">
              <Byline post={article} />
              <time dateTime={article.date}>
                {formatHebrewDate(article.date)}
              </time>
              <PostLabels post={article} />
            </p>
          </header>

          {article.coverImage ? (
            <img
              className="print-photo"
              src={article.coverImage}
              alt={article.title}
            />
          ) : null}

          <ArticleBody content={article.content} imageLoading="eager" />
        </article>
      ))}
    </main>
  );
}
