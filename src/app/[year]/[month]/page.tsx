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
import RevealFx from "@/components/ui/RevealFx";

// Static generation with ISR - pages are pre-built at build time
export const revalidate = 60;

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

  // Get posts for this month (cached for instant loading)
  const posts = await getCachedPostsByMonth(year, monthNumber);

  // Get Hebrew month name for display
  const hebrewMonth = englishToHebrewMonth(monthStr);

  return (
    <div className="container mx-auto px-4 py-12">
      <RevealFx translateY="4" delay={0}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            גיליון {hebrewMonth} {year}
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            {posts.length} {posts.length === 1 ? "כתבה" : "כתבות"}
          </p>
        </div>
      </RevealFx>

      {posts.length === 0 ? (
        <RevealFx translateY="6" delay={0.2}>
          <EmptyPostsState />
        </RevealFx>
      ) : (
        <RevealFx translateY="8" delay={0.2}>
          <PaginatedPosts initialPosts={posts} postsPerPage={12} />
        </RevealFx>
      )}
    </div>
  );
}
