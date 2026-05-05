"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";
import { NavigationCacheRegistrar } from "./navigation-cache-registrar";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <NavigationCacheRegistrar />
      {children}
    </AuthProvider>
  );
}
