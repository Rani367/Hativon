"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogIn } from "lucide-react";
import { logError } from "@/lib/logger";

type AuthState = "checking" | "authenticated" | "not-teacher" | "not-logged-in";

export default function AdminLoginPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (data.authenticated && data.isTeacher) {
          // Teachers get automatic admin access - redirect to dashboard
          setAuthState("authenticated");
          router.replace("/admin/dashboard");
          return;
        }

        if (data.authenticated) {
          // Logged in but not a teacher
          setAuthState("not-teacher");
        } else {
          // Not logged in at all
          setAuthState("not-logged-in");
        }
      } catch (error) {
        logError("Auth check failed:", error);
        setAuthState("not-logged-in");
      }
    }

    checkAuth();
  }, [router]);

  // Show loading state while checking OR while redirecting after authentication
  if (authState === "checking" || authState === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  // Show teacher login required message
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">גישה לפאנל הניהול</CardTitle>
          <CardDescription>
            {authState === "not-teacher"
              ? "רק מורים יכולים לגשת לפאנל הניהול"
              : "התחבר עם חשבון מורה כדי לגשת לפאנל הניהול"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authState === "not-teacher" ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                החשבון שלך אינו מסומן כחשבון מורה. פנה למנהל המערכת אם אתה מורה וזקוק לגישה.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    חזור לאתר
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                יש להתחבר עם חשבון מורה כדי לנהל את האתר.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/?login=true">
                  <Button className="w-full">
                    <LogIn className="h-4 w-4 me-2" />
                    התחבר
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    חזור לאתר
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
