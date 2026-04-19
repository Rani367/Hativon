"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArchiveMenuButton } from "@/components/features/archive/archive-menu-button";
import type { ArchiveMonth } from "@/lib/posts/queries";

const UserMenu = dynamic(
  () => import("@/components/features/auth/user-menu").then((mod) => mod.UserMenu),
  {
    ssr: false,
    loading: () => <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />,
  },
);

const NewPostButton = dynamic(
  () =>
    import("@/components/features/posts/new-post-button").then(
      (mod) => mod.NewPostButton,
    ),
  {
    ssr: false,
    loading: () => <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />,
  },
);

interface HeaderProps {
  archives: ArchiveMonth[];
  defaultMonth: { year: number; month: string };
}

export function Header({ archives, defaultMonth }: HeaderProps) {
  const pathname = usePathname();
  const { year, month } = defaultMonth;
  const isHiddenRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  if (isHiddenRoute) {
    return null;
  }

  return (
    <header className="border-b">
      <nav className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid h-16 grid-cols-3 items-center gap-2 sm:h-20 sm:gap-4">
          <div className="flex items-center justify-start gap-2 sm:gap-4">
            <ArchiveMenuButton archives={archives} />
            <UserMenu />
          </div>
          <div className="flex items-center justify-center">
            <Link
              href={`/${year}/${month}`}
              className="flex items-center text-lg font-bold text-foreground sm:text-xl md:text-2xl"
              prefetch={true}
            >
              חטיבון
            </Link>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <NewPostButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
