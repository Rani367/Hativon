"use client";
import { useState, useEffect, forwardRef, useRef, CSSProperties, ReactNode } from "react";
import styles from "./RevealFx.module.scss";

interface RevealFxProps {
  children: ReactNode;
  speed?: "fast" | "medium" | "slow" | number;
  delay?: number;
  revealedByDefault?: boolean;
  translateY?: number | string;
  trigger?: boolean;
  style?: CSSProperties;
  className?: string;
  [key: string]: any;
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
    ref
  ) => {
    const [isRevealed, setIsRevealed] = useState(revealedByDefault);
    const [maskRemoved, setMaskRemoved] = useState(false);
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
      // If delay is 0, execute on next animation frame to allow initial render
      if (delay === 0) {
        // Use requestAnimationFrame to ensure DOM renders initial state first
        const rafId = requestAnimationFrame(() => {
          setIsRevealed(true);
          transitionTimeoutRef.current = setTimeout(() => {
            setMaskRemoved(true);
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
        }, getSpeedDurationMs());
      }, delay * 1000);

      return () => {
        clearTimeout(timer);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }, [delay]);

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
  }
);

RevealFx.displayName = "RevealFx";
export default RevealFx;
