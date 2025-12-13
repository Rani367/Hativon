"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/features/auth/user-menu";
import { NewPostButton } from "@/components/features/posts/new-post-button";
import { ArchiveMenuButton } from "@/components/features/archive/archive-menu-button";
import { getCurrentMonthYear } from "@/lib/date/months";
import type { ArchiveMonth } from "@/lib/posts/queries";

interface HeaderProps {
  archives: ArchiveMonth[];
}

export function Header({ archives }: HeaderProps) {
  const pathname = usePathname();
  const { year, month } = getCurrentMonthYear();

  // Don't render header for admin or dashboard routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="border-b">
      <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-3 items-center h-16 sm:h-20 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 justify-start">
            <ArchiveMenuButton archives={archives} />
            <UserMenu />
          </div>
          <div className="flex items-center justify-center">
            <Link
              href={`/${year}/${month}`}
              className="flex items-center text-lg sm:text-xl md:text-2xl font-bold text-foreground"
              prefetch={true}
            >
              חטיבון
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 justify-end">
            <NewPostButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
