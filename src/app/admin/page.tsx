"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";
import { AdminPasswordGate } from "@/components/features/admin/admin-password-gate";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if already authenticated with admin password
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (data.isAdmin) {
          // Already authenticated, redirect to dashboard
          router.push("/admin/dashboard");
        } else {
          // Not authenticated, show password gate
          setIsAdmin(false);
          setChecking(false);
        }
      } catch (error) {
        logError("Auth check failed:", error);
        // On error, show password gate
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  // Show loading state while checking
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAdmin) {
    return (
      <AdminPasswordGate
        onSuccess={() => {
          setIsAdmin(true);
          router.push("/admin/dashboard");
        }}
      />
    );
  }

  return null;
}
