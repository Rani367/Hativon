"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";

// Lazy load auth dialog - not needed until user clicks without being logged in
const AuthDialog = lazy(() =>
  import("../auth/auth-dialog").then((mod) => ({ default: mod.AuthDialog })),
);

export function NewPostButton() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      // User is not logged in, show login dialog
      setAuthDialogOpen(true);
    } else {
      // User is logged in, redirect to new post page
      router.push("/dashboard/posts/new");
    }
  };

  if (loading) {
    return <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />;
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleClick}
        className="gap-2 cursor-pointer"
      >
        <PenSquare className="h-4 w-4" />
        <span className="hidden sm:inline">פוסט חדש</span>
      </Button>
      {/* Only load dialog when needed */}
      {authDialogOpen && (
        <Suspense fallback={null}>
          <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </Suspense>
      )}
    </>
  );
}
