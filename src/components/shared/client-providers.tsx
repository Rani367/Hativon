"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";

interface ClientProvidersProps {
  children: ReactNode;
}

// Register service worker for offline caching
function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register after page load to not block initial render
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Service worker registration failed - not critical
        });
      });
    }
  }, []);
}

export function ClientProviders({ children }: ClientProvidersProps) {
  useServiceWorker();

  return <AuthProvider>{children}</AuthProvider>;
}
