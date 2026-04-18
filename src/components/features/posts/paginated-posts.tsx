"use client";

import { memo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createLayout } from "animejs";
import { Post } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  canUseDomAnimation,
  createMountTimeline,
  motionTokens,
  useAnimeScope,
  useReducedMotionPreference,
} from "@/lib/anime/motion";

interface PaginatedPostsProps {
  initialPosts: Post[];
  postsPerPage?: number;
}

// Memoize post card to prevent unnecessary re-renders
const MemoizedPostCard = memo(PostCard);

// Number of posts to prioritize (above-the-fold) - increased for faster LCP
const PRIORITY_COUNT = 6;

function PaginatedPosts({
  initialPosts,
  postsPerPage = 12,
}: PaginatedPostsProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
  const [displayCount, setDisplayCount] = useState(postsPerPage);
  const [isAnimatingMore, setIsAnimatingMore] = useState(false);
  const prefersReducedMotion = useReducedMotionPreference();

  const visiblePosts = initialPosts.slice(0, displayCount);
  const hasMore = displayCount < initialPosts.length;

  useAnimeScope(
    gridRef,
    ({ root }) => {
      if (!canUseDomAnimation()) {
        return;
      }

      layoutRef.current = createLayout(root, {
        duration: 760,
        ease: motionTokens.ease.entrance,
        children: "[data-post-card-grid-item]",
        enterFrom: {
          opacity: 0,
          scale: 0.96,
          y: 30,
        },
      });

      createMountTimeline(root, "[data-post-card-grid-item]", {
        staggerDelay: motionTokens.stagger.tight,
        y: 30,
      });

      return () => {
        layoutRef.current = null;
      };
    },
    [],
  );

  const loadMore = () => {
    const nextCount = Math.min(displayCount + postsPerPage, initialPosts.length);

    if (prefersReducedMotion || !layoutRef.current) {
      setDisplayCount(nextCount);
      return;
    }

    setIsAnimatingMore(true);
    layoutRef.current.update(
      () => {
        flushSync(() => {
          setDisplayCount(nextCount);
        });
      },
      {
        duration: 840,
        ease: motionTokens.ease.entrance,
        onComplete: () => setIsAnimatingMore(false),
      },
    );
  };

  return (
    <>
      {/* Uniform CSS grid layout */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        {visiblePosts.map((post, index) => (
          <div key={post.id} data-post-card-grid-item>
            <MemoizedPostCard
              post={post}
              priority={index < PRIORITY_COUNT}
              uniformHeightBelowMd
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <Button
            onClick={loadMore}
            disabled={isAnimatingMore}
            size="lg"
            variant="outline"
            className="min-w-44 border-foreground/10 bg-background/70 shadow-sm backdrop-blur-sm"
          >
            {isAnimatingMore ? (
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
