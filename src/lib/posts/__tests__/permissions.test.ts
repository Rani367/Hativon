import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Post } from '@/types/post.types';

// Mock dependencies before importing
vi.mock('../queries', () => ({
  getPostById: vi.fn(),
}));

import { canUserEditPost, canUserDeletePost } from '../permissions';
import { getPostById } from '../queries';

const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-123',
  title: 'Test Post',
  slug: 'test-post',
  content: 'Test content',
  description: 'Test description',
  date: '2024-01-01',
  author: 'Test Author',
  authorId: 'author-123',
  authorGrade: 'ח',
  authorClass: 2,
  tags: ['test'],
  category: 'general',
  status: 'published',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('Post Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canUserEditPost', () => {
    it('allows admin to edit any post', async () => {
      const mockPost = createMockPost();
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost('different-user', 'post-123', true);

      expect(canEdit).toBe(true);
    });

    it('allows admin to edit post without checking database', async () => {
      const canEdit = await canUserEditPost('any-user', 'any-post', true);

      // Admin bypasses post lookup
      expect(canEdit).toBe(true);
      expect(getPostById).not.toHaveBeenCalled();
    });

    it('allows author to edit their own post', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost('author-123', 'post-123', false);

      expect(canEdit).toBe(true);
      expect(getPostById).toHaveBeenCalledWith('post-123');
    });

    it('denies non-author from editing post', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost(
        'different-user',
        'post-123',
        false
      );

      expect(canEdit).toBe(false);
    });

    it('returns false when post does not exist', async () => {
      vi.mocked(getPostById).mockResolvedValue(null);

      const canEdit = await canUserEditPost('any-user', 'non-existent', false);

      expect(canEdit).toBe(false);
    });

    it('handles post without authorId', async () => {
      const mockPost = createMockPost({ authorId: undefined });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost('user-123', 'post-123', false);

      expect(canEdit).toBe(false);
    });

    it('compares authorId exactly', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      // Similar but not exact match
      const canEdit = await canUserEditPost('author-12', 'post-123', false);

      expect(canEdit).toBe(false);
    });
  });

  describe('canUserDeletePost', () => {
    it('allows admin to delete any post', async () => {
      const mockPost = createMockPost();
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canDelete = await canUserDeletePost(
        'different-user',
        'post-123',
        true
      );

      expect(canDelete).toBe(true);
    });

    it('allows admin to delete post without checking database', async () => {
      const canDelete = await canUserDeletePost('any-user', 'any-post', true);

      // Admin bypasses post lookup
      expect(canDelete).toBe(true);
      expect(getPostById).not.toHaveBeenCalled();
    });

    it('allows author to delete their own post', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canDelete = await canUserDeletePost(
        'author-123',
        'post-123',
        false
      );

      expect(canDelete).toBe(true);
      expect(getPostById).toHaveBeenCalledWith('post-123');
    });

    it('denies non-author from deleting post', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canDelete = await canUserDeletePost(
        'different-user',
        'post-123',
        false
      );

      expect(canDelete).toBe(false);
    });

    it('returns false when post does not exist', async () => {
      vi.mocked(getPostById).mockResolvedValue(null);

      const canDelete = await canUserDeletePost(
        'any-user',
        'non-existent',
        false
      );

      expect(canDelete).toBe(false);
    });

    it('handles post without authorId', async () => {
      const mockPost = createMockPost({ authorId: undefined });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canDelete = await canUserDeletePost('user-123', 'post-123', false);

      expect(canDelete).toBe(false);
    });

    it('compares authorId exactly', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      // Similar but not exact match
      const canDelete = await canUserDeletePost('author-12', 'post-123', false);

      expect(canDelete).toBe(false);
    });
  });

  describe('Permission consistency', () => {
    it('edit and delete permissions are symmetric for regular users', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost('author-123', 'post-123', false);
      const canDelete = await canUserDeletePost(
        'author-123',
        'post-123',
        false
      );

      expect(canEdit).toBe(canDelete);
    });

    it('edit and delete permissions are symmetric for non-owners', async () => {
      const mockPost = createMockPost({ authorId: 'author-123' });
      vi.mocked(getPostById).mockResolvedValue(mockPost);

      const canEdit = await canUserEditPost('other-user', 'post-123', false);
      const canDelete = await canUserDeletePost(
        'other-user',
        'post-123',
        false
      );

      expect(canEdit).toBe(canDelete);
      expect(canEdit).toBe(false);
    });

    it('admin always has both edit and delete permissions', async () => {
      const canEdit = await canUserEditPost('any-user', 'any-post', true);
      const canDelete = await canUserDeletePost('any-user', 'any-post', true);

      expect(canEdit).toBe(true);
      expect(canDelete).toBe(true);
    });
  });
});
