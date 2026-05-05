"use client";

import { useCallback, memo, useState, useTransition } from "react";
import type { PostSummary } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { logError } from "@/lib/logger";

interface PaginatedPostsProps {
  initialPosts: PostSummary[];
  initialHasMore: boolean;
  postsPerPage?: number;
  year: number;
  month: string;
}

const MemoizedPostCard = memo(PostCard);
const PRIORITY_COUNT = 1;

function PaginatedPosts({
  initialPosts,
  initialHasMore,
  postsPerPage = 12,
  year,
  month,
}: PaginatedPostsProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadMore = useCallback(async () => {
    if (isLoadingMore) {
      return;
    }

    setError(null);
    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        year: String(year),
        month,
        limit: String(postsPerPage),
        offset: String(posts.length),
      });
      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load posts");
      }

      const result = (await response.json()) as {
        posts: PostSummary[];
        hasMore: boolean;
      };

      startTransition(() => {
        setPosts((currentPosts) => [...currentPosts, ...result.posts]);
        setHasMore(result.hasMore);
      });
    } catch (loadError) {
      logError("Failed to load more posts:", loadError);
      setError("טעינת כתבות נוספות נכשלה");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, month, posts.length, postsPerPage, year]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {posts.map((post, index) => (
          <MemoizedPostCard
            key={post.id}
            post={post}
            priority={index < PRIORITY_COUNT}
            uniformHeightBelowMd
          />
        ))}
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-destructive">{error}</p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center sm:mt-12">
          <Button
            onClick={loadMore}
            disabled={isPending || isLoadingMore}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isPending || isLoadingMore ? (
              <>
                <Loader2 className="me-2 animate-spin" />
                טוען...
              </>
            ) : (
              "טען עוד כתבות"
            )}
          </Button>
        </div>
      )}
    </>
  );
}

export default memo(PaginatedPosts);
