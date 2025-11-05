"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, LogOut, Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
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
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
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
      console.error("Logout failed:", error);
    }
  };

  // Show loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  // Only show dashboard if authenticated
  if (!authenticated) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "הפוסטים שלי", icon: FileText },
    { href: "/dashboard/posts/new", label: "פוסט חדש", icon: PlusCircle },
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
            <h1 className="text-xl font-semibold">לוח הבקרה שלי</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userName}
              </span>
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
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          } fixed inset-y-0 right-0 z-40 w-64 border-l bg-background transition-transform lg:translate-x-0 lg:static`}
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
