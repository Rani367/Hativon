import type { PaginatedPostSummaries } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import PaginatedPosts from "@/components/features/posts/paginated-posts";

interface IssuePageProps {
  year: number;
  month: string;
  hebrewMonth: string | null;
  result: PaginatedPostSummaries;
}

export function IssuePage({
  year,
  month,
  hebrewMonth,
  result,
}: IssuePageProps) {
  return (
    <div className="mx-auto w-full py-2 sm:py-6">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          גיליון {hebrewMonth} {year}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {result.total} {result.total === 1 ? "כתבה" : "כתבות"}
        </p>
      </div>

      {result.total === 0 ? (
        <EmptyPostsState />
      ) : (
        <PaginatedPosts
          key={`${year}-${month}`}
          initialPosts={result.posts}
          initialHasMore={result.hasMore}
          postsPerPage={result.limit}
          year={year}
          month={month}
        />
      )}
    </div>
  );
}
