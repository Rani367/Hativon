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
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import PostCard from "@/components/features/posts/post-card";

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
function PostsContent({
  posts,
  showEmptyState = true,
}: {
  posts: Post[];
  showEmptyState?: boolean;
}) {
  if (posts.length === 0) {
    return showEmptyState ? <EmptyPostsState /> : null;
  }

  return <PaginatedPosts initialPosts={posts} postsPerPage={12} />;
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
  const primaryFeaturedPosts = posts.slice(0, 2);
  const stackedFeaturedPost = posts[2] ?? null;
  const featuredPostsCount =
    primaryFeaturedPosts.length + (stackedFeaturedPost ? 1 : 0);
  const remainingPosts = posts.slice(featuredPostsCount);
  const postsSummary =
    posts.length === 0
      ? "עדיין לא פורסמו כתבות בגיליון הזה."
      : posts.length === 1
        ? "כתבה אחת מחכה לכם בגיליון הזה."
        : `${posts.length} כתבות בגיליון הזה.`;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex w-full flex-col gap-6 lg:max-w-[28rem] lg:shrink-0 xl:max-w-[30rem]">
          <div className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-amber-50 via-background to-sky-50 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
            <div className="space-y-4">
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
          </div>

          {stackedFeaturedPost && (
            <PostCard post={stackedFeaturedPost} />
          )}
        </div>

        {primaryFeaturedPosts.length > 0 && (
          <div className="grid flex-1 gap-6 md:grid-cols-2">
            {primaryFeaturedPosts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index === 0} />
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent
          posts={remainingPosts}
          showEmptyState={posts.length === 0}
        />
      </Suspense>
    </div>
  );
}
