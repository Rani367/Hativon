"use client";

import { useState } from "react";
import { Post } from "@/types/post.types";
import PostCard from "@/components/post-card";
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
  const [loading, setLoading] = useState(false);

  const visiblePosts = initialPosts.slice(0, displayCount);
  const hasMore = displayCount < initialPosts.length;

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + postsPerPage, initialPosts.length));
      setLoading(false);
    }, 300);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visiblePosts.map((post, index) => (
          <PostCard key={post.id} post={post} priority={index < 3} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <Button
            onClick={loadMore}
            disabled={loading}
            size="lg"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
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
