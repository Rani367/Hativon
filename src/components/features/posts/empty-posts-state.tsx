'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/auth-provider';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '../auth/auth-dialog';
import { PenSquare } from 'lucide-react';

export function EmptyPostsState() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const router = useRouter();

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
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
