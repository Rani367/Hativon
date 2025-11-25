"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";

export default function AdminLoginPage() {
  const router = useRouter();

  // Check if already authenticated with admin password, otherwise redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        // Always redirect to dashboard - if authenticated goes straight to dashboard,
        // if not authenticated the dashboard will show the admin password gate
        router.push("/admin/dashboard");
      } catch (error) {
        logError("Auth check failed:", error);
        // On error, still redirect to dashboard to show password gate
        router.push("/admin/dashboard");
      }
    }

    checkAuth();
  }, [router]);

  return null;
}
