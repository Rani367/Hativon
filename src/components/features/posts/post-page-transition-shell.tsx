"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatHebrewDate } from "@/lib/date/format";
import { getArchivePathForDate } from "@/lib/date/months";
import { calculateReadingTime } from "@/lib/utils";
import { type Post } from "@/types/post.types";
import {
  measureTransitionRect,
  usePostOpenTransition,
} from "@/components/features/posts/post-open-transition-provider";

interface PostPageTransitionShellProps {
  post: Post;
  wordCount: number;
  children: ReactNode;
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

export function PostPageTransitionShell({
  post,
  wordCount,
  children,
}: PostPageTransitionShellProps) {
  const articleRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const {
    beginPostReturnTransition,
    isPostTransitionActive,
    registerPostTransitionTarget,
  } = usePostOpenTransition();

  const hasCoverImage = Boolean(post.coverImage);
  const shouldRegisterOpeningTarget =
    hasCoverImage && isPostTransitionActive(post.id);
  const concealOpeningRegion = false;
  const delayPostBody = false;
  const formattedDate = formatHebrewDate(post.date);
  const readingTime = calculateReadingTime(wordCount);
  const returnHref = getArchivePathForDate(post.date);
  const authorMeta = post.author
    ? `מאת ${post.author}${post.authorDeleted ? " (נמחק)" : ""}${
        post.authorGrade && post.authorClass
          ? ` (כיתה ${post.authorGrade}${post.authorClass})`
          : ""
      }`
    : null;
  const metaItems = [
    formattedDate,
    authorMeta,
    readingTime,
    `${wordCount} מילים`,
  ].filter((item): item is string => Boolean(item));

  const getTransitionTargets = useCallback(() => {
    if (
      !imageContainerRef.current ||
      !headerRef.current ||
      !titleRef.current ||
      !metaRef.current ||
      !descriptionRef.current
    ) {
      return null;
    }

    return {
      imageRect: measureTransitionRect(imageContainerRef.current),
      headerRect: measureTransitionRect(headerRef.current),
      titleRect: measureTransitionRect(titleRef.current),
      metaRect: measureTransitionRect(metaRef.current),
      descriptionRect: measureTransitionRect(descriptionRef.current),
    };
  }, []);

  useEffect(() => {
    if (!shouldRegisterOpeningTarget) {
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
    post.id,
    registerPostTransitionTarget,
    shouldRegisterOpeningTarget,
  ]);

  const handleReturnClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldSkipTransitionClick(event)) {
      return;
    }

    const coverImage = post.coverImage;
    const targets = getTransitionTargets();

    if (!coverImage || !articleRef.current || !targets) {
      return;
    }

    beginPostReturnTransition({
      sourceId: `post-page-${post.id}`,
      postId: post.id,
      href: returnHref,
      title: post.title,
      description: post.description,
      metaItems,
      coverImage,
      imageAlt: post.title,
      shellRect: measureTransitionRect(articleRef.current),
      imageRect: targets.imageRect,
      contentRect: targets.headerRect,
      titleRect: targets.titleRect,
      metaRect: targets.metaRect,
      descriptionRect: targets.descriptionRect,
    });
  };

  return (
    <article
      ref={articleRef}
      className="mx-auto max-w-4xl py-2 sm:px-6 sm:py-8"
    >
      <div className="mb-4 sm:mb-6">
        <Link
          href={returnHref}
          className="inline-flex min-h-10 items-center rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
          prefetch={true}
          onClick={handleReturnClick}
        >
          חזרה לגיליון
        </Link>
      </div>

      {post.coverImage && (
        <div
          ref={imageContainerRef}
          className={`relative mb-6 w-full overflow-hidden rounded-2xl border shadow-sm transition-opacity duration-200 sm:mb-8 sm:rounded-[2rem] ${
            concealOpeningRegion ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={800}
            className="h-auto w-full"
            priority
            loading="eager"
            fetchPriority="high"
            quality={75}
            sizes="(max-width: 768px) 100vw, 896px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            unoptimized
          />
        </div>
      )}

      <header
        ref={headerRef}
        className={`mb-6 rounded-2xl border bg-card/70 p-4 shadow-sm transition-opacity duration-200 sm:mb-10 sm:rounded-[2rem] sm:p-8 ${
          concealOpeningRegion ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          ref={metaRef}
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:mb-5 sm:gap-3 sm:text-base"
        >
          <time className="rounded-full bg-muted px-2.5 py-1 sm:px-3">
            {formattedDate}
          </time>
          {post.author && (
            <span className="rounded-full bg-muted px-2.5 py-1 sm:px-3">
              מאת {post.author}
              {post.authorDeleted && (
                <span className="text-muted-foreground"> (נמחק)</span>
              )}
              {post.authorGrade &&
                post.authorClass &&
                ` (כיתה ${post.authorGrade}${post.authorClass})`}
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-1 sm:px-3">
            {readingTime}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 sm:px-3">
            {wordCount} מילים
          </span>
        </div>

        <h1
          ref={titleRef}
          className="mb-4 break-words text-2xl font-black leading-tight text-foreground sm:mb-5 sm:text-4xl lg:text-5xl"
        >
          {post.title}
        </h1>

        <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
          {post.isTeacherPost && (
            <Badge
              variant="default"
              className="bg-amber-500 px-3 py-1 text-sm text-white sm:px-4 sm:py-1.5 sm:text-base"
            >
              פוסט של מורה
            </Badge>
          )}
          {post.category && (
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm sm:px-4 sm:py-1.5 sm:text-base"
            >
              {post.category}
            </Badge>
          )}
          {post.tags &&
            post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="px-3 py-1 text-sm sm:px-4 sm:py-1.5 sm:text-base"
              >
                {tag}
              </Badge>
            ))}
        </div>

        <p
          ref={descriptionRef}
          className="max-w-3xl break-words text-base leading-7 text-muted-foreground sm:text-lg"
        >
          {post.description}
        </p>
      </header>

      <div
        className={`transition-all duration-300 ${
          delayPostBody ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {children}
      </div>
    </article>
  );
}
