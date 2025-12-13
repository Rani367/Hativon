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
import { Clock, Calendar, ArrowUpRight } from "lucide-react";

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  const wordCount = post.content ? getWordCount(post.content) : 0;
  const readingTime = calculateReadingTime(wordCount);

  return (
    <div className="animate-fade-in-up">
      <Card className="group relative pt-0 overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 hover:-translate-y-1">
        <Link
          href={`/posts/${post.slug}`}
          className="absolute inset-0 z-10"
          aria-label={post.title}
          prefetch={true}
        />
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
            />
          ) : (
            <div className="absolute inset-0 bg-muted/80" />
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
          <div className="group-hover:pe-8 transition-all duration-300">
            <h2 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
              {post.title}
            </h2>
            <ArrowUpRight className="absolute top-[7.5rem] end-6 h-7 w-7 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary rtl:scale-x-[-1]" />
          </div>
          <p className="text-muted-foreground line-clamp-2 text-base">
            {post.description}
          </p>
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
    </div>
  );
}
