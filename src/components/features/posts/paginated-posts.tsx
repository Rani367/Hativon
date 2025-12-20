"use client";

import { useState, useTransition, useCallback, memo } from "react";
import Masonry from "react-masonry-css";
import { Post } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginatedPostsProps {
  initialPosts: Post[];
  postsPerPage?: number;
}

// Memoize post card to prevent unnecessary re-renders
const MemoizedPostCard = memo(PostCard);

// Number of posts to prioritize (above-the-fold) - increased for faster LCP
const PRIORITY_COUNT = 6;

// Breakpoints for masonry columns (screen width -> number of columns)
const MASONRY_BREAKPOINTS = {
  default: 4, // 2xl and above
  1536: 4, // 2xl
  1280: 3, // xl
  1024: 3, // lg
  768: 2, // md
  640: 1, // sm and below
};

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
      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
        className="flex gap-6 md:gap-8 -ml-6 md:-ml-8"
        columnClassName="pl-6 md:pl-8 bg-clip-padding"
      >
        {visiblePosts.map((post, index) => (
          <div key={post.id} className="mb-6 md:mb-8">
            <MemoizedPostCard post={post} priority={index < PRIORITY_COUNT} />
          </div>
        ))}
      </Masonry>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <Button
            onClick={loadMore}
            disabled={isPending}
            size="lg"
            variant="outline"
          >
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
