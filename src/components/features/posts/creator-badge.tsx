import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorBadgeProps {
  /** "lg" is used on the single-post header; "sm" (default) on cards. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Animated holographic "יוצר האתר" (site creator) badge.
 *
 * This is purely presentational — whether it renders is decided by
 * `post.isCreatorPost`, a flag derived in SQL from the author account's real
 * `username` (see `lib/posts/queries.ts`). It is never stored or settable, so
 * the badge cannot be obtained any other way.
 *
 * Visual treatment lives in `globals.css` under `.creator-badge`.
 */
export function CreatorBadge({ size = "sm", className }: CreatorBadgeProps) {
  return (
    <span
      className={cn(
        "creator-badge",
        size === "lg"
          ? "gap-2 px-4 py-1.5 text-sm sm:text-base"
          : "gap-1.5 px-2.5 py-0.5 text-xs",
        className,
      )}
      aria-label="יוצר האתר"
    >
      <Sparkles
        className={cn(
          "creator-badge__icon shrink-0",
          size === "lg" ? "h-4 w-4 sm:h-[1.1em] sm:w-[1.1em]" : "h-3.5 w-3.5",
        )}
        aria-hidden="true"
      />
      <span className="creator-badge__label">יוצר האתר</span>
    </span>
  );
}
