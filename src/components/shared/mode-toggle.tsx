"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { logError } from "@/lib/logger";
import { useAuth } from "@/components/features/auth/auth-provider";
import { useTheme } from "next-themes";

interface ThemeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { checkAuth, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const userId = user?.id;

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const syncThemePreference = useCallback(
    async (themePreference: "light" | "dark") => {
      if (!userId || userId === "legacy-admin") {
        return;
      }

      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themePreference }),
        });

        if (!response.ok) {
          throw new Error("Failed to sync theme preference");
        }

        await checkAuth();
      } catch (error) {
        logError("Failed to sync theme preference:", error);
      }
    },
    [checkAuth, userId],
  );

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  const handleToggle = () => {
    triggerHaptic();
    setTheme(nextTheme);
    void syncThemePreference(nextTheme);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-8 w-16 rounded-full border border-border bg-background p-1",
          className,
        )}
      >
        <div className="flex size-6 items-center justify-center rounded-full bg-muted">
          <Sun className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-8 w-16 cursor-pointer rounded-full border border-border bg-background p-1 shadow-xs transition-colors duration-300 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      onClick={handleToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "הפעל מצב בהיר" : "הפעל מצב כהה"}
    >
      <span className="flex w-full items-center justify-between">
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full transition-transform duration-300",
            isDark
              ? "translate-x-0 bg-primary text-primary-foreground"
              : "ltr:translate-x-8 rtl:-translate-x-8 bg-muted text-muted-foreground",
          )}
        >
          {isDark ? (
            <Moon className="size-4" strokeWidth={1.5} />
          ) : (
            <Sun className="size-4" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-transform duration-300",
            isDark ? "bg-transparent" : "ltr:-translate-x-8 rtl:translate-x-8",
          )}
        >
          {isDark ? (
            <Sun className="size-4" strokeWidth={1.5} />
          ) : (
            <Moon className="size-4" strokeWidth={1.5} />
          )}
        </div>
      </span>
    </button>
  );
}
