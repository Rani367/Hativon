"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Home, FileText, Menu, MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logError } from "@/lib/logger";
import { triggerHaptic } from "@/lib/utils";

type AuthState = "checking" | "authorized" | "unauthorized";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check auth only once on mount (not on every navigation)
  useEffect(() => {
    if (isLoginPage || hasCheckedAuth || authState === "authorized") {
      return;
    }

    let isCancelled = false;

    const runCheck = async () => {
      try {
        // Check if user is a teacher (via user auth)
        const userResponse = await fetch("/api/check-auth");
        const userData = await userResponse.json();

        if (isCancelled) {
          return;
        }

        if (userData.authenticated && userData.isTeacher) {
          // Teachers get automatic admin access
          if (!userData.isAdmin) {
            await fetch("/api/admin/teacher-auth", { method: "POST" });
          }

          if (isCancelled) {
            return;
          }

          setAuthState("authorized");
          setHasCheckedAuth(true);
          return;
        }

        // Not a teacher - redirect to admin login page
        setAuthState("unauthorized");
        setHasCheckedAuth(true);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        logError("Auth check failed:", error);
        setAuthState("unauthorized");
        setHasCheckedAuth(true);
      }
    };

    const frame = window.requestAnimationFrame(() => {
      void runCheck();
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [isLoginPage, hasCheckedAuth, authState]);

  // Redirect unauthorized users to admin login page
  useEffect(() => {
    if (authState === "unauthorized") {
      router.replace("/admin");
    }
  }, [authState, router]);

  // Show login page without layout (handled by page.tsx)
  if (isLoginPage) {
    return children;
  }

  // Show loading state while checking authentication or redirecting
  if (authState === "checking" || authState === "unauthorized") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
            <div className="flex flex-1 items-center justify-between">
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
                <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Skeleton */}
          <aside className="hidden w-64 border-l bg-background lg:block">
            <nav className="space-y-1 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </nav>
          </aside>

          {/* Main Content Skeleton */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="h-8 w-48 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "לוח בקרה", icon: Home },
    { href: "/admin/posts", label: "כל הכתבות", icon: FileText },
    { href: "/admin/users", label: "משתמשים", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
          <button
            onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }}
            className="me-2 inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted lg:hidden"
            aria-label="פתח ניווט"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <h1 className="truncate text-base font-semibold sm:text-xl">פאנל ניהול</h1>
            <div className="hidden items-center gap-4 md:flex">
              <ModeToggle />
              <Link href="/">
                <Button variant="outline" size="sm">
                  חזור לאתר
                </Button>
              </Link>
            </div>
            <ModeToggle className="md:hidden" />
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="פתח פעולות"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/">חזור לאתר</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          } fixed inset-y-0 right-0 z-[60] h-dvh w-[min(18rem,85vw)] overflow-y-auto border-l bg-background transition-transform lg:static lg:w-64 lg:translate-x-0`}
        >
          <nav className="space-y-1 p-4 pt-20 lg:pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => { triggerHaptic(); setSidebarOpen(false); }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => { triggerHaptic(); setSidebarOpen(false); }}
        />
      )}
    </div>
  );
}
