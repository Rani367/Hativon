"use client";

import {
  animate,
  createScope,
  createTimeline,
  stagger,
  type Scope,
} from "animejs";
import {
  type DependencyList,
  type MutableRefObject,
  useEffect,
  useState,
} from "react";

export const motionTokens = {
  duration: {
    fast: 320,
    base: 560,
    slow: 900,
    ambient: 3200,
    loop: 5400,
  },
  ease: {
    entrance: "outExpo",
    settle: "inOut(3)",
    emphasis: "out(5)",
  },
  stagger: {
    tight: 65,
    base: 110,
    relaxed: 150,
  },
} as const;

interface MountTimelineOptions {
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  y?: number;
  opacity?: [number, number];
  scale?: [number, number];
}

export interface AnimeScopeContext<T extends HTMLElement> {
  root: T;
  scope: Scope;
}

export function canUseDomAnimation() {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof SVGElement !== "undefined"
  );
}

function resolveElements(
  root: ParentNode,
  target: string | Element[] | NodeListOf<Element> | null | undefined,
) {
  if (!target) {
    return [];
  }

  if (typeof target === "string") {
    return Array.from(root.querySelectorAll(target));
  }

  return Array.from(target);
}

export function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () =>
      setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return prefersReducedMotion;
}

export function useAnimeScope<T extends HTMLElement>(
  rootRef: MutableRefObject<T | null>,
  setup: (context: AnimeScopeContext<T>) => void | (() => void),
  deps: DependencyList,
) {
  useEffect(() => {
    if (!canUseDomAnimation() || !rootRef.current) {
      return;
    }

    const root = rootRef.current;
    const scope = createScope({ root });
    scope.add(() => setup({ root, scope }));

    return () => {
      scope.revert();
    };
  }, deps);
}

export function createMountTimeline(
  root: ParentNode,
  targets: string | Element[] | NodeListOf<Element>,
  options: MountTimelineOptions = {},
) {
  const {
    delay = 0,
    duration = motionTokens.duration.base,
    staggerDelay = motionTokens.stagger.base,
    y = 28,
    opacity = [0, 1] as [number, number],
    scale = [0.98, 1] as [number, number],
  } = options;
  const elements = resolveElements(root, targets);

  if (!elements.length) {
    return null;
  }

  const timeline = createTimeline({
    defaults: {
      duration,
      ease: motionTokens.ease.entrance,
    },
  });

  timeline.add(
    elements,
    {
      opacity,
      translateY: [y, 0],
      scale,
      filter: ["blur(14px)", "blur(0px)"],
      delay: stagger(staggerDelay),
    },
    delay,
  );

  return timeline;
}

export function attachHoverLift(
  root: ParentNode,
  targets: string | Element[] | NodeListOf<Element>,
  {
    lift = -8,
    scale = 1.01,
    imageSelector,
    glowSelector,
  }: {
    lift?: number;
    scale?: number;
    imageSelector?: string;
    glowSelector?: string;
  } = {},
) {
  const elements = resolveElements(root, targets);
  const cleanups: Array<() => void> = [];

  elements.forEach((element) => {
    const image = imageSelector
      ? element.querySelector<HTMLElement>(imageSelector)
      : null;
    const glow = glowSelector
      ? element.querySelector<HTMLElement>(glowSelector)
      : null;

    const handleEnter = () => {
      animate(element, {
        translateY: lift,
        scale,
        duration: 480,
        ease: motionTokens.ease.emphasis,
      });

      if (image) {
        animate(image, {
          scale: 1.06,
          rotate: [0, -1.2],
          duration: 700,
          ease: motionTokens.ease.entrance,
        });
      }

      if (glow) {
        animate(glow, {
          opacity: [0.1, 0.72],
          translateX: ["-12%", "8%"],
          duration: 620,
          ease: motionTokens.ease.entrance,
        });
      }
    };

    const handleLeave = () => {
      animate(element, {
        translateY: 0,
        scale: 1,
        duration: 560,
        ease: motionTokens.ease.settle,
      });

      if (image) {
        animate(image, {
          scale: 1,
          rotate: 0,
          duration: 640,
          ease: motionTokens.ease.settle,
        });
      }

      if (glow) {
        animate(glow, {
          opacity: 0.08,
          translateX: "-20%",
          duration: 420,
          ease: motionTokens.ease.settle,
        });
      }
    };

    const handlePress = () => {
      animate(element, {
        scale: 0.985,
        duration: motionTokens.duration.fast,
        ease: motionTokens.ease.emphasis,
      });
    };

    const handleRelease = () => {
      animate(element, {
        scale,
        duration: motionTokens.duration.fast,
        ease: motionTokens.ease.emphasis,
      });
    };

    element.addEventListener("pointerenter", handleEnter);
    element.addEventListener("pointerleave", handleLeave);
    element.addEventListener("pointerdown", handlePress);
    element.addEventListener("pointerup", handleRelease);
    element.addEventListener("pointercancel", handleLeave);

    cleanups.push(() => {
      element.removeEventListener("pointerenter", handleEnter);
      element.removeEventListener("pointerleave", handleLeave);
      element.removeEventListener("pointerdown", handlePress);
      element.removeEventListener("pointerup", handleRelease);
      element.removeEventListener("pointercancel", handleLeave);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

export function animateInViewOnce(
  targets: Element[],
  {
    y = 22,
    threshold = 0.18,
  }: {
    y?: number;
    threshold?: number;
  } = {},
) {
  if (!targets.length || !canUseDomAnimation()) {
    return () => undefined;
  }

  const revealed = new WeakSet<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || revealed.has(entry.target)) {
          return;
        }

        revealed.add(entry.target);
        observer.unobserve(entry.target);
        animate(entry.target, {
          opacity: [0, 1],
          translateY: [y, 0],
          filter: ["blur(10px)", "blur(0px)"],
          duration: motionTokens.duration.slow,
          ease: motionTokens.ease.entrance,
        });
      });
    },
    {
      threshold,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  targets.forEach((target) => {
    const element = target as HTMLElement;
    element.style.opacity = "0";
    element.style.transform = `translateY(${y}px)`;
    observer.observe(target);
  });

  return () => {
    observer.disconnect();
    targets.forEach((target) => {
      const element = target as HTMLElement;
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    });
  };
}
