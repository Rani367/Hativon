"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const TRANSITION_KEY = "post-cover-transition";
const TRANSITION_MAX_AGE_MS = 8_000;

interface PostCoverTransitionData {
  postId: string;
  src: string;
  alt: string;
  top: number;
  left: number;
  width: number;
  height: number;
  timestamp: number;
}

interface AnimatedPostCoverProps {
  postId: string;
  src: string;
  alt: string;
}

export function savePostCoverTransitionData(data: PostCoverTransitionData) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(TRANSITION_KEY, JSON.stringify(data));
}

function readPostCoverTransitionData() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(TRANSITION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PostCoverTransitionData>;

    if (
      typeof parsed.postId !== "string" ||
      typeof parsed.src !== "string" ||
      typeof parsed.alt !== "string" ||
      typeof parsed.top !== "number" ||
      typeof parsed.left !== "number" ||
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number" ||
      typeof parsed.timestamp !== "number"
    ) {
      sessionStorage.removeItem(TRANSITION_KEY);
      return null;
    }

    return parsed as PostCoverTransitionData;
  } catch {
    sessionStorage.removeItem(TRANSITION_KEY);
    return null;
  }
}

export function AnimatedPostCover({ postId, src, alt }: AnimatedPostCoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const transitionData = readPostCoverTransitionData();
    if (!transitionData) {
      return;
    }

    const hasExpired = Date.now() - transitionData.timestamp > TRANSITION_MAX_AGE_MS;
    const shouldAnimate =
      !hasExpired && transitionData.postId === postId && transitionData.src === src;

    if (!shouldAnimate) {
      sessionStorage.removeItem(TRANSITION_KEY);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      sessionStorage.removeItem(TRANSITION_KEY);
      return;
    }

    const target = containerRef.current;
    if (!target) {
      sessionStorage.removeItem(TRANSITION_KEY);
      return;
    }

    setIsAnimating(true);

    let overlay: HTMLImageElement | null = null;
    let animation: Animation | null = null;

    const animationFrame = window.requestAnimationFrame(() => {
      const targetRect = target.getBoundingClientRect();
      overlay = document.createElement("img");
      overlay.src = transitionData.src;
      overlay.alt = transitionData.alt;
      overlay.style.position = "fixed";
      overlay.style.top = `${transitionData.top}px`;
      overlay.style.left = `${transitionData.left}px`;
      overlay.style.width = `${transitionData.width}px`;
      overlay.style.height = `${transitionData.height}px`;
      overlay.style.objectFit = "cover";
      overlay.style.borderRadius = "0.5rem";
      overlay.style.zIndex = "120";
      overlay.style.pointerEvents = "none";
      overlay.style.transformOrigin = "top center";
      document.body.appendChild(overlay);

      const translateX = targetRect.left - transitionData.left;
      const translateY = targetRect.top - transitionData.top;
      const scaleX = targetRect.width / transitionData.width;
      const scaleY = targetRect.height / transitionData.height;

      animation = overlay.animate(
        [
          {
            transform: "translate3d(0, 0, 0) scale(1)",
            borderRadius: "0.5rem",
            filter: "brightness(1)",
          },
          {
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
            borderRadius: "2rem",
            filter: "brightness(1.03)",
          },
        ],
        {
          duration: 550,
          easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
          fill: "forwards",
        },
      );

      animation.onfinish = () => {
        overlay.remove();
        overlay = null;
        sessionStorage.removeItem(TRANSITION_KEY);
        setIsAnimating(false);
      };

      animation.oncancel = () => {
        overlay.remove();
        overlay = null;
        sessionStorage.removeItem(TRANSITION_KEY);
        setIsAnimating(false);
      };
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (animation) {
        animation.cancel();
      }
      if (overlay) {
        overlay.remove();
      }
    };
  }, [postId, src]);

  return (
    <div ref={containerRef} className="relative mb-8 w-full overflow-hidden rounded-[2rem] border shadow-sm">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        className={`h-auto w-full transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
        priority
        loading="eager"
        fetchPriority="high"
        quality={75}
        sizes="(max-width: 768px) 100vw, 896px"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
        unoptimized
      />
    </div>
  );
}
