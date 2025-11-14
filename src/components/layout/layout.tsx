import Link from "next/link";
import { ReactNode } from "react";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { UserMenu } from "@/components/features/auth/user-menu";
import { NewPostButton } from "@/components/features/posts/new-post-button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-3 items-center h-16 sm:h-20 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 justify-start">
              <NewPostButton />
            </div>
            <div className="flex items-center justify-center">
              <Link
                href="/"
                className="flex items-center text-lg sm:text-xl md:text-2xl font-bold text-foreground"
              >
                חטיבון
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 justify-end">
              <UserMenu />
              <ModeToggle />
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        {children}
      </main>
    </div>
  );
}
