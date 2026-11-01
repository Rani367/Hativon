import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/public/article-body";
import { Byline, PostLabels } from "@/components/public/byline";
import { ReadBeacon } from "@/components/public/read-beacon";
import { copy } from "@/lib/copy";
import { formatHebrewDate } from "@/lib/date/format";
import { getPostCardImageUrl } from "@/lib/images/post-images";
import {
  getReadingMinutes,
  getWordCount,
  isOpeningOfArticle,
} from "@/lib/posts/reading";
import { getPublishedPost, getPublishedPostStamps } from "@/lib/posts/queries";
import { SITE_NAME, getSiteUrl, shouldSkipPrerender } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

// For sharing an article that has no cover photo.
const DEFAULT_SHARE_IMAGE = "/opengraph-image.png";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  if (shouldSkipPrerender()) return [];

  const posts = await getPublishedPostStamps();
  return posts.map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublishedPost(decodeURIComponent(id));

  if (!post) return { title: copy.errors.articleNotFound };

  const url = `${getSiteUrl()}/posts/${post.id}`;
  const images = [
    { url: post.coverImage ?? DEFAULT_SHARE_IMAGE, alt: post.title },
  ];

  return {
    title: post.title,
    description: post.description,
    // Also what an old title-based link points search engines to.
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const post = await getPublishedPost(decodeURIComponent(id));

  // Only reached after a successful query, so an outage can't become a 404.
  if (!post) notFound();

  const wordCount = getWordCount(post.content);
  const siteUrl = getSiteUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    image: post.coverImage ?? `${siteUrl}${DEFAULT_SHARE_IMAGE}`,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author ?? copy.article.guestAuthor,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon-512.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/posts/${post.id}`,
    },
  };

  return (
    <main id="main" className="article">
      <script
        type="application/ld+json"
        // "<" is escaped so a title can't close this script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {post.coverImage ? (
        <div className="article-hero">
          {/* The card is already cached from the issue page, so the photo morph
              lands on a loaded image. The full photo fades in on top. */}
          <img
            className="article-hero-card"
            src={getPostCardImageUrl(post.coverImage)}
            alt=""
            width={768}
            height={576}
          />
          <img
            className="article-hero-full"
            src={post.coverImage}
            alt={post.title}
            decoding="async"
          />
        </div>
      ) : null}

      <header className="article-header">
        <h1 className="article-title">{post.title}</h1>
        {isOpeningOfArticle(post.description, post.content) ? null : (
          <p className="article-description">{post.description}</p>
        )}
        <p className="article-meta">
          <Byline post={post} />
          <time dateTime={post.date}>{formatHebrewDate(post.date)}</time>
          <span>{copy.article.readingTime(getReadingMinutes(wordCount))}</span>
          <span>{copy.article.wordCount(wordCount)}</span>
          <PostLabels post={post} />
        </p>
        {post.category || post.tags.length > 0 ? (
          <p className="article-tags">
            {post.category ? <span>{post.category}</span> : null}
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        ) : null}
      </header>

      <ArticleBody content={post.content} />
      <ReadBeacon postId={post.id} />
    </main>
  );
}
