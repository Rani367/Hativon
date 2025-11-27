/**
 * Posts API helpers
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { Post, PostInput, PostStats } from '@/types/post.types';

export interface PostsResponse {
  posts: Post[];
  stats?: PostStats;
}

/**
 * Get all posts (admin/user-specific)
 */
export async function getPosts(params?: {
  status?: 'draft' | 'published';
  search?: string;
  stats?: boolean;
}): Promise<PostsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  if (params?.search) {
    searchParams.set('search', params.search);
  }

  if (params?.stats) {
    searchParams.set('stats', 'true');
  }

  const query = searchParams.toString();
  const endpoint = `/api/admin/posts${query ? `?${query}` : ''}`;

  return apiGet<PostsResponse>(endpoint);
}

/**
 * Get single post by ID
 */
export async function getPost(id: string): Promise<Post> {
  return apiGet<Post>(`/api/admin/posts/${id}`);
}

/**
 * Create new post
 */
export async function createPost(data: PostInput): Promise<Post> {
  return apiPost<Post>('/api/admin/posts', data);
}

/**
 * Update existing post
 */
export async function updatePost(id: string, data: Partial<PostInput>): Promise<Post> {
  return apiPatch<Post>(`/api/admin/posts/${id}`, data);
}

/**
 * Delete post
 */
export async function deletePost(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/api/admin/posts/${id}`);
}
