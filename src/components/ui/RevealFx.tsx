"use client";
import {
  useState,
  useEffect,
  forwardRef,
  useRef,
  CSSProperties,
  ReactNode,
} from "react";
import styles from "./RevealFx.module.scss";

const SESSION_KEY = "revealFxPlayed";

function hasAnimationPlayed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function markAnimationPlayed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, "true");
}

interface RevealFxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  speed?: "fast" | "medium" | "slow" | number;
  delay?: number;
  revealedByDefault?: boolean;
  translateY?: number | string;
  trigger?: boolean;
  style?: CSSProperties;
  className?: string;
}

const RevealFx = forwardRef<HTMLDivElement, RevealFxProps>(
  (
    {
      children,
      speed = "medium",
      delay = 0,
      revealedByDefault = false,
      translateY,
      trigger,
      style,
      className,
      ...rest
    },
    ref,
  ) => {
    // Skip animation if already played this session
    const skipAnimation = hasAnimationPlayed();
    const [isRevealed, setIsRevealed] = useState(
      revealedByDefault || skipAnimation,
    );
    const [maskRemoved, setMaskRemoved] = useState(skipAnimation);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getSpeedDurationMs = () => {
      if (typeof speed === "number") {
        return speed;
      }
      switch (speed) {
        case "fast":
          return 1000;
        case "medium":
          return 2000;
        case "slow":
          return 3000;
        default:
          return 2000;
      }
    };

    const getSpeedDuration = () => {
      const ms = getSpeedDurationMs();
      return `${ms / 1000}s`;
    };

    useEffect(() => {
      // Skip if animation already played this session
      if (skipAnimation) return;

      // If delay is 0, execute on next animation frame to allow initial render
      if (delay === 0) {
        // Use requestAnimationFrame to ensure DOM renders initial state first
        const rafId = requestAnimationFrame(() => {
          setIsRevealed(true);
          transitionTimeoutRef.current = setTimeout(() => {
            setMaskRemoved(true);
            markAnimationPlayed();
          }, getSpeedDurationMs());
        });

        return () => {
          cancelAnimationFrame(rafId);
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
        };
      }

      // Otherwise, use the delay
      const timer = setTimeout(() => {
        setIsRevealed(true);
        transitionTimeoutRef.current = setTimeout(() => {
          setMaskRemoved(true);
          markAnimationPlayed();
        }, getSpeedDurationMs());
      }, delay * 1000);

      return () => {
        clearTimeout(timer);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }, [delay, skipAnimation]);

    useEffect(() => {
      if (trigger !== undefined) {
        setIsRevealed(trigger);
        setMaskRemoved(false);
        if (trigger) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          transitionTimeoutRef.current = setTimeout(() => {
            setMaskRemoved(true);
          }, getSpeedDurationMs());
        }
      }
    }, [trigger]);

    const getTranslateYValue = () => {
      if (typeof translateY === "number") {
        return `${translateY}rem`;
      }
      return translateY;
    };

    const translateValue = getTranslateYValue();
    const revealStyle: CSSProperties = {
      transitionDuration: getSpeedDuration(),
      transform: isRevealed ? "translateY(0)" : `translateY(${translateValue})`,
      ...style,
    };

    if (maskRemoved) {
      return (
        <div
          ref={ref}
          style={revealStyle}
          className={`${styles.revealedNoMask} ${className || ""}`}
          {...rest}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={revealStyle}
        className={`${styles.revealFx} ${
          isRevealed ? styles.revealed : styles.hidden
        } ${className || ""}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

RevealFx.displayName = "RevealFx";
export default RevealFx;
