import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import { HeroSection } from "@/components/features/posts/hero-section";
import PaginatedPosts from "@/components/features/posts/paginated-posts";

// Force dynamic rendering for immediate updates
export const dynamic = 'force-dynamic';

export default async function Home() {
  const posts = await getPosts();

  return (
    <div>
      <HeroSection />

      {posts.length === 0 ? (
        <EmptyPostsState />
      ) : (
        <PaginatedPosts initialPosts={posts} postsPerPage={12} />
      )}
    </div>
  );
}
