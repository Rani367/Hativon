import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Post } from "@/types/post.types";
import { getWordCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

// Optimized blur placeholder - minimal size for instant display
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export default function PostCard({ post, priority = false }: PostCardProps) {
  const wordCount = post.content ? getWordCount(post.content) : 0;
  const readingTime = calculateReadingTime(wordCount);

  return (
    <Card className="group relative pt-0 overflow-hidden hover:shadow-xl transition-shadow duration-200 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        href={`/posts/${post.slug}`}
        className="absolute inset-0 z-10"
        aria-label={post.title}
        prefetch={true}
      />
      <div className="relative w-full overflow-hidden rounded-t-lg">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            width={800}
            height={600}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-auto"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="aspect-[16/9] bg-muted/80" />
        )}
        {post.category && (
          <div className="absolute top-4 start-4 z-20">
            <Badge
              variant="secondary"
              className="backdrop-blur-sm bg-background/80 shadow-sm"
            >
              {post.category}
            </Badge>
          </div>
        )}
        {post.isTeacherPost && (
          <div className="absolute top-4 end-4 z-20">
            <Badge
              variant="default"
              className="bg-amber-500/90 text-white backdrop-blur-sm shadow-sm"
            >
              פוסט של מורה
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(post.date), "d בMMMM yyyy", { locale: he })}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{readingTime}</span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground leading-tight">
            {post.title}
          </h2>
        </div>
        <p className="text-muted-foreground text-base">{post.description}</p>
      </CardHeader>
      <CardContent>
        {post.author && (
          <p className="text-base text-muted-foreground">
            מאת {post.author}
            {post.authorDeleted && (
              <span className="text-muted-foreground/60"> (נמחק)</span>
            )}
            {post.authorGrade &&
              post.authorClass &&
              ` (כיתה ${post.authorGrade}${post.authorClass})`}
          </p>
        )}
      </CardContent>
      {post.tags && post.tags.length > 0 && (
        <CardFooter>
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="bg-background/80">
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
