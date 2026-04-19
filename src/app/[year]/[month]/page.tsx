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

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 items-start md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card/50 animate-pulse">
          <div className="aspect-[5/4] rounded-t-lg bg-muted sm:aspect-[4/3]" />
          <div className="space-y-3 p-6 sm:p-7">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-6 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PostsContent({
  posts,
}: {
  posts: Post[];
}) {
  if (posts.length === 0) {
    return <EmptyPostsState />;
  }

  return <PaginatedPosts initialPosts={posts} postsPerPage={12} />;
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { year: yearStr, month: monthStr } = await params;

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  if (!isValidYearMonth(year, monthStr)) {
    notFound();
  }

  const monthNumber = englishMonthToNumber(monthStr);
  if (!monthNumber) {
    notFound();
  }

  const hebrewMonth = englishToHebrewMonth(monthStr);
  const posts = await getCachedPostsByMonth(year, monthNumber);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">
          גיליון {hebrewMonth} {year}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {posts.length} {posts.length === 1 ? "כתבה" : "כתבות"}
        </p>
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent posts={posts} />
      </Suspense>
    </div>
  );
}
