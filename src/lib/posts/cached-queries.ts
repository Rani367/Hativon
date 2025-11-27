/**
 * Cached versions of post queries
 * Use these in API routes for better performance
 */

import { memoize, clearCacheByPrefix } from '../cache';
import { getPosts as getPostsUncached, getPostStats as getPostStatsUncached, getPostBySlug as getPostBySlugUncached } from './queries';

/**
 * Cached version of getPosts
 * TTL: 60 seconds
 */
export const getCachedPosts = memoize(getPostsUncached, {
  keyGenerator: (filterPublished = false) => `posts:all:${filterPublished}`,
  ttl: 60,
});

/**
 * Cached version of getPostStats
 * TTL: 60 seconds
 */
export const getCachedPostStats = memoize(getPostStatsUncached, {
  keyGenerator: () => 'posts:stats',
  ttl: 60,
});

/**
 * Cached version of getPostBySlug
 * TTL: 60 seconds (for published posts)
 */
export const getCachedPostBySlug = memoize(getPostBySlugUncached, {
  keyGenerator: (slug: string) => `posts:slug:${slug}`,
  ttl: 60,
});

/**
 * Invalidate all post caches
 * Call this after creating, updating, or deleting posts
 */
export function invalidatePostCache(): void {
  clearCacheByPrefix('posts:');
}
