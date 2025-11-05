import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPosts, createPost, getPostStats } from '@/lib/posts-storage';
import { PostInput } from '@/types/post.types';

// Helper to check authentication
async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken');
  return authToken?.value === 'authenticated';
}

// GET /api/admin/posts - Get all posts
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('stats') === 'true';

    let posts = await getPosts(false); // Get all posts (including drafts)

    // Filter by status
    if (status && (status === 'published' || status === 'draft')) {
      posts = posts.filter(post => post.status === status);
    }

    // Search by title
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.slug.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: any = { posts };

    // Include stats if requested
    if (includeStats) {
      response.stats = await getPostStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: PostInput = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const newPost = await createPost(body);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
