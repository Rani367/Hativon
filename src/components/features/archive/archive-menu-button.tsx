"use client";

import { Menu } from "lucide-react";
import { useState, lazy, Suspense, useEffect } from "react";
import type { ArchiveMonth } from "@/lib/posts/queries";

// Lazy load the drawer
const ArchiveDrawer = lazy(() =>
  import("./archive-drawer").then((mod) => ({ default: mod.ArchiveDrawer })),
);

// Preload function - call this to start loading the chunk
const preloadDrawer = () => {
  import("./archive-drawer");
};

interface ArchiveMenuButtonProps {
  archives: ArchiveMonth[];
}

export function ArchiveMenuButton({ archives }: ArchiveMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="פתח תפריט ארכיון"
      >
        <Menu className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">ארכיון</span>
      </button>
      {isReady && (
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
