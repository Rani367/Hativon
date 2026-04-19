"use client";

import { useState, useTransition, useCallback, memo } from "react";
import { Post } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginatedPostsProps {
  initialPosts: Post[];
  postsPerPage?: number;
}

const MemoizedPostCard = memo(PostCard);
const PRIORITY_COUNT = 6;

function PaginatedPosts({
  initialPosts,
  postsPerPage = 12,
}: PaginatedPostsProps) {
  const [displayCount, setDisplayCount] = useState(postsPerPage);
  const [isPending, startTransition] = useTransition();

  const visiblePosts = initialPosts.slice(0, displayCount);
  const hasMore = displayCount < initialPosts.length;

  const loadMore = useCallback(() => {
    startTransition(() => {
      setDisplayCount((prev) =>
        Math.min(prev + postsPerPage, initialPosts.length),
      );
    });
  }, [postsPerPage, initialPosts.length]);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {visiblePosts.map((post, index) => (
          <MemoizedPostCard
            key={post.id}
            post={post}
            priority={index < PRIORITY_COUNT}
            uniformHeightBelowMd
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button onClick={loadMore} disabled={isPending} size="lg" variant="outline">
            {isPending ? (
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
