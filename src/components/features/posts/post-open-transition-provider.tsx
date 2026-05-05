"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

interface TransitionRect {
  top: number;
  inlineStart: number;
  width: number;
  height: number;
  borderRadius: number;
}

interface PostTransitionSnapshot {
  sourceId: string;
  postId: string;
  href: string;
  title: string;
  description: string;
  metaItems: string[];
  coverImage: string;
  imageAlt: string;
  shellRect: TransitionRect;
  imageRect: TransitionRect;
  contentRect: TransitionRect;
  titleRect: TransitionRect;
  metaRect: TransitionRect;
  descriptionRect: TransitionRect;
}

interface PostTransitionTargets {
  imageRect: TransitionRect;
  headerRect: TransitionRect;
  titleRect: TransitionRect;
  metaRect: TransitionRect;
  descriptionRect: TransitionRect;
}

type PostTransitionStatus =
  | "idle"
  | "navigating"
  | "waiting-for-target"
  | "animating"
  | "completed"
  | "cancelled";

interface ActivePostTransition {
  snapshot: PostTransitionSnapshot;
  status: PostTransitionStatus;
  targets: PostTransitionTargets | null;
}

interface PostOpenTransitionContextValue {
  beginPostTransition: (snapshot: PostTransitionSnapshot) => boolean;
  registerPostTransitionTarget: (
    postId: string,
    targets: PostTransitionTargets,
  ) => void;
  completePostTransition: (postId: string) => void;
  cancelPostTransition: (reason?: string) => void;
  isSourceActive: (sourceId: string) => boolean;
  isPostTransitionActive: (postId: string) => boolean;
  shouldDelayPostBody: (postId: string) => boolean;
  prefersReducedMotion: boolean;
}

interface MotionBlockProps {
  animateTo: TransitionRect;
  children: ReactNode;
  className?: string;
  duration: number;
  opacity?: number;
  scale?: number;
  transitionDelay?: number;
}

const PostOpenTransitionContext =
  createContext<PostOpenTransitionContextValue | null>(null);

const TARGET_WAIT_TIMEOUT_MS = 2500;
const CLEANUP_DELAY_MS = 80;
const TRANSITION_DURATION_SECONDS = 0.44;
const subscribeToClient = () => () => {};

function getPathnameFromHref(href: string): string {
  if (typeof window === "undefined") {
    return href;
  }

  return new URL(href, window.location.origin).pathname;
}

function getBorderRadius(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element);
  const radiusValue =
    computedStyle.borderStartStartRadius || computedStyle.borderTopLeftRadius;
  const parsedRadius = Number.parseFloat(radiusValue);

  return Number.isFinite(parsedRadius) ? parsedRadius : 24;
}

export function measureTransitionRect(element: HTMLElement): TransitionRect {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    inlineStart: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius: getBorderRadius(element),
  };
}

