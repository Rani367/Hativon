import { Suspense, cache } from "react";
import { getPosts, getPost as getPostBase, getWordCount } from "@/lib/posts";
import { formatHebrewDate } from "@/lib/date/format";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime } from "@/lib/utils";

// Request-level cache for getPost - dedupes calls in generateMetadata and page component
const getPost = cache(getPostBase);

// Async component for rendering markdown content - streamable
async function PostContent({ content }: { content: string }) {
  const [remarkGfmPlugin, rehypeSanitizePlugin, mdxComponents] =
    await Promise.all([
      import("remark-gfm").then((mod) => mod.default),
      import("rehype-sanitize").then((mod) => mod.default),
      import("@/components/features/posts/mdx-component").then(
        (mod) => mod.components,
      ),
    ]);

  const ReactMarkdownComponent = (await import("react-markdown")).default;

  return (
    <div className="max-w-none">
      <ReactMarkdownComponent
        components={mdxComponents}
        remarkPlugins={[remarkGfmPlugin]}
        rehypePlugins={[rehypeSanitizePlugin]}
      >
        {content}
      </ReactMarkdownComponent>
    </div>
  );
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Enable ISR with 5 minute revalidation for instant loading
export const revalidate = 300;

// Pre-render all posts at build time - return 404 for unknown slugs
export const dynamicParams = false;

// Generate static params for all published posts
export async function generateStaticParams() {
  const posts = await getPosts(); // Only published posts
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  // Decode URL-encoded slug (handles Hebrew characters)
  const slug = decodeURIComponent(rawSlug);
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "הכתבה לא נמצאה",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/posts/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${siteUrl}/posts/${post.slug}`,
      publishedTime: new Date(post.date).toISOString(),
      authors: post.author ? [post.author] : [],
      tags: post.tags,
      images: [
        {
          url: post.coverImage || `${siteUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.coverImage || `${siteUrl}/opengraph-image.png`,
          alt: post.title,
        },
      ],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug: rawSlug } = await params;
  // Decode URL-encoded slug (handles Hebrew characters)
  const slug = decodeURIComponent(rawSlug);
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const wordCount = post.content ? getWordCount(post.content) : 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    image: post.coverImage || `${siteUrl}/opengraph-image.png`,
    datePublished: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author || "כותב אורח",
    },
    publisher: {
      "@type": "Organization",
      name: "חטיבון",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/posts/${post.slug}`,
    },
  };

  // Escape </script> sequences in JSON-LD to prevent script breakout attacks
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <article className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
        {post.coverImage && (
          <div className="relative w-full mb-10 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
              loading="eager"
              fetchPriority="high"
              quality={75}
              sizes="(max-width: 768px) 100vw, 896px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
            />
          </div>
        )}

        <header className="mb-10">
          <div className="flex items-center gap-4 text-base text-muted-foreground mb-6">
            <time>{formatHebrewDate(post.date)}</time>
            {post.author && (
              <span>
                מאת {post.author}
                {post.authorDeleted && (
                  <span className="text-muted-foreground"> (נמחק)</span>
                )}
                {post.authorGrade &&
                  post.authorClass &&
                  ` (כיתה ${post.authorGrade}${post.authorClass})`}
              </span>
            )}
            <span>{calculateReadingTime(wordCount)}</span>
            <span>{wordCount} מילים</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex gap-3 mb-4 flex-wrap">
            {post.isTeacherPost && (
              <Badge
                variant="default"
                className="bg-amber-500 text-white text-base px-4 py-1.5"
              >
                פוסט של מורה
              </Badge>
            )}
            {post.category && (
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {post.category}
              </Badge>
            )}
            {post.tags &&
              post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-base px-4 py-1.5"
                >
                  {tag}
                </Badge>
              ))}
          </div>
        </header>

        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          }
        >
          <PostContent content={post.content} />
        </Suspense>
      </article>
    </>
  );
}
