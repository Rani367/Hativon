import { getPosts } from "@/lib/posts";
import { Post } from "@/types/post.types";
import PostCard from "@/components/post-card";

export default async function Home() {
  const posts = await getPosts();

  return (
    <div>
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
          ברוכים הבאים לחטיבון
        </h1>
        <p className="text-lg text-muted-foreground">
          עיתון התלמידים של חטיבת הביניים - כתבות, חדשות ועדכונים
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
