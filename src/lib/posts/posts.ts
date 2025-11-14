import { getPosts as getStoragePosts, getPostBySlug as getStoragePostBySlug } from './queries';
import { Post } from '@/types/post.types';

/**
 * Get all published posts for public display
 */
export async function getPosts(): Promise<Post[]> {
  return getStoragePosts(true); // Only published posts
}

/**
 * Get post by slug for public display
 */
export async function getPost(slug: string): Promise<Post | null> {
  return getStoragePostBySlug(slug);
}

// Re-export for backward compatibility
export { getWordCount } from '../utils/text-utils';
