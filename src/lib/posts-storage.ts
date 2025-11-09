import { Post, PostInput, PostStats } from '@/types/post.types';
import { db } from './db/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate description from content (first 160 characters)
 */
function generateDescription(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*_~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > 160
    ? plainText.substring(0, 160) + '...'
    : plainText;
}

/**
 * Convert database row to Post object
 */
function rowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    coverImage: row.cover_image || undefined,
    description: row.description,
    date: row.date.toISOString(),
    author: row.author || undefined,
    authorId: row.author_id || undefined,
    authorGrade: row.author_grade || undefined,
    authorClass: row.author_class || undefined,
    tags: row.tags || [],
    category: row.category || undefined,
    status: row.status as 'draft' | 'published',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/**
 * Get all posts
 */
export async function getPosts(filterPublished = false): Promise<Post[]> {
  try {
    const result = filterPublished
      ? await db.query`
          SELECT * FROM posts
          WHERE status = 'published'
          ORDER BY date DESC, created_at DESC
        `
      : await db.query`
          SELECT * FROM posts
          ORDER BY date DESC, created_at DESC
        `;

    return (result as any).rows.map(rowToPost);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  try {
    const result = await db.query`
      SELECT * FROM posts
      WHERE id = ${id}
    `;

    if ((result as any).rows.length === 0) {
      return null;
    }

    return rowToPost((result as any).rows[0]);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
}

/**
 * Get post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const result = await db.query`
      SELECT * FROM posts
      WHERE slug = ${slug} AND status = 'published'
    `;

    if ((result as any).rows.length === 0) {
      return null;
    }

    return rowToPost((result as any).rows[0]);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Create new post
 */
export async function createPost(input: PostInput): Promise<Post> {
  const id = uuidv4();
  const now = new Date();
  const slug = generateSlug(input.title);
  const description = generateDescription(input.content);
  const status = input.status || 'draft';

  try {
    const result = await db.query`
      INSERT INTO posts (
        id, title, slug, content, cover_image, description,
        date, author, author_id, author_grade, author_class,
        tags, category, status, created_at, updated_at
      )
      VALUES (
        ${id},
        ${input.title},
        ${slug},
        ${input.content},
        ${input.coverImage || null},
        ${description},
        ${now},
        ${input.author || null},
        ${input.authorId || null},
        ${input.authorGrade || null},
        ${input.authorClass || null},
        ${input.tags || []},
        ${input.category || null},
        ${status},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    return rowToPost((result as any).rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Update existing post
 */
export async function updatePost(id: string, input: Partial<PostInput>): Promise<Post | null> {
  try {
    // First, get the existing post
    const existing = await getPostById(id);
    if (!existing) {
      return null;
    }

    // Build the update fields
    const updates: any = {};

    if (input.title !== undefined) {
      updates.title = input.title;
      updates.slug = generateSlug(input.title);
    }

    if (input.content !== undefined) {
      updates.content = input.content;
      updates.description = generateDescription(input.content);
    }

    if (input.coverImage !== undefined) updates.cover_image = input.coverImage;
    if (input.author !== undefined) updates.author = input.author;
    if (input.authorId !== undefined) updates.author_id = input.authorId;
    if (input.authorGrade !== undefined) updates.author_grade = input.authorGrade;
    if (input.authorClass !== undefined) updates.author_class = input.authorClass;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.category !== undefined) updates.category = input.category;
    if (input.status !== undefined) updates.status = input.status;

    // Build dynamic query
    const setters = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);

    const result = await db.query([
      `UPDATE posts SET ${setters}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      id,
      ...values
    ] as any);

    if ((result as any).rows.length === 0) {
      return null;
    }

    return rowToPost((result as any).rows[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Delete post
 */
export async function deletePost(id: string): Promise<boolean> {
  try {
    const result = await db.query`
      DELETE FROM posts
      WHERE id = ${id}
    `;

    return (result as any).rowCount > 0;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

/**
 * Get post statistics
 */
export async function getPostStats(): Promise<PostStats> {
  try {
    const result = await db.query`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week,
        SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 ELSE 0 END) as this_month
      FROM posts
    `;

    const row = (result as any).rows[0];
    return {
      total: parseInt(row.total) || 0,
      published: parseInt(row.published) || 0,
      drafts: parseInt(row.drafts) || 0,
      today: parseInt(row.today) || 0,
      thisWeek: parseInt(row.this_week) || 0,
      thisMonth: parseInt(row.this_month) || 0,
    };
  } catch (error) {
    console.error('Error fetching post stats:', error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };
  }
}

/**
 * Check if user can edit a post
 * Admin can edit all posts, regular users can only edit their own posts
 */
export async function canUserEditPost(userId: string, postId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) {
    return true; // Admin can edit all posts
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  // User can edit if they are the author
  return post.authorId === userId;
}

/**
 * Check if user can delete a post
 * Admin can delete all posts, regular users can only delete their own posts
 */
export async function canUserDeletePost(userId: string, postId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) {
    return true; // Admin can delete all posts
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  // User can delete if they are the author
  return post.authorId === userId;
}

/**
 * Get posts by author ID
 */
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  try {
    const result = await db.query`
      SELECT * FROM posts
      WHERE author_id = ${authorId}
      ORDER BY date DESC, created_at DESC
    `;

    return (result as any).rows.map(rowToPost);
  } catch (error) {
    console.error('Error fetching posts by author:', error);
    return [];
  }
}
