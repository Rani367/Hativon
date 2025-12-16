"use client";

import { Menu } from "lucide-react";
import { useState, lazy, Suspense } from "react";
import type { ArchiveMonth } from "@/lib/posts/queries";

// Lazy load the drawer - it's not needed until user clicks
const ArchiveDrawer = lazy(() =>
  import("./archive-drawer").then((mod) => ({ default: mod.ArchiveDrawer })),
);

interface ArchiveMenuButtonProps {
  archives: ArchiveMonth[];
}

export function ArchiveMenuButton({ archives }: ArchiveMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpen = () => {
    setHasOpened(true); // Start loading the drawer
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="פתח תפריט ארכיון"
      >
        <Menu className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">ארכיון</span>
      </button>
      {/* Only render drawer after first open to avoid loading JS upfront */}
      {hasOpened && (
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
