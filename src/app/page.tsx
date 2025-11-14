import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/features/posts/empty-posts-state";
import { HeroSection } from "@/components/features/posts/hero-section";
import PaginatedPosts from "@/components/features/posts/paginated-posts";
import { Suspense } from "react";
import { PostGridSkeleton } from "@/components/shared/loading-skeletons";

// Use ISR for instant loading with periodic revalidation
export const revalidate = 60; // Revalidate every 60 seconds

async function PostsContent() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return <EmptyPostsState />;
  }

  return <PaginatedPosts initialPosts={posts} postsPerPage={12} />;
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<PostGridSkeleton count={12} />}>
          <PostsContent />
        </Suspense>
      </div>
    </div>
  );
}
