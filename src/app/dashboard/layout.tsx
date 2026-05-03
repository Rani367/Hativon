"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  PlusCircle,
  LogOut,
  Menu,
  MoreVertical,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logError } from "@/lib/logger";
import { triggerHaptic } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication for all dashboard routes
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (data.authenticated) {
          setAuthenticated(true);
          if (data.user) {
            setUserName(data.user.displayName || data.user.email);
            setIsTeacher(Boolean(data.user.isTeacher));
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        logError("Auth check failed:", error);
        router.push("/");
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      logError("Logout failed:", error);
    }
  };

  // Show loading state
  if (checking) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
            <div className="flex flex-1 items-center justify-between">
              <div className="h-6 w-32 rounded bg-muted animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 rounded bg-muted animate-pulse hidden sm:block" />
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
              {[1, 2].map((i) => (
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

  // Only show dashboard if authenticated
  if (!authenticated) {
    return null;
  }

  const navItems = [
    {
      href: "/dashboard",
      label: isTeacher ? "התוכן שלי" : "הכתבות שלי",
      icon: FileText,
    },
    { href: "/dashboard/posts/new", label: "כתבה חדשה", icon: PlusCircle },
    { href: "/dashboard/profile", label: "הפרופיל שלי", icon: UserCog },
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
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-xl">
                {isTeacher ? "מרחב העריכה וההוראה" : "מרחב הכתיבה שלי"}
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {isTeacher
                  ? "ניהול כתיבה, פרסום ומעבר מהיר לכלי צוות"
                  : "כתיבה, שמירת טיוטות ופרסום לקהילת בית הספר"}
              </p>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span className="hidden max-w-32 truncate text-sm text-muted-foreground lg:inline">
                {userName}
              </span>
              {isTeacher && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    <ShieldCheck className="me-2 h-4 w-4" />
                    כלי צוות
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" size="sm">
                  חזרה לאתר
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 ms-2" />
                התנתק
              </Button>
            </div>
            <DropdownMenu>
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
              <DropdownMenuContent align="start" className="w-48" dir="rtl">
                {isTeacher && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">
                      <ShieldCheck className="h-4 w-4" />
                      כלי צוות
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/">חזרה לאתר</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  התנתק
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
