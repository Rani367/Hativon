import Link from "next/link";
import { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { NewPostButton } from "@/components/new-post-button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-20 relative">
            <div className="flex items-center gap-4">
              <NewPostButton />
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="/"
                className="flex items-center text-2xl font-bold text-foreground"
              >
                חטיבון
              </Link>
            </div>
            <div className="flex items-center gap-4">
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
