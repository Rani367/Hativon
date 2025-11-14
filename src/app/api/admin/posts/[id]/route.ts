import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPostById, updatePost, deletePost, canUserEditPost, canUserDeletePost } from '@/lib/posts';
import { PostInput } from '@/types/post.types';
import { getCurrentUser } from '@/lib/auth/middleware';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { logError } from '@/lib/logger';

// GET /api/admin/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isAdmin = await isAdminAuthenticated();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user can view this post (own post or admin)
    const isOwner = post.authorId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    logError('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isAdmin = await isAdminAuthenticated();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user can edit this post
    const canEdit = await canUserEditPost(user.id, id, isAdmin);

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own posts' }, { status: 403 });
    }

    const body: Partial<PostInput> = await request.json();

    const updatedPost = await updatePost(id, body);

    if (!updatedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Revalidate all pages to show the updated post immediately
    revalidatePath('/', 'layout');

    return NextResponse.json(updatedPost);
  } catch (error) {
    logError('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isAdmin = await isAdminAuthenticated();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user can delete this post
    const canDelete = await canUserDeletePost(user.id, id, isAdmin);

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own posts' }, { status: 403 });
    }

    const deleted = await deletePost(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Revalidate all pages to remove the deleted post immediately
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
