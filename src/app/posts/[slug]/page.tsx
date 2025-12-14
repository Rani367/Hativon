import { getPosts, getPost, getWordCount } from "@/lib/posts";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime } from "@/lib/utils";
import { components } from "@/components/features/posts/mdx-component";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Enable ISR with 5 minute revalidation for instant loading
export const revalidate = 300;

// Add cache control headers
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
          <div className="relative aspect-video w-full mb-10 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIvPg=="
            />
          </div>
        )}

        <header className="mb-10">
          <div className="flex items-center gap-4 text-base text-muted-foreground mb-6">
            <time>
              {format(new Date(post.date), "d בMMMM yyyy", { locale: he })}
            </time>
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

        <div className="max-w-none">
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </>
  );
}
