'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/auth-provider';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';

// Lazy load auth dialog
const AuthDialog = lazy(() =>
  import('../auth/auth-dialog').then((mod) => ({ default: mod.AuthDialog })),
);

// Preload function
const preloadAuthDialog = () => {
  import('../auth/auth-dialog');
};

export function EmptyPostsState() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // Preload auth dialog after initial page load (only when not logged in)
  useEffect(() => {
    if (user || loading) return;

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => {
        preloadAuthDialog();
        setIsReady(true);
      });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => {
        preloadAuthDialog();
        setIsReady(true);
      }, 1000);
      return () => clearTimeout(id);
    }
  }, [user, loading]);

  const handleClick = () => {
    if (!user) {
      // User is not logged in, show login dialog
      setAuthDialogOpen(true);
    } else {
      // User is logged in, redirect to new post page
      router.push('/dashboard/posts/new');
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            עדיין אין פוסטים
          </h2>
        </div>
        <Button
          size="lg"
          onClick={handleClick}
          className="gap-2 cursor-pointer"
        >
          <PenSquare className="h-5 w-5" />
          <span>צור פוסט ראשון</span>
        </Button>
      </div>
      {isReady && (
        <Suspense fallback={null}>
          <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </Suspense>
      )}
    </>
  );
}
