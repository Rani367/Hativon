"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { ArchiveDrawer } from "./archive-drawer";
import type { ArchiveMonth } from "@/lib/posts/queries";

interface ArchiveMenuButtonProps {
  archives: ArchiveMonth[];
}

export function ArchiveMenuButton({ archives }: ArchiveMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <ArchiveDrawer
        archives={archives}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
