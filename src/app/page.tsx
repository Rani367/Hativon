import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import { PostCarousel } from "@/components/features/posts/post-carousel";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import { Suspense } from "react";
import { PostGridSkeleton } from "@/components/shared/loading-skeletons";
import RevealFx from "@/components/ui/RevealFx";

// Use ISR for instant loading with periodic revalidation
export const revalidate = 60; // Revalidate every 60 seconds

async function HomeContent() {
  const posts = await getPosts();

  return (
    <>
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
    </>
  );
}

export default function Home() {
  return (
    <div>
      <Suspense fallback={
        <>
          <div className="carousel-container">
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-white">Loading...</div>
            </div>
          </div>
          <div className="container mx-auto px-4 pt-24 pb-12">
            <PostGridSkeleton count={12} />
          </div>
        </>
      }>
        <HomeContent />
      </Suspense>
    </div>
  );
}
