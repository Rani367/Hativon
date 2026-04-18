"use client";

import { useRef } from "react";
import { createMountTimeline, useAnimeScope } from "@/lib/anime/motion";

export function ArchivePageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useAnimeScope(
    rootRef,
    ({ root }) => {
      createMountTimeline(root, "[data-archive-intro]", {
        staggerDelay: 120,
        y: 34,
      });
      createMountTimeline(root, "[data-featured-card]", {
        delay: 120,
        staggerDelay: 150,
        y: 42,
        scale: [0.96, 1],
      });
    },
    [],
  );

  return <div ref={rootRef}>{children}</div>;
}
