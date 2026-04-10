import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Post } from "@/types/post.types";
import {
  getCachedPostsByMonth,
  getCachedArchiveMonths,
} from "@/lib/posts/cached-queries";
import {
  englishMonthToNumber,
  englishToHebrewMonth,
  isValidYearMonth,
  monthNumberToEnglish,
} from "@/lib/date/months";
import { formatHebrewDate } from "@/lib/date/format";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import PaginatedPosts from "@/components/features/posts/paginated-posts";

// Static generation with ISR - pages are pre-built at build time
export const revalidate = 60;

// Allow dynamic rendering for months not pre-generated at build time
export const dynamicParams = true;

// Generate static params for all archive pages at build time
export async function generateStaticParams() {
  const archives = await getCachedArchiveMonths();
  return archives.map((archive) => ({
    year: String(archive.year),
    month: monthNumberToEnglish(archive.month) || "january",
  }));
}

interface ArchivePageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

// Loading skeleton for posts - instant display while streaming
function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 items-start">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card/50 animate-pulse">
          <div className="aspect-[4/3] bg-muted rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Component that renders posts - receives pre-fetched data
function PostsContent({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <EmptyPostsState />;
  }

  return <PaginatedPosts initialPosts={posts} postsPerPage={12} />;
}

function ArchiveHighlightCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group flex h-full flex-col justify-between rounded-[1.5rem] border bg-background/85 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg supports-[backdrop-filter]:bg-background/80"
    >
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          {formatHebrewDate(post.date)}
        </p>
        <h2 className="line-clamp-2 text-lg font-bold leading-7 text-foreground transition-colors group-hover:text-amber-700">
          {post.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {post.description}
        </p>
      </div>
      <p className="mt-4 text-sm font-medium text-foreground/80">
        {post.author ? `מאת ${post.author}` : "מערכת חטיבון"}
      </p>
    </Link>
  );
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { year: yearStr, month: monthStr } = await params;

  // Validate year
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  // Validate and convert month
  if (!isValidYearMonth(year, monthStr)) {
    notFound();
  }

  const monthNumber = englishMonthToNumber(monthStr);
  if (!monthNumber) {
    notFound();
  }

  // Get Hebrew month name for display - instant, no async
  const hebrewMonth = englishToHebrewMonth(monthStr);

  // Fetch posts once for both header count and content display
  const posts = await getCachedPostsByMonth(year, monthNumber);
  const highlightedPosts = posts.slice(0, 2);
  const postsSummary =
    posts.length === 0
      ? "עדיין לא פורסמו כתבות בגיליון הזה."
      : posts.length === 1
        ? "כתבה אחת מחכה לכם בגיליון הזה."
        : `${posts.length} כתבות בגיליון הזה.`;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mx-auto mb-10 max-w-6xl overflow-hidden rounded-[2rem] border bg-gradient-to-br from-amber-50 via-background to-sky-50 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:gap-8">
          <div className="space-y-4 lg:max-w-[32rem]">
            <div className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground">
              גיליון חודשי לתלמידים ולמורים
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                גיליון {hebrewMonth} {year}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {postsSummary}
              </p>
            </div>
          </div>

          {highlightedPosts.length > 0 && (
            <div className="hidden lg:block">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                לקריאה מהירה מהגיליון
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                {highlightedPosts.map((post) => (
                  <ArchiveHighlightCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent posts={posts} />
      </Suspense>
    </div>
  );
}
