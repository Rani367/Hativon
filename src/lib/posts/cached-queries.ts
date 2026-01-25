/**
 * Cached versions of post queries using Next.js unstable_cache
 * Use these in pages for instant loading with automatic revalidation
 */

import { unstable_cache } from "next/cache";
import {
  getPosts as getPostsUncached,
  getPostStats as getPostStatsUncached,
  getPublishedPostById as getPublishedPostByIdUncached,
  getPostsByMonth as getPostsByMonthUncached,
  getArchiveMonths as getArchiveMonthsUncached,
} from "./queries";
import { getDefaultMonthWithFallback as getDefaultMonthUncached } from "@/lib/settings";

/**
 * Cached version of getPosts
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedPosts = unstable_cache(
  async (filterPublished = false) => {
    return getPostsUncached(filterPublished);
  },
  ["posts-all"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

/**
 * Cached version of getPostStats
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedPostStats = unstable_cache(
  async () => {
    return getPostStatsUncached();
  },
  ["posts-stats"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

/**
 * Cached version of getPublishedPostById
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedPublishedPostById = unstable_cache(
  async (id: string) => {
    return getPublishedPostByIdUncached(id);
  },
  ["posts-by-id"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

/**
 * Cached version of getPostsByMonth
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedPostsByMonth = unstable_cache(
  async (year: number, month: number) => {
    return getPostsByMonthUncached(year, month);
  },
  ["posts-by-month"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

/**
 * Cached version of getArchiveMonths
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedArchiveMonths = unstable_cache(
  async () => {
    return getArchiveMonthsUncached();
  },
  ["archive-months"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

/**
 * Cached version of getDefaultMonthWithFallback
 * Revalidates: 300 seconds or when 'default-month' tag is invalidated
 */
export const getCachedDefaultMonth = unstable_cache(
  async () => {
    return getDefaultMonthUncached();
  },
  ["default-month"],
  {
    revalidate: 300,
    tags: ["default-month"],
  },
);
