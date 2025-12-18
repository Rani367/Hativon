'use client';

import { ReactNode } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
