"use client";

import { Menu } from "lucide-react";
import { useState, lazy, Suspense, useEffect, useCallback } from "react";
import { triggerHaptic } from "@/lib/utils";
import type { ArchiveMonth } from "@/lib/posts/queries";
import { logError } from "@/lib/logger";

// Lazy load the drawer
const ArchiveDrawer = lazy(() =>
  import("./archive-drawer").then((mod) => ({ default: mod.ArchiveDrawer })),
);

// Preload function - call this to start loading the chunk
const preloadDrawer = () => {
  import("./archive-drawer");
};

export function ArchiveMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [archives, setArchives] = useState<ArchiveMonth[]>([]);
  const [hasLoadedArchives, setHasLoadedArchives] = useState(false);
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);

  const loadArchives = useCallback(async () => {
    if (hasLoadedArchives || isLoadingArchives) {
      return;
    }

    setIsLoadingArchives(true);

    try {
      const response = await fetch("/api/archives");
      if (!response.ok) {
        throw new Error("Failed to load archives");
      }

      const loadedArchives = (await response.json()) as ArchiveMonth[];
      setArchives(loadedArchives);
      setHasLoadedArchives(true);
    } catch (error) {
      logError("Failed to load archives:", error);
    } finally {
      setIsLoadingArchives(false);
    }
  }, [hasLoadedArchives, isLoadingArchives]);

  // Preload drawer after initial page load is complete
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => {
        preloadDrawer();
        setIsReady(true);
      });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => {
        preloadDrawer();
        setIsReady(true);
      }, 1000);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <>
      <button
        onClick={() => {
          triggerHaptic();
          setIsOpen(true);
          void loadArchives();
        }}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 transition-colors hover:bg-accent"
        aria-label="פתח תפריט ארכיון"
      >
        <Menu className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">ארכיון</span>
      </button>
      {(isReady || isOpen) && (
        <Suspense fallback={null}>
          <ArchiveDrawer
            archives={archives}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
