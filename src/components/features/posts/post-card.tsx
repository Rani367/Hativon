"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, type MouseEvent } from "react";
import { formatHebrewDate } from "@/lib/date/format";
import { Post } from "@/types/post.types";
import {
  calculateReadingTime,
  cn,
  getWordCount,
  triggerHaptic,
} from "@/lib/utils";
import { truncateDescription } from "@/lib/posts/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import {
  measureTransitionRect,
  usePostOpenTransition,
} from "@/components/features/posts/post-open-transition-provider";

interface PostCardProps {
  post: Post;
  priority?: boolean;
  compact?: boolean;
  uniformHeightBelowMd?: boolean;
}

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

function shouldSkipTransitionClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.currentTarget.target === "_blank"
  );
}

export default function PostCard({
  post,
  priority = false,
  compact = false,
  uniformHeightBelowMd = false,
}: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const sourceId = `post-card-${post.id}-${useId()}`;
  const {
    beginPostTransition,
    isPostReturnTransitionActive,
    isSourceActive,
    registerPostTransitionTarget,
  } = usePostOpenTransition();
  const wordCount = post.content ? getWordCount(post.content) : 0;
  const readingTime = calculateReadingTime(wordCount);
  const shouldUseUniformMobileHeight = uniformHeightBelowMd && !compact;
  const hasTags = Boolean(post.tags?.length);
  const hasCoverImage = Boolean(post.coverImage);
  const displayDescription = truncateDescription(post.description);
  const isReturnTargetActive =
    hasCoverImage && isPostReturnTransitionActive(post.id);
  const concealCard =
    hasCoverImage && (isSourceActive(sourceId) || isReturnTargetActive);
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

  const getTransitionTargets = useCallback(() => {
    if (
      !imageContainerRef.current ||
      !contentRef.current ||
      !titleRef.current ||
      !metaRef.current ||
      !descriptionRef.current
    ) {
      return null;
    }

    return {
      imageRect: measureTransitionRect(imageContainerRef.current),
      headerRect: measureTransitionRect(contentRef.current),
      titleRect: measureTransitionRect(titleRef.current),
      metaRect: measureTransitionRect(metaRef.current),
      descriptionRect: measureTransitionRect(descriptionRef.current),
    };
  }, []);

  useEffect(() => {
    if (!isReturnTargetActive) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const targets = getTransitionTargets();

      if (!targets) {
        return;
      }

      registerPostTransitionTarget(post.id, targets);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    getTransitionTargets,
    isReturnTargetActive,
    post.id,
    registerPostTransitionTarget,
  ]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    triggerHaptic();

    if (shouldSkipTransitionClick(event)) {
      return;
    }

    const coverImage = post.coverImage;
    const targets = getTransitionTargets();

    if (!coverImage || !cardRef.current || !targets) {
      return;
    }

    beginPostTransition({
      sourceId,
      postId: post.id,
      href,
      title: post.title,
      description: displayDescription,
      metaItems: [formatHebrewDate(post.date), readingTime],
      coverImage,
      imageAlt: post.title,
      shellRect: measureTransitionRect(cardRef.current),
      imageRect: targets.imageRect,
      contentRect: targets.headerRect,
      titleRect: targets.titleRect,
      metaRect: targets.metaRect,
      descriptionRect: targets.descriptionRect,
    });
  };

  return (
    <div className="h-full">
      <Card
        ref={cardRef}
        className={cn(
          "group relative h-full overflow-hidden rounded-lg border-border/70 bg-card/80 pt-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl supports-[backdrop-filter]:bg-background/80",
          compact && "gap-2",
          concealCard && "opacity-0",
        )}
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
          ref={imageContainerRef}
          className={`relative w-full overflow-hidden rounded-t-lg ${
            compact ? "aspect-[16/9]" : "aspect-[16/11] sm:aspect-[4/3]"
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
              sizes={
                compact
                  ? "(max-width: 1024px) 100vw, 30rem"
                  : "(max-width: 768px) 100vw, (max-width: 1279px) 50vw, 40vw"
              }
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

        <div ref={contentRef} className="flex flex-1 flex-col">
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
              ref={metaRef}
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
                ref={titleRef}
                className={cn(
                  "font-bold leading-tight text-foreground transition-colors duration-300 group-hover:text-foreground/95",
                  compact
                    ? "line-clamp-2 text-xl"
                    : "text-xl sm:text-2xl lg:text-[2rem]",
                  shouldUseUniformMobileHeight &&
                    "line-clamp-2 min-h-12 overflow-hidden md:min-h-0 md:overflow-visible md:line-clamp-none",
                )}
              >
                {post.title}
              </h2>
            </div>
            {compact ? (
              <p
                ref={descriptionRef}
                className="line-clamp-1 text-sm leading-5 text-muted-foreground"
              >
                {displayDescription}
              </p>
            ) : (
              <p
                ref={descriptionRef}
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