function MotionBlock({
  animateTo,
  children,
  className,
  duration,
  opacity = 1,
  scale = 1,
  transitionDelay = 0,
}: MotionBlockProps) {
  return (
    <motion.div
      initial={false}
      className={className}
      style={{
        position: "fixed",
        insetBlockStart: 0,
        insetInlineStart: 0,
      }}
      animate={{
        x: animateTo.inlineStart,
        y: animateTo.top,
        width: animateTo.width,
        height: animateTo.height,
        borderRadius: animateTo.borderRadius,
        opacity,
        scale,
      }}
      transition={{
        duration,
        delay: transitionDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function PostOpenTransitionOverlay({
  transition,
  onAnimationComplete,
}: {
  transition: ActivePostTransition;
  onAnimationComplete: () => void;
}) {
  const shouldAnimate =
    transition.status === "animating" && transition.targets !== null;
  const shouldResolveToTarget =
    transition.targets !== null &&
    (transition.status === "animating" || transition.status === "completed");
  const { snapshot, targets } = transition;

  const imageTarget =
    shouldResolveToTarget && targets ? targets.imageRect : snapshot.imageRect;
  const contentTarget =
    shouldResolveToTarget && targets
      ? targets.headerRect
      : snapshot.contentRect;
  const titleTarget =
    shouldResolveToTarget && targets ? targets.titleRect : snapshot.titleRect;
  const metaTarget =
    shouldResolveToTarget && targets ? targets.metaRect : snapshot.metaRect;
  const descriptionTarget =
    shouldResolveToTarget && targets
      ? targets.descriptionRect
      : snapshot.descriptionRect;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-[120] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]"
        animate={{ opacity: shouldAnimate ? 0.12 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      <MotionBlock
        animateTo={imageTarget}
        className="relative overflow-hidden border border-border/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
        duration={TRANSITION_DURATION_SECONDS}
      >
        <Image
          src={snapshot.coverImage}
          alt={snapshot.imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </MotionBlock>

      <MotionBlock
        animateTo={contentTarget}
        className="overflow-hidden border border-border/70 bg-card/95 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-sm"
        duration={TRANSITION_DURATION_SECONDS}
      >
        <div className="h-full w-full bg-gradient-to-br from-card via-card to-secondary/40" />
      </MotionBlock>

      <MotionBlock
        animateTo={metaTarget}
        className="overflow-hidden"
        duration={TRANSITION_DURATION_SECONDS}
        opacity={shouldAnimate ? 0.92 : 1}
      >
        <div className="flex h-full w-full flex-wrap items-center gap-2 overflow-hidden">
          {snapshot.metaItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </MotionBlock>

      <MotionBlock
        animateTo={titleTarget}
        className="overflow-hidden text-foreground"
        duration={TRANSITION_DURATION_SECONDS}
      >
        <div className="h-full w-full text-lg font-black leading-tight sm:text-2xl lg:text-4xl">
          {snapshot.title}
        </div>
      </MotionBlock>

      <MotionBlock
        animateTo={descriptionTarget}
        className="overflow-hidden text-muted-foreground"
        duration={TRANSITION_DURATION_SECONDS}
        opacity={shouldAnimate ? 0.92 : 1}
        transitionDelay={0.02}
      >
        <div className="h-full w-full text-sm leading-6 sm:text-base">
          {snapshot.description}
        </div>
      </MotionBlock>

      {shouldAnimate && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: TRANSITION_DURATION_SECONDS }}
          onAnimationComplete={onAnimationComplete}
        />
      )}
    </div>
  );
}

export function PostOpenTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const cleanupTimeoutRef = useRef<number | null>(null);
  const isMounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const [activeTransition, setActiveTransition] =
    useState<ActivePostTransition | null>(null);

  const clearCleanupTimeout = useCallback(() => {
    if (cleanupTimeoutRef.current !== null) {
      window.clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  const finishTransition = useCallback(() => {
    clearCleanupTimeout();
    cleanupTimeoutRef.current = window.setTimeout(() => {
      setActiveTransition(null);
      cleanupTimeoutRef.current = null;
    }, CLEANUP_DELAY_MS);
  }, [clearCleanupTimeout]);

  useEffect(() => {
    return clearCleanupTimeout;
  }, [clearCleanupTimeout]);

  useEffect(() => {
    if (!activeTransition) {
      return;
    }

    clearCleanupTimeout();

    if (
      activeTransition.status === "completed" ||
      activeTransition.status === "cancelled"
    ) {
      finishTransition();
      return;
    }

    const timeoutDuration =
      activeTransition.status === "animating"
        ? Math.ceil(TRANSITION_DURATION_SECONDS * 1000) + 200
        : TARGET_WAIT_TIMEOUT_MS;

    cleanupTimeoutRef.current = window.setTimeout(() => {
      setActiveTransition((currentTransition) => {
        if (
          !currentTransition ||
          currentTransition.snapshot.sourceId !== activeTransition.snapshot.sourceId
        ) {
          return currentTransition;
        }

        return {
          ...currentTransition,
          status: "cancelled",
        };
      });
    }, timeoutDuration);

    return clearCleanupTimeout;
  }, [activeTransition, clearCleanupTimeout, finishTransition]);

  const beginPostTransition = useCallback(
    (snapshot: PostTransitionSnapshot) => {
      if (prefersReducedMotion || activeTransition !== null) {
        return false;
      }

      setActiveTransition({
        snapshot,
        status: "navigating",
        targets: null,
      });

      return true;
    },
    [activeTransition, prefersReducedMotion],
  );

  const registerPostTransitionTarget = useCallback(
    (postId: string, targets: PostTransitionTargets) => {
      if (!activeTransition || activeTransition.snapshot.postId !== postId) {
        return;
      }

      const targetPath = getPathnameFromHref(activeTransition.snapshot.href);
      const shouldStartAnimation = pathname === targetPath;

      if (shouldStartAnimation) {
        window.scrollTo(0, 0);
      }

      setActiveTransition((currentTransition) => {
        if (!currentTransition || currentTransition.snapshot.postId !== postId) {
          return currentTransition;
        }

        return {
          ...currentTransition,
          status: shouldStartAnimation ? "animating" : currentTransition.status,
          targets,
        };
      });
    },
    [activeTransition, pathname],
  );

  const completePostTransition = useCallback((postId: string) => {
    setActiveTransition((currentTransition) => {
      if (!currentTransition || currentTransition.snapshot.postId !== postId) {
        return currentTransition;
      }

      return {
        ...currentTransition,
        status: "completed",
      };
    });
  }, []);

  const cancelPostTransition = useCallback((_reason?: string) => {
    setActiveTransition((currentTransition) => {
      if (!currentTransition) {
        return currentTransition;
      }

      return {
        ...currentTransition,
        status: "cancelled",
      };
    });
  }, []);

  const contextValue = useMemo<PostOpenTransitionContextValue>(
    () => ({
      beginPostTransition,
      registerPostTransitionTarget,
      completePostTransition,
      cancelPostTransition,
      isSourceActive: (sourceId: string) =>
        activeTransition?.snapshot.sourceId === sourceId &&
        activeTransition.status !== "completed" &&
        activeTransition.status !== "cancelled",
      isPostTransitionActive: (postId: string) =>
        activeTransition?.snapshot.postId === postId &&
        activeTransition.status !== "completed" &&
        activeTransition.status !== "cancelled",
      shouldDelayPostBody: (postId: string) =>
        activeTransition?.snapshot.postId === postId &&
        activeTransition.status !== "completed" &&
        activeTransition.status !== "cancelled",
      prefersReducedMotion,
    }),
    [
      activeTransition,
      beginPostTransition,
      cancelPostTransition,
      completePostTransition,
      prefersReducedMotion,
      registerPostTransitionTarget,
    ],
  );

  return (
    <PostOpenTransitionContext.Provider value={contextValue}>
      {children}
      {isMounted &&
        activeTransition &&
        createPortal(
          <PostOpenTransitionOverlay
            transition={activeTransition}
            onAnimationComplete={() =>
              completePostTransition(activeTransition.snapshot.postId)
            }
          />,
          document.body,
        )}
    </PostOpenTransitionContext.Provider>
  );
}

export function usePostOpenTransition() {
  const context = useContext(PostOpenTransitionContext);

  if (!context) {
    throw new Error(
      "usePostOpenTransition must be used inside PostOpenTransitionProvider",
    );
  }

  return context;
}
