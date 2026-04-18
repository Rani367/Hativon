"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { animate, stagger } from "animejs";
import { Badge } from "@/components/ui/badge";
import { formatHebrewDate } from "@/lib/date/format";
import { calculateReadingTime } from "@/lib/utils";
import { type Post } from "@/types/post.types";
import {
  animateInViewOnce,
  createMountTimeline,
  motionTokens,
  useAnimeScope,
} from "@/lib/anime/motion";

interface PostPageTransitionShellProps {
  post: Post;
  wordCount: number;
  children: React.ReactNode;
}

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

export function PostPageTransitionShell({
  post,
  wordCount,
  children,
}: PostPageTransitionShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  useAnimeScope(
    rootRef,
    ({ root }) => {
      createMountTimeline(root, "[data-post-intro]", {
        staggerDelay: motionTokens.stagger.base,
        y: 34,
      });

      const cover = root.querySelector("[data-post-cover]");
      if (cover) {
        animate(cover, {
          opacity: [0, 1],
          scale: [1.04, 1],
          filter: ["blur(18px)", "blur(0px)"],
          duration: 1200,
          ease: motionTokens.ease.entrance,
        });
      }

      const chips = root.querySelectorAll("[data-post-chip]");
      if (chips.length) {
        animate(chips, {
          opacity: [0, 1],
          translateY: [16, 0],
          scale: [0.94, 1],
          delay: stagger(70, { start: 180 }),
          duration: 680,
          ease: motionTokens.ease.entrance,
        });
      }

      const cinematicAccent = root.querySelector("[data-post-accent]");
      if (cinematicAccent) {
        animate(cinematicAccent, {
          opacity: [0.16, 0.34],
          translateX: ["-10%", "6%"],
          duration: motionTokens.duration.loop + 1400,
          ease: motionTokens.ease.settle,
          alternate: true,
          loop: true,
        });
      }

      const storyBlocks = Array.from(
        root.querySelectorAll(
          "[data-post-body] .prose > :is(h2,h3,blockquote,pre,figure,img,ul,ol,table,hr)",
        ),
      );

      return animateInViewOnce(storyBlocks);
    },
    [post.id],
  );

  return (
    <article ref={rootRef} className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div data-post-intro className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-foreground/10 bg-background/70 px-3 py-1 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted"
        >
          חזרה לגיליון
        </Link>
      </div>

      {post.coverImage && (
        <div
          data-post-intro
          className="relative mb-8 overflow-hidden rounded-[2rem] border shadow-[0_22px_70px_rgba(15,23,42,0.14)]"
        >
          <div
            data-post-accent
            className="pointer-events-none absolute inset-y-0 left-[-10%] z-[1] w-1/2 bg-[linear-gradient(115deg,rgba(255,255,255,0.04),rgba(251,191,36,0.22),rgba(14,165,233,0.12),rgba(255,255,255,0.04))] mix-blend-screen"
          />
          <div data-post-cover className="relative">
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
        </div>
      )}

      <header
        data-post-intro
        className="mb-10 rounded-[2rem] border bg-card/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8"
      >
        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:text-base">
          <time
            data-post-chip
            className="rounded-full bg-muted px-3 py-1 shadow-sm"
          >
            {formatHebrewDate(post.date)}
          </time>
          {post.author && (
            <span
              data-post-chip
              className="rounded-full bg-muted px-3 py-1 shadow-sm"
            >
              מאת {post.author}
              {post.authorDeleted && (
                <span className="text-muted-foreground"> (נמחק)</span>
              )}
              {post.authorGrade &&
                post.authorClass &&
                ` (כיתה ${post.authorGrade}${post.authorClass})`}
            </span>
          )}
          <span
            data-post-chip
            className="rounded-full bg-muted px-3 py-1 shadow-sm"
          >
            {calculateReadingTime(wordCount)}
          </span>
          <span
            data-post-chip
            className="rounded-full bg-muted px-3 py-1 shadow-sm"
          >
            {wordCount} מילים
          </span>
        </div>

        <h1
          data-post-intro
          className="mb-5 text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {post.title}
        </h1>

        <div data-post-intro className="mb-4 flex flex-wrap gap-3">
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
          data-post-intro
          className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg"
        >
          {post.description}
        </p>
      </header>

      <div data-post-intro data-post-body>
        {children}
      </div>
    </article>
  );
}
