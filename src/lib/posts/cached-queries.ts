/**
 * Cached versions of post queries using Next.js unstable_cache
 * Use these in pages for instant loading with automatic revalidation
 */

import { unstable_cache } from "next/cache";
import {
  getPosts as getPostsUncached,
  getPostStats as getPostStatsUncached,
  getPostBySlug as getPostBySlugUncached,
  getPostsByMonth as getPostsByMonthUncached,
  getArchiveMonths as getArchiveMonthsUncached,
} from "./queries";

/**
 * Cached version of getPosts
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 * Staggered revalidation to prevent cache thundering
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
 * Revalidates: 90 seconds (staggered) or when 'posts' tag is invalidated
 */
export const getCachedPostStats = unstable_cache(
  async () => {
    return getPostStatsUncached();
  },
  ["posts-stats"],
  {
    revalidate: 90,
    tags: ["posts"],
  },
);

/**
 * Cached version of getPostBySlug
 * Revalidates: 120 seconds (staggered) or when 'posts' tag is invalidated
 * Individual posts change less frequently
 */
export const getCachedPostBySlug = unstable_cache(
  async (slug: string) => {
    return getPostBySlugUncached(slug);
  },
  ["posts-by-slug"],
  {
    revalidate: 120,
    tags: ["posts"],
  },
);

/**
 * Cached version of getPostsByMonth
 * Revalidates: 180 seconds (staggered) or when 'posts' tag is invalidated
 * Archive data is more static
 */
export const getCachedPostsByMonth = unstable_cache(
  async (year: number, month: number) => {
    return getPostsByMonthUncached(year, month);
  },
  ["posts-by-month"],
  {
    revalidate: 180,
    tags: ["posts"],
  },
);

/**
 * Cached version of getArchiveMonths
 * Revalidates: 300 seconds (staggered) or when 'posts' tag is invalidated
 * Archive months list rarely changes
 */
export const getCachedArchiveMonths = unstable_cache(
  async () => {
    return getArchiveMonthsUncached();
  },
  ["archive-months"],
  {
    revalidate: 300,
    tags: ["posts"],
  },
);

/**
 * Invalidate all post caches
 * Call this after creating, updating, or deleting posts
 * Note: This is now handled by revalidateTag('posts') in mutation handlers
 */
export function invalidatePostCache(): void {
  // This function is kept for backward compatibility
  // but is no longer needed since we use revalidateTag('posts') directly
  console.warn(
    '[DEPRECATED] Use revalidateTag("posts") instead of invalidatePostCache()',
  );
}
