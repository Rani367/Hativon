"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileText, Menu, Users } from "lucide-react";
import { AdminPasswordGate } from "@/components/features/admin/admin-password-gate";
import { logError } from "@/lib/logger";

type AuthState = "checking" | "authorized" | "needs-password" | "login-page";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Memoized auth check function
  const checkAuth = useCallback(async () => {
    // Skip if already authorized (prevents re-checking on navigation)
    if (authState === "authorized") {
      return;
    }

    try {
      // First check if user is a teacher (via user auth)
      const userResponse = await fetch("/api/check-auth");
      const userData = await userResponse.json();

      if (userData.authenticated && userData.isTeacher) {
        // Teachers get automatic admin access
        if (!userData.isAdmin) {
          await fetch("/api/admin/teacher-auth", { method: "POST" });
        }
        setAuthState("authorized");
        setHasCheckedAuth(true);
        return;
      }

      // Check admin session cookie directly
      const adminResponse = await fetch("/api/admin/check-session");
      const adminData = await adminResponse.json();

      if (adminData.authenticated) {
        setAuthState("authorized");
      } else {
        setAuthState("needs-password");
      }
      setHasCheckedAuth(true);
    } catch (error) {
      logError("Auth check failed:", error);
      setAuthState("needs-password");
      setHasCheckedAuth(true);
    }
  }, [authState]);

  // Check auth only once on mount (not on every navigation)
  useEffect(() => {
    // Login page is handled by page.tsx directly
    if (pathname === "/admin") {
      setAuthState("login-page");
      return;
    }

    // Only check auth once, not on every navigation
    if (!hasCheckedAuth && authState !== "authorized") {
      checkAuth();
    }
  }, [pathname, hasCheckedAuth, authState, checkAuth]);

  // Show login page without layout (handled by page.tsx)
  if (authState === "login-page") {
    return children;
  }

  // Show loading state while checking authentication
  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center">
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
          <aside className="hidden lg:block w-64 border-l bg-background">
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
          <main className="flex-1 p-6 lg:p-8">
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

  // Show admin password gate only when explicitly needed
  if (authState === "needs-password") {
    return <AdminPasswordGate onSuccess={() => setAuthState("authorized")} />;
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
        <div className="container flex h-14 items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ms-4 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">פאנל ניהול</h1>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  חזור לאתר
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          } fixed inset-y-0 right-0 z-[60] w-64 border-l bg-background transition-transform lg:translate-x-0 lg:static`}
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
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
