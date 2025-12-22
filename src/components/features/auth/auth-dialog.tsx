'use client';

import { useState, useEffect } from 'react';
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { cn } from '@/lib/utils';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Reset animation state when dialog opens
  useEffect(() => {
    if (open) {
      setIsInitialRender(true);
      const timer = setTimeout(() => setIsInitialRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">ברוך הבא לחטיבון</DialogTitle>
          <DialogDescription className="text-center">
            התחבר או הרשם כדי לפרסם פוסטים
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <div className={cn(isInitialRender && "animate-fade-in-up animate-delay-2")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4 relative">
            <TabsContent
              value="login"
              forceMount
              className={cn(
                "transition-opacity duration-200",
                activeTab === 'login' ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              )}
            >
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent
              value="register"
              forceMount
              className={cn(
                "transition-opacity duration-200",
                activeTab === 'register' ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              )}
            >
              <RegisterForm onSuccess={handleSuccess} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
