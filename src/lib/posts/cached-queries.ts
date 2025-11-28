/**
 * Cached versions of post queries using Next.js unstable_cache
 * Use these in API routes for better performance with automatic revalidation
 */

import { unstable_cache } from "next/cache";
import {
  getPosts as getPostsUncached,
  getPostStats as getPostStatsUncached,
  getPostBySlug as getPostBySlugUncached,
} from "./queries";

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
 * Cached version of getPostBySlug
 * Revalidates: 60 seconds or when 'posts' tag is invalidated
 */
export const getCachedPostBySlug = unstable_cache(
  async (slug: string) => {
    return getPostBySlugUncached(slug);
  },
  ["posts-by-slug"],
  {
    revalidate: 60,
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
