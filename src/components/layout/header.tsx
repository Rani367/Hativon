"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArchiveMenuButton } from "@/components/features/archive/archive-menu-button";

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

export function Header() {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  if (isHiddenRoute) {
    return null;
  }

  return (
    <header className="border-b">
      <nav className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:h-20 sm:gap-4">
          <div className="flex min-w-0 items-center justify-start gap-1.5 sm:gap-4">
            <ArchiveMenuButton />
            <UserMenu />
          </div>
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center whitespace-nowrap text-lg font-bold text-foreground sm:text-xl md:text-2xl"
              prefetch={false}
            >
              חטיבון
            </Link>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-4">
            <NewPostButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
