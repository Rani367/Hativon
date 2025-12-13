"use client";

import { useState, useTransition } from "react";
import { Post } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginatedPostsProps {
  initialPosts: Post[];
  postsPerPage?: number;
}

export default function PaginatedPosts({
  initialPosts,
  postsPerPage = 12,
}: PaginatedPostsProps) {
  const [displayCount, setDisplayCount] = useState(postsPerPage);
  const [isPending, startTransition] = useTransition();

  const visiblePosts = initialPosts.slice(0, displayCount);
  const hasMore = displayCount < initialPosts.length;

  const loadMore = () => {
    startTransition(() => {
      setDisplayCount((prev) =>
        Math.min(prev + postsPerPage, initialPosts.length),
      );
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
        {visiblePosts.map((post, index) => (
          <PostCard key={post.id} post={post} priority={index < 3} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12 animate-fade-in">
          <Button
            onClick={loadMore}
            disabled={isPending}
            size="lg"
            variant="outline"
            className="transition-transform hover:scale-105 active:scale-95"
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
