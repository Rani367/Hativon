import { getPosts } from "@/lib/posts";
import { EmptyPostsState } from "@/components/empty-posts-state";
import Image from "next/image";
import PaginatedPosts from "@/components/paginated-posts";

// Enable ISR: Revalidate every 5 minutes (300 seconds)
// This makes the homepage statically generated with periodic updates
export const revalidate = 300;

export default async function Home() {
  const posts = await getPosts();

  return (
    <div>
      {/* Hero Image Section */}
      <div className="relative w-full h-[450px] md:h-[550px] lg:h-[650px] xl:h-[700px] mb-12 -mt-8">
        <Image
          src="/main.jpg"
          alt="חטיבון - עיתון התלמידים"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl xl:text-8xl mb-6">
              ברוכים הבאים לחטיבון
            </h1>
            <p className="text-xl md:text-2xl xl:text-3xl">
              עיתון התלמידים של חטיבת הנדסאים
            </p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyPostsState />
      ) : (
        <PaginatedPosts initialPosts={posts} postsPerPage={12} />
      )}
    </div>
  );
}
