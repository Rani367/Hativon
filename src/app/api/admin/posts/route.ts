import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost, getPostStats, getPostsByAuthor } from '@/lib/posts-storage';
import { PostInput } from '@/types/post.types';
import { getCurrentUser, isLegacyAdminAuthenticated } from '@/lib/auth/middleware';

// GET /api/admin/posts - Get all posts (admin) or user's posts (regular user)
export async function GET(request: NextRequest) {
  try {
    // Check authentication (new JWT or legacy admin)
    const user = await getCurrentUser();
    const legacyAdmin = await isLegacyAdminAuthenticated();

    if (!user && !legacyAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('stats') === 'true';

    let posts;

    // Admin sees all posts, regular user sees only their own
    if (user?.role === 'admin' || legacyAdmin) {
      posts = await getPosts(false); // Get all posts (including drafts)
    } else if (user) {
      posts = await getPostsByAuthor(user.id);
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  try {
    // Check authentication
    const user = await getCurrentUser();
    const legacyAdmin = await isLegacyAdminAuthenticated();

    if (!user && !legacyAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PostInput = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Add authorId if user is authenticated via JWT
    if (user) {
      body.authorId = user.id;
      // Also set author display name if not provided
      if (!body.author) {
        body.author = user.displayName;
      }
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
