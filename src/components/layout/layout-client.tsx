"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import type { ArchiveMonth } from "@/lib/posts/queries";

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
    <div className="min-h-screen bg-background">
      <Header archives={archives} defaultMonth={defaultMonth} />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        {children}
      </main>
    </div>
  );
}
