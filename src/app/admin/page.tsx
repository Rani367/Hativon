"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";
import { AdminPasswordGate } from "@/components/features/admin/admin-password-gate";

type AuthState = "checking" | "authenticated" | "needs-password";

export default function AdminLoginPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  // Check if already authenticated with admin password or is a teacher
  useEffect(() => {
    async function checkAuth() {
      try {
        // First check if user is a teacher
        const userResponse = await fetch("/api/check-auth");
        const userData = await userResponse.json();

        if (userData.authenticated && userData.isTeacher) {
          // Teachers get automatic admin access - redirect straight to dashboard
          setAuthState("authenticated");
          router.replace("/admin/dashboard");
          return;
        }

        // Check admin session cookie directly
        const adminResponse = await fetch("/api/admin/check-session");
        const adminData = await adminResponse.json();

        if (adminData.authenticated) {
          // Already authenticated with admin password, redirect to dashboard
          setAuthState("authenticated");
          router.replace("/admin/dashboard");
        } else {
          // Not authenticated, show password gate
          setAuthState("needs-password");
        }
      } catch (error) {
        logError("Auth check failed:", error);
        // On error, show password gate
        setAuthState("needs-password");
      }
    }

    checkAuth();
  }, [router]);

  // Show loading state while checking OR while redirecting after authentication
  // This prevents the password gate from flashing during redirect
  if (authState === "checking" || authState === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  // Show password gate only when we've confirmed user needs to authenticate
  return (
    <AdminPasswordGate
      onSuccess={() => {
        setAuthState("authenticated");
        router.push("/admin/dashboard");
      }}
    />
  );
}
