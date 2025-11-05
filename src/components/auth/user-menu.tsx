'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthDialog } from './auth-dialog';
import { User, LogOut, FileText, LayoutDashboard } from 'lucide-react';

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={() => setAuthDialogOpen(true)}
        >
          התחבר
        </Button>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span>{user.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'admin' ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard" className="cursor-pointer">
              <LayoutDashboard className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              <span>לוח בקרה מנהל</span>
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <LayoutDashboard className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              <span>הפוסטים שלי</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={user.role === 'admin' ? '/admin/posts/new' : '/dashboard/posts/new'} className="cursor-pointer">
            <FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            <span>פוסט חדש</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
          <LogOut className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          <span>התנתק</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
