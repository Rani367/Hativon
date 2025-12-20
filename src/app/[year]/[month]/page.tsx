import { Suspense } from "react";
import { notFound } from "next/navigation";
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

// Pre-render all archive pages at build time - return 404 for invalid months
export const dynamicParams = false;

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

// Async component that fetches and renders posts - streamable
async function PostsContent({
  year,
  monthNumber,
}: {
  year: number;
  monthNumber: number;
}) {
  const posts = await getCachedPostsByMonth(year, monthNumber);

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

  // Get post count for header (fast query, can run in parallel)
  const posts = await getCachedPostsByMonth(year, monthNumber);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center">
          גיליון {hebrewMonth} {year}
        </h1>
        <p className="text-center text-muted-foreground mt-2">
          {posts.length} {posts.length === 1 ? "כתבה" : "כתבות"}
        </p>
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent year={year} monthNumber={monthNumber} />
      </Suspense>
    </div>
  );
}
