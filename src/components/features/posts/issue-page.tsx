"use client";

import type { PaginatedPostSummaries } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mb-10 overflow-hidden rounded-3xl bg-linear-to-br from-primary/5 via-transparent to-primary/5 px-6 py-12 text-center sm:mb-16 sm:py-20"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_100%)] opacity-[0.03]" />

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl"
        >
          גיליון <span className="text-primary">{hebrewMonth}</span> {year}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl"
        >
          {result.total} {result.total === 1 ? "כתבה" : "כתבות"} שמחכות רק לך
        </motion.p>
      </motion.div>

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
