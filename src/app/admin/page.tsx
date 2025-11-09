"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  // Check if already authenticated with admin password
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (data.isAdmin) {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    }

    checkAuth();
  }, [router]);

  // Redirect to dashboard which will show the admin password gate
  useEffect(() => {
    router.push("/admin/dashboard");
  }, [router]);

  return null;
}
