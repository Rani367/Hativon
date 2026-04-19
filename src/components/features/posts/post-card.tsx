"use client";

import Link from "next/link";
import Image from "next/image";
import { type MouseEvent } from "react";
import { formatHebrewDate } from "@/lib/date/format";
import { Post } from "@/types/post.types";
import { calculateReadingTime, cn, getWordCount, triggerHaptic } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  uniformHeightBelowMd?: boolean;
}

// Optimized blur placeholder - minimal size for instant display
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export default function PostCard({
  post,
  priority = false,
  compact = false,
  uniformHeightBelowMd = false,
}: PostCardProps) {
  const wordCount = post.content ? getWordCount(post.content) : 0;
  const readingTime = calculateReadingTime(wordCount);
  const shouldUseUniformMobileHeight = uniformHeightBelowMd && !compact;
  const hasTags = Boolean(post.tags?.length);
  const preloadCoverImage = () => {
    if (!post.coverImage || typeof window === "undefined") {
      return;
    }

    const image = new window.Image();
    image.src = post.coverImage;
  };

  const authorLine = post.author
    ? `מאת ${post.author}${post.authorDeleted ? " (נמחק)" : ""}${
        post.authorGrade && post.authorClass
          ? ` · כיתה ${post.authorGrade}${post.authorClass}`
          : ""
      }`
    : "מערכת חטיבון";
  const href = `/posts/${post.id}`;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    triggerHaptic();
    if (event.defaultPrevented) {
      return;
    }
  };

  return (
    <div className="h-full">
      <Card
        className={`group relative h-full overflow-hidden border-border/70 bg-card/80 pt-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl supports-[backdrop-filter]:bg-background/80 ${
          compact ? "gap-2" : ""
        }`}
      >
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={post.title}
          prefetch={true}
          onClick={handleClick}
          onMouseEnter={preloadCoverImage}
          onTouchStart={preloadCoverImage}
          onFocus={preloadCoverImage}
        />
        <div
          className={`relative w-full overflow-hidden rounded-t-lg ${
            compact ? "aspect-[2/1]" : "aspect-[4/3]"
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
              className="absolute inset-0 h-full w-full object-cover"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              unoptimized
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
                className="bg-background/80 shadow-sm backdrop-blur-sm"
              >
                {post.category}
              </Badge>
            </div>
          )}
          {post.isTeacherPost && (
            <div className="absolute top-4 end-4 z-20">
              <Badge
                variant="default"
                className="bg-amber-500/90 text-white shadow-sm backdrop-blur-sm"
              >
                פוסט של מורה
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <CardHeader
            className={cn(
              compact ? "space-y-1.5 pb-0" : "space-y-3 pb-3",
              shouldUseUniformMobileHeight && "gap-3",
            )}
          >
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 text-muted-foreground",
                compact ? "text-xs" : "text-sm",
                shouldUseUniformMobileHeight && "min-h-5",
              )}
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
                className={cn(
                  "font-bold leading-tight text-foreground",
                  compact ? "line-clamp-2 text-lg" : "text-xl sm:text-2xl",
                  shouldUseUniformMobileHeight &&
                    "line-clamp-2 h-16 overflow-hidden md:h-auto md:overflow-visible md:line-clamp-none",
                )}
              >
                {post.title}
              </h2>
            </div>
            {compact ? (
              <p
                className="line-clamp-1 text-sm leading-5 text-muted-foreground"
              >
                {post.description}
              </p>
            ) : (
              <p
                className={cn(
                  "line-clamp-3 text-sm leading-6 text-muted-foreground sm:text-base",
                  shouldUseUniformMobileHeight &&
                    "h-[4.5rem] overflow-hidden md:h-auto md:overflow-visible",
                )}
              >
                {post.description}
              </p>
            )}
          </CardHeader>
          {!compact && (
            <CardContent className="space-y-3 pt-0">
              <p
                className={cn(
                  "text-sm font-medium text-foreground/80",
                  shouldUseUniformMobileHeight &&
                    "line-clamp-1 h-5 overflow-hidden md:h-auto md:overflow-visible md:line-clamp-none",
                )}
              >
                {authorLine}
              </p>
            </CardContent>
          )}
          {!compact && (hasTags || shouldUseUniformMobileHeight) && (
            <CardFooter
              className={cn(
                "pt-0",
                shouldUseUniformMobileHeight && "min-h-6 md:min-h-0",
              )}
            >
              {hasTags ? (
                <div
                  className={cn(
                    "flex flex-wrap gap-2",
                    shouldUseUniformMobileHeight &&
                      "h-6 overflow-hidden md:h-auto md:overflow-visible",
                  )}
                >
                  {post.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-background/80"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardFooter>
          )}
        </div>
      </Card>
    </div>
  );
}
