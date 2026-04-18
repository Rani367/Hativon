"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import type { ArchiveMonth } from "@/lib/posts/queries";
import { PublicSiteBackdrop } from "@/components/shared/public-site-backdrop";

interface LayoutClientProps {
  children: ReactNode;
  archives: ArchiveMonth[];
  defaultMonth: { year: number; month: string };
}

export function LayoutClient({
  children,
  archives,
  defaultMonth,
}: LayoutClientProps) {
  const pathname = usePathname();

  // Don't wrap admin or dashboard routes with the main site layout
  // These have their own layouts
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <PublicSiteBackdrop />
      <Header archives={archives} defaultMonth={defaultMonth} />
      <main className="relative z-10 mx-auto flex max-w-[1600px] flex-1 px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full rounded-[2rem] border border-white/40 bg-background/72 shadow-[0_28px_80px_rgba(15,23,42,0.08)] supports-[backdrop-filter]:bg-background/62 supports-[backdrop-filter]:backdrop-blur-xl">
          {children}
        </div>
      </main>
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground/50">
        נבנה על ידי רני מלאך
      </footer>
    </div>
  );
}
