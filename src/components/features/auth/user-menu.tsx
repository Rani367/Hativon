"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, FileText, LayoutDashboard, UserCog } from "lucide-react";

// Lazy load auth dialog - not needed until user clicks login
const AuthDialog = lazy(() =>
  import("./auth-dialog").then((mod) => ({ default: mod.AuthDialog })),
);

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  if (loading) {
    return <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={() => setAuthDialogOpen(true)}
          className="cursor-pointer"
        >
          התחבר
        </Button>
        {/* Only load dialog when opened */}
        {authDialogOpen && (
          <Suspense fallback={null}>
            <AuthDialog
              open={authDialogOpen}
              onOpenChange={setAuthDialogOpen}
            />
          </Suspense>
        )}
      </>
    );
  }

  const handleLogout = async () => {
    await logout();
    // Force a hard reload to clear any cached state
    window.location.replace("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            <span>הפוסטים שלי</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/posts/new" className="cursor-pointer">
            <FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            <span>פוסט חדש</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            <UserCog className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            <span>הפרופיל שלי</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          <span>התנתק</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
