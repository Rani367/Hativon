"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileText, PlusCircle, LogOut, Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication for all admin routes except login page
  useEffect(() => {
    async function checkAuth() {
      if (pathname === "/admin") {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (data.authenticated) {
          // Check if user is admin
          if (data.user && data.user.role === 'admin') {
            setAuthenticated(true);
            setIsAdmin(true);
          } else if (data.legacy) {
            // Legacy admin authentication
            setAuthenticated(true);
            setIsAdmin(true);
          } else {
            // User is authenticated but not an admin - redirect to dashboard
            router.push("/dashboard");
          }
        } else {
          router.push("/admin");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin");
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/admin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show login page without layout
  if (pathname === "/admin") {
    return children;
  }

  // Show loading state
  if (checking) {
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
          <aside className="hidden lg:block w-64 border-r bg-background">
            <nav className="space-y-1 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
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

  // Only show admin layout if authenticated
  if (!authenticated) {
    return null;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "לוח בקרה", icon: Home },
    { href: "/admin/posts", label: "כל הכתבות", icon: FileText },
    { href: "/admin/posts/new", label: "כתבה חדשה", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">פאנל ניהול</h1>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  צפה באתר
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform lg:translate-x-0 lg:static`}
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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
