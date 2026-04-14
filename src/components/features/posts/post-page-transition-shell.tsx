"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatHebrewDate } from "@/lib/date/format";
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

export function PostPageTransitionShell({
  post,
  wordCount,
  children,
}: PostPageTransitionShellProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const {
    isPostTransitionActive,
    registerPostTransitionTarget,
    shouldDelayPostBody,
  } = usePostOpenTransition();

  const hasCoverImage = Boolean(post.coverImage);
  const concealOpeningRegion = hasCoverImage && isPostTransitionActive(post.id);
  const delayPostBody = shouldDelayPostBody(post.id);

  useEffect(() => {
    if (!concealOpeningRegion) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      if (
        !imageContainerRef.current ||
        !headerRef.current ||
        !titleRef.current ||
        !metaRef.current ||
        !descriptionRef.current
      ) {
        return;
      }

      registerPostTransitionTarget(post.id, {
        imageRect: measureTransitionRect(imageContainerRef.current),
        headerRect: measureTransitionRect(headerRef.current),
        titleRect: measureTransitionRect(titleRef.current),
        metaRect: measureTransitionRect(metaRef.current),
        descriptionRect: measureTransitionRect(descriptionRef.current),
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [concealOpeningRegion, post.id, registerPostTransitionTarget]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          חזרה לגיליון
        </Link>
      </div>

      {post.coverImage && (
        <div
          ref={imageContainerRef}
          className={`relative mb-8 w-full overflow-hidden rounded-[2rem] border shadow-sm transition-opacity duration-200 ${
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
        className={`mb-10 rounded-[2rem] border bg-card/70 p-5 shadow-sm transition-opacity duration-200 sm:p-8 ${
          concealOpeningRegion ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          ref={metaRef}
          className="mb-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:text-base"
        >
          <time className="rounded-full bg-muted px-3 py-1">
            {formatHebrewDate(post.date)}
          </time>
          {post.author && (
            <span className="rounded-full bg-muted px-3 py-1">
              מאת {post.author}
              {post.authorDeleted && (
                <span className="text-muted-foreground"> (נמחק)</span>
              )}
              {post.authorGrade &&
                post.authorClass &&
                ` (כיתה ${post.authorGrade}${post.authorClass})`}
            </span>
          )}
          <span className="rounded-full bg-muted px-3 py-1">
            {calculateReadingTime(wordCount)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1">
            {wordCount} מילים
          </span>
        </div>

        <h1
          ref={titleRef}
          className="mb-5 text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {post.title}
        </h1>

        <div className="mb-4 flex flex-wrap gap-3">
          {post.isTeacherPost && (
            <Badge
              variant="default"
              className="bg-amber-500 px-4 py-1.5 text-base text-white"
            >
              פוסט של מורה
            </Badge>
          )}
          {post.category && (
            <Badge variant="secondary" className="px-4 py-1.5 text-base">
              {post.category}
            </Badge>
          )}
          {post.tags &&
            post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="px-4 py-1.5 text-base"
              >
                {tag}
              </Badge>
            ))}
        </div>

        <p
          ref={descriptionRef}
          className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg"
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
