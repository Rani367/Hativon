"use client";

import { useState } from "react";
import { Post } from "@/types/post.types";
import PostCard from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, buttonVariants } from "@/lib/utils";

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
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {visiblePosts.map((post, index) => (
          <PostCard key={post.id} post={post} priority={index < 3} />
        ))}
      </motion.div>

      <AnimatePresence>
        {hasMore && (
          <motion.div
            className="flex justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={loadMore}
                disabled={loading}
                size="lg"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="me-2 animate-spin" />
                    טוען...
                  </>
                ) : (
                  "טען עוד כתבות"
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
