'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/auth-provider';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '../auth/auth-dialog';
import { PenSquare } from 'lucide-react';

export function EmptyPostsState() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Track mount state for consistent hydration
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleClick = () => {
    if (!user) {
      // User is not logged in, show login dialog
      setAuthDialogOpen(true);
    } else {
      // User is logged in, redirect to new post page
      router.push('/dashboard/posts/new');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-gradient-to-br from-amber-50 via-background to-sky-50 px-4 py-10 text-center dark:from-muted/50 dark:to-background sm:rounded-[2rem] sm:py-14">
        <div className="mb-6 max-w-xl sm:mb-8">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            גיליון חדש מתחיל כאן
          </p>
          <h2 className="mb-3 text-xl font-black leading-tight text-foreground sm:text-3xl">
            עדיין אין כתבות שפורסמו בחודש הזה
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            תלמידים יכולים להתחיל לכתוב, ומורים יכולים לעזור לפתוח את הגיליון
            עם כתבה ראשונה או טיוטה.
          </p>
        </div>
        {!mounted || loading ? (
          <div className="h-11 w-40 rounded-md bg-muted animate-pulse" />
        ) : (
          <Button
            size="lg"
            onClick={handleClick}
            className="w-full cursor-pointer gap-2 sm:w-auto"
          >
            <PenSquare className="h-5 w-5" />
            <span>{user ? "כתבו את הכתבה הראשונה" : "התחברו כדי להתחיל לכתוב"}</span>
          </Button>
        )}
      </div>
      {mounted && (
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      )}
    </>
  );
}
