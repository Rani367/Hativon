import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import { PostCarousel } from "@/components/features/posts/post-carousel";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import { Suspense } from "react";
import { PostGridSkeleton } from "@/components/shared/loading-skeletons";

// Use ISR for instant loading with periodic revalidation
export const revalidate = 60; // Revalidate every 60 seconds

async function HomeContent() {
  const posts = await getPosts();

  return (
    <>
      <PostCarousel posts={posts} />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {posts.length === 0 ? (
          <EmptyPostsState />
        ) : (
          <PaginatedPosts initialPosts={posts} postsPerPage={12} />
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
