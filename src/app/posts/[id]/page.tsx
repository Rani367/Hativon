import { Suspense, cache } from "react";
import { getPosts, getPost as getPostBase, getWordCount } from "@/lib/posts";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PostPageTransitionShell } from "@/components/features/posts/post-page-transition-shell";

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
  params: Promise<{ id: string }>;
}

// Static generation with publish-triggered revalidation.
export const revalidate = false;

// Allow newly published posts to render without a redeploy.
export const dynamicParams = true;

// Generate static params for all published posts
export async function generateStaticParams() {
  const posts = await getPosts(); // Only published posts
  return posts.map((post) => ({
    id: post.id,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

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
      canonical: `${siteUrl}/posts/${post.id}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${siteUrl}/posts/${post.id}`,
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
  const { id } = await params;
  const post = await getPost(id);

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
      "@id": `${siteUrl}/posts/${post.id}`,
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
      <PostPageTransitionShell post={post} wordCount={wordCount}>
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-4/6 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          }
        >
          <div className="prose max-w-none rounded-3xl border border-border/40 bg-card p-4 shadow-xs dark:prose-invert sm:prose-lg sm:rounded-[2.5rem] sm:p-12 lg:prose-xl">
            <PostContent content={post.content} />
          </div>
        </Suspense>
      </PostPageTransitionShell>
    </>
  );
}
