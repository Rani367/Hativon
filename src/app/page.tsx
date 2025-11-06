import { getPosts } from "@/lib/posts";
import { Post } from "@/types/post.types";
import PostCard from "@/components/post-card";
import { EmptyPostsState } from "@/components/empty-posts-state";
import Image from "next/image";

// Enable ISR: Revalidate every 5 minutes (300 seconds)
// This makes the homepage statically generated with periodic updates
export const revalidate = 300;

export default async function Home() {
  const posts = await getPosts();

  return (
    <div>
      {/* Hero Image Section */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] mb-12 -mt-8">
        <Image
          src="/main.jpg"
          alt="חטיבון - עיתון התלמידים"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
              ברוכים הבאים לחטיבון
            </h1>
            <p className="text-lg md:text-xl">
              עיתון התלמידים של חטיבת הנדסאים
            </p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyPostsState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
