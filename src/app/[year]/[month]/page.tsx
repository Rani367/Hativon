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
  const featuredCount = Math.min(posts.length, 3);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-10 overflow-hidden rounded-[2rem] border bg-gradient-to-br from-amber-50 via-background to-sky-50 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground">
              גיליון חודשי לתלמידים ולמורים
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                גיליון {hebrewMonth} {year}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                מקום אחד לכל הכתבות, הדעות והסיפורים של קהילת חטיבון. התחילו
                מהכתבות החדשות או גללו כדי למצוא משהו שמעניין אתכם.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[22rem]">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">בגיליון הזה</p>
              <p className="mt-1 text-3xl font-black">{posts.length}</p>
              <p className="text-sm text-muted-foreground">
                {posts.length === 1 ? "כתבה אחת" : "כתבות לקריאה"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">מומלץ להתחיל עם</p>
              <p className="mt-1 text-3xl font-black">{featuredCount}</p>
              <p className="text-sm text-muted-foreground">
                כתבות ראשונות בראש העמוד
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent posts={posts} />
      </Suspense>
    </div>
  );
}
