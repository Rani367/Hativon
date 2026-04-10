"use client";

import Link from "next/link";
import Image from "next/image";
import { formatHebrewDate } from "@/lib/date/format";
import { Post } from "@/types/post.types";
import { getWordCount, triggerHaptic } from "@/lib/utils";
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
  compact?: boolean;
}

// Optimized blur placeholder - minimal size for instant display
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export default function PostCard({
  post,
  priority = false,
  compact = false,
}: PostCardProps) {
  const wordCount = post.content ? getWordCount(post.content) : 0;
  const readingTime = calculateReadingTime(wordCount);
  const authorLine = post.author
    ? `מאת ${post.author}${post.authorDeleted ? " (נמחק)" : ""}${
        post.authorGrade && post.authorClass
          ? ` · כיתה ${post.authorGrade}${post.authorClass}`
          : ""
      }`
    : "מערכת חטיבון";

  return (
    <Card
      className={`group relative h-full overflow-hidden border-border/70 bg-card/80 pt-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl supports-[backdrop-filter]:bg-background/80 ${
        compact ? "gap-4" : ""
      }`}
    >
      <Link
        href={`/posts/${post.id}`}
        className="absolute inset-0 z-10"
        aria-label={post.title}
        prefetch={true}
        onClick={() => triggerHaptic()}
      />
      <div
        className={`relative w-full overflow-hidden rounded-t-lg ${
          compact ? "aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            width={800}
            height={800}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="absolute inset-0 w-full h-full object-cover"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-end bg-gradient-to-br from-muted via-muted/70 to-amber-100/60 p-5">
            <p className="text-sm font-medium text-muted-foreground">
              כתבה ללא תמונת שער
            </p>
          </div>
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
      <CardHeader className={compact ? "space-y-2 pb-2" : "space-y-3 pb-3"}>
        <div
          className={`flex flex-wrap items-center gap-3 text-muted-foreground ${
            compact ? "text-xs sm:text-sm" : "text-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatHebrewDate(post.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{readingTime}</span>
          </div>
        </div>
        <div>
          <h2
            className={`font-bold leading-tight text-foreground ${
              compact ? "text-xl" : "text-xl sm:text-2xl"
            }`}
          >
            {post.title}
          </h2>
        </div>
        <p
          className={`text-sm leading-6 text-muted-foreground ${
            compact ? "line-clamp-2" : "line-clamp-3 sm:text-base"
          }`}
        >
          {post.description}
        </p>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 pt-0" : "space-y-3 pt-0"}>
        <p className="text-sm font-medium text-foreground/80">{authorLine}</p>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            הקליקו לקריאה מלאה במובייל או במחשב.
          </p>
        )}
      </CardContent>
      {!compact && post.tags && post.tags.length > 0 && (
        <CardFooter className="pt-0">
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
