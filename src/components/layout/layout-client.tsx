"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { PostOpenTransitionProvider } from "@/components/features/posts/post-open-transition-provider";

interface LayoutClientProps {
  children: ReactNode;
}

export function LayoutClient({ children }: LayoutClientProps) {
  const pathname = usePathname();

  // Don't wrap admin or dashboard routes with the main site layout
  // These have their own layouts
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return <>{children}</>;
  }

  return (
    <PostOpenTransitionProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 xl:px-12">
          {children}
        </main>
        <footer className="py-4 text-center text-xs text-muted-foreground/50">
          נבנה על ידי רני מלאך
        </footer>
      </div>
    </PostOpenTransitionProvider>
  );
}
