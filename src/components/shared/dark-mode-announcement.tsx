"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/features/auth/auth-provider";
import { logError } from "@/lib/logger";
import { isThemePreference } from "@/lib/theme/preferences";
import type {
  ThemePreference,
  UserPreferencesUpdate,
} from "@/types/user.types";

interface DarkModeAnnouncementProps {
  dismissalStorageKey: string;
  themeStorageKey: string;
}

function canSyncPreferences(userId: string | undefined) {
  return Boolean(userId && userId !== "legacy-admin");
}

function getStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local persistence is best-effort; account sync still covers logged-in users.
  }
}

export function DarkModeAnnouncement({
  dismissalStorageKey,
  themeStorageKey,
}: DarkModeAnnouncementProps) {
  const { setTheme } = useTheme();
  const { checkAuth, loading, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const syncedDismissalRef = useRef<string | null>(null);
  const syncedThemeRef = useRef<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const syncPreferences = useCallback(
    async (updates: UserPreferencesUpdate, refreshSession = false) => {
      if (!canSyncPreferences(user?.id)) {
        return;
      }

      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to sync user preferences");
        }

        if (refreshSession) {
          await checkAuth();
        }
      } catch (error) {
        logError("Failed to sync user preferences:", error);
      }
    },
    [checkAuth, user?.id],
  );

  useEffect(() => {
    if (!mounted || loading) {
      return;
    }

    const localDismissed =
      getStoredValue(dismissalStorageKey) === "true";
    const storedTheme = getStoredValue(themeStorageKey);
    const hasLocalTheme = isThemePreference(storedTheme);
    const userTheme = user?.themePreference;
    const userDismissed = user?.darkModeAnnouncementDismissed === true;

    let shouldOpen = true;

    if (userDismissed) {
      setStoredValue(dismissalStorageKey, "true");
      shouldOpen = false;
    } else if (user && canSyncPreferences(user.id)) {
      if (!hasLocalTheme && isThemePreference(userTheme)) {
        setTheme(userTheme);
      }

      if (
        hasLocalTheme &&
        storedTheme !== userTheme &&
        syncedThemeRef.current !== `${user.id}:${storedTheme}`
      ) {
        syncedThemeRef.current = `${user.id}:${storedTheme}`;
        void syncPreferences({
          themePreference: storedTheme as ThemePreference,
        });
      }

      if (
        localDismissed &&
        syncedDismissalRef.current !== user.id
      ) {
        syncedDismissalRef.current = user.id;
        void syncPreferences({ darkModeAnnouncementDismissed: true });
      }
    }

    if (localDismissed) {
      shouldOpen = false;
    }

    const frame = window.requestAnimationFrame(() => {
      setOpen(shouldOpen);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    dismissalStorageKey,
    loading,
    mounted,
    setTheme,
    syncPreferences,
    themeStorageKey,
    user,
  ]);

  const dismissAnnouncement = useCallback(
    (updates: UserPreferencesUpdate = {}) => {
      setStoredValue(dismissalStorageKey, "true");
      setOpen(false);
      void syncPreferences(
        {
          darkModeAnnouncementDismissed: true,
          ...updates,
        },
        true,
      );
    },
    [dismissalStorageKey, syncPreferences],
  );

  const handleEnableDarkMode = () => {
    setTheme("dark");
    setStoredValue(themeStorageKey, "dark");
    dismissAnnouncement({ themePreference: "dark" });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      dismissAnnouncement();
      return;
    }

    setOpen(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-[540px]"
        dir="rtl"
      >
        <div className="grid gap-0 sm:grid-cols-[1fr_1.08fr]">
          <div className="relative min-h-52 overflow-hidden bg-zinc-950 p-5 text-white sm:min-h-full sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                  <Moon className="size-5" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
                  <Sparkles className="size-3.5" />
                  חדש
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 shadow-2xl">
                <div className="mb-3 flex items-center gap-2">
                  <div className="size-8 rounded-md bg-white/15" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 h-2.5 w-24 rounded-full bg-white/50" />
                    <div className="h-2 w-16 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 rounded-full bg-white/25" />
                  <div className="h-2.5 w-10/12 rounded-full bg-white/15" />
                  <div className="h-2.5 w-7/12 rounded-full bg-white/15" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-white/10 bg-white/[0.07] p-2">
                  <div className="mb-2 h-1.5 w-10 rounded-full bg-white/35" />
                  <div className="h-1.5 w-16 rounded-full bg-white/15" />
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.07] p-2">
                  <div className="mb-2 h-1.5 w-8 rounded-full bg-white/35" />
                  <div className="h-1.5 w-14 rounded-full bg-white/15" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <DialogHeader className="text-right">
              <DialogTitle className="text-2xl font-black leading-tight">
                מצב כהה הגיע לחטיבון
              </DialogTitle>
              <DialogDescription className="text-base leading-7">
                קריאה נעימה יותר בערב, עם אותו חטיבון שאתם מכירים.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-2">
              <div className="rounded-md border bg-background p-3">
                <Sun className="mb-3 size-4 text-muted-foreground" />
                <div className="mb-2 h-2 w-16 rounded-full bg-foreground/40" />
                <div className="h-2 w-12 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-white shadow-sm">
                <Moon className="mb-3 size-4 text-zinc-300" />
                <div className="mb-2 h-2 w-16 rounded-full bg-white/70" />
                <div className="h-2 w-12 rounded-full bg-white/25" />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => dismissAnnouncement()}
              >
                לא עכשיו
              </Button>
              <Button type="button" onClick={handleEnableDarkMode}>
                <Moon data-icon="inline-start" />
                הפעל מצב כהה
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
