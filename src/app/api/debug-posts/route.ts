import { NextResponse } from "next/server";
import { getPostBySlug, getPosts } from "@/lib/posts/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const post = await getPostBySlug(slug);
      return NextResponse.json({
        success: true,
        found: !!post,
        post: post ? { id: post.id, title: post.title, slug: post.slug, status: post.status } : null,
      });
    }

    const posts = await getPosts(true);
    const postList = Array.isArray(posts) ? posts : posts.posts;
    return NextResponse.json({
      success: true,
      count: postList.length,
      posts: postList.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
