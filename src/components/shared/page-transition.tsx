"use client";

import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  // Simple CSS-based fade transition - faster than Framer Motion
  return (
    <div className="animate-fade-in will-animate">{children}</div>
  );
}
