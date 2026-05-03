"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import { AuthDialog } from "../auth/auth-dialog";

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
    return <div className="h-11 w-11 rounded-md bg-muted animate-pulse sm:h-9 sm:w-28" />;
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleClick}
        className="h-11 min-w-11 cursor-pointer gap-2 px-3 sm:h-9"
        aria-label="פוסט חדש"
      >
        <PenSquare className="h-4 w-4" />
        <span className="hidden sm:inline">פוסט חדש</span>
      </Button>
      {authDialogOpen && (
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      )}
    </>
  );
}
