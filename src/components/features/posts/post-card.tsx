"use client";

import Image from "next/image";
import { type MouseEvent } from "react";
import { formatHebrewDate } from "@/lib/date/format";
import type { Post, PostSummary } from "@/types/post.types";
import { calculateReadingTime, cn, getWordCount, triggerHaptic } from "@/lib/utils";
import { truncateDescription } from "@/lib/posts/utils";
import { getPostCardImageUrl } from "@/lib/images/post-images";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { rememberCurrentIssuePath } from "@/lib/navigation/last-issue-path";

interface PostCardProps {
  post: Post | PostSummary;
  priority?: boolean;
  compact?: boolean;
  uniformHeightBelowMd?: boolean;
}

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export default function PostCard({
  post,
  priority = false,
  compact = false,
  uniformHeightBelowMd = false,
}: PostCardProps) {
  const wordCount =
    post.wordCount ?? ("content" in post && post.content ? getWordCount(post.content) : 0);
  const readingTime = calculateReadingTime(wordCount);
  const shouldUseUniformMobileHeight = uniformHeightBelowMd && !compact;
  const hasTags = Boolean(post.tags?.length);
  const displayDescription = truncateDescription(post.description);
  const cardImageUrl = getPostCardImageUrl(post.coverImage);
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

    rememberCurrentIssuePath(post.id);
  };

  return (
    <div className="h-full">
      <Card
        className={`group relative h-full overflow-hidden rounded-lg border-border/70 bg-card/80 pt-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl supports-[backdrop-filter]:bg-background/80 ${
          compact ? "gap-2" : ""
        }`}
      >
        <a
          href={href}
          className="absolute inset-0 z-10"
          aria-label={post.title}
          onClick={handleClick}
          onMouseEnter={preloadCoverImage}
          onTouchStart={preloadCoverImage}
          onFocus={preloadCoverImage}
        />
        <div
          className={`relative w-full overflow-hidden rounded-t-lg ${
            compact ? "aspect-[16/9]" : "aspect-[16/11] sm:aspect-[4/3]"
          }`}
        >
          {cardImageUrl ? (
            <Image
              src={cardImageUrl}
              alt={post.title}
              width={800}
              height={800}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              sizes={
                compact
                  ? "(max-width: 1024px) 100vw, 30rem"
                  : "(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) calc(50vw - 3rem), 500px"
              }
              className="absolute inset-0 h-full w-full object-cover"
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
            <div className="absolute top-3 start-3 z-20 sm:top-4 sm:start-4">
              <Badge
                variant="secondary"
                className="bg-background/80 shadow-sm backdrop-blur-sm"
              >
                {post.category}
              </Badge>
            </div>
          )}
          {post.isTeacherPost && (
            <div className="absolute top-3 end-3 z-20 sm:top-4 sm:end-4">
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
          <div
            className={cn(
              "flex flex-1 flex-col",
              compact
                ? "gap-2 px-4 py-4 sm:px-6"
                : "gap-3 px-4 py-4 sm:gap-4 sm:px-7 sm:py-6",
              shouldUseUniformMobileHeight && "gap-4",
            )}
          >
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 text-muted-foreground",
                compact ? "text-xs" : "text-xs sm:text-sm",
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
                  "font-bold leading-tight text-foreground transition-colors duration-300 group-hover:text-foreground/95",
                  compact ? "line-clamp-2 text-xl" : "text-xl sm:text-2xl lg:text-[2rem]",
                  shouldUseUniformMobileHeight &&
                    "line-clamp-2 min-h-12 overflow-hidden md:min-h-0 md:overflow-visible md:line-clamp-none",
                )}
              >
                {post.title}
              </h2>
            </div>
            {compact ? (
              <p className="line-clamp-1 text-sm leading-5 text-muted-foreground">
                {displayDescription}
              </p>
            ) : (
              <p
                className={cn(
                  "line-clamp-2 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 md:line-clamp-3",
                  shouldUseUniformMobileHeight &&
                    "min-h-[3.5rem] md:min-h-0",
                )}
              >
                {displayDescription}
              </p>
            )}
            {!compact && (
              <div className="mt-auto flex flex-col gap-3 pt-2">
                <p
                  className={cn(
                    "line-clamp-1 overflow-hidden text-sm font-medium leading-6 text-foreground/80",
                    shouldUseUniformMobileHeight &&
                      "min-h-6 md:min-h-0",
                  )}
                >
                  {authorLine}
                </p>
                {(hasTags || shouldUseUniformMobileHeight) && (
                  <div
                    className={cn(
                      shouldUseUniformMobileHeight && "min-h-6 md:min-h-0",
                    )}
                  >
                    {hasTags ? (
                      <div
                        className={cn(
                          "flex flex-wrap gap-2",
                          shouldUseUniformMobileHeight &&
                            "max-h-6 overflow-hidden md:max-h-none md:overflow-visible",
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
