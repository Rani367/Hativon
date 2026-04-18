"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ArchiveMenuButton } from "@/components/features/archive/archive-menu-button";
import type { ArchiveMonth } from "@/lib/posts/queries";
import {
  attachHoverLift,
  createMountTimeline,
  useAnimeScope,
} from "@/lib/anime/motion";

// Dynamic imports with SSR disabled to prevent hydration mismatch
// These components use useAuth() which has different loading states on server vs client
const UserMenu = dynamic(
  () => import("@/components/features/auth/user-menu").then((mod) => mod.UserMenu),
  {
    ssr: false,
    loading: () => <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />,
  }
);

const NewPostButton = dynamic(
  () => import("@/components/features/posts/new-post-button").then((mod) => mod.NewPostButton),
  {
    ssr: false,
    loading: () => <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />,
  }
);

interface HeaderProps {
  archives: ArchiveMonth[];
  defaultMonth: { year: number; month: string };
}

export function Header({ archives, defaultMonth }: HeaderProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const { year, month } = defaultMonth;

  // Don't render header for admin or dashboard routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  useAnimeScope(
    headerRef,
    ({ root }) => {
      createMountTimeline(root, "[data-header-reveal]", {
        staggerDelay: 100,
        y: 20,
      });

      return attachHoverLift(root, "[data-header-hover]", {
        lift: -4,
        scale: 1.01,
      });
    },
    [pathname],
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-b border-white/50 bg-background/78 backdrop-blur-xl"
    >
      <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-3 items-center h-16 sm:h-20 gap-2 sm:gap-4">
          <div
            data-header-reveal
            className="flex items-center gap-2 sm:gap-4 justify-start"
          >
            <div data-header-hover className="inline-flex">
              <ArchiveMenuButton archives={archives} />
            </div>
            <div data-header-hover className="inline-flex">
              <UserMenu />
            </div>
          </div>
          <div
            data-header-reveal
            className="flex items-center justify-center"
          >
            <Link
              href={`/${year}/${month}`}
              className="flex items-center rounded-full border border-transparent bg-white/40 px-4 py-1 text-lg font-black tracking-[0.18em] text-foreground shadow-sm sm:text-xl md:text-2xl"
              prefetch={true}
              data-header-hover
            >
              חטיבון
            </Link>
          </div>
          <div
            data-header-reveal
            className="flex items-center gap-2 sm:gap-4 justify-end"
          >
            <div data-header-hover className="inline-flex">
              <NewPostButton />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
