import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import { PostCarousel } from "@/components/features/posts/post-carousel";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import RevealFx from "@/components/ui/RevealFx";

// Enable ISR with 60 second revalidation for instant loading
export const revalidate = 60;

export default async function Home() {
  const posts = await getPosts();

  return (
    <div>
      <RevealFx translateY="4" delay={0}>
        <PostCarousel posts={posts} />
      </RevealFx>
      <div className="container mx-auto px-4 pt-24 pb-12">
        {posts.length === 0 ? (
          <RevealFx translateY="6" delay={0.2}>
            <EmptyPostsState />
          </RevealFx>
        ) : (
          <RevealFx translateY="8" delay={0.2}>
            <PaginatedPosts initialPosts={posts} postsPerPage={12} />
          </RevealFx>
        )}
      </div>
    </div>
  );
}
