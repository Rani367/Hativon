import { getPosts as getStoragePosts, getPostBySlug as getStoragePostBySlug } from './posts-storage';
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

/**
 * Calculate word count from markdown content
 */
export function getWordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/[#*_~\[\]()]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return text.split(/\s+/).filter(word => word.length > 0).length;
}
