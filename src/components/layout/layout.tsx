import { ReactNode, Suspense } from "react";
import { getCachedArchiveMonths } from "@/lib/posts/cached-queries";
import { getDefaultMonthWithFallback } from "@/lib/settings";
import { getCurrentMonthYear } from "@/lib/date/months";
import { LayoutClient } from "./layout-client";

interface LayoutProps {
  children: ReactNode;
}

// Async component for fetching archives and default month - can be streamed
async function ArchivesProvider({ children }: { children: ReactNode }) {
  const [archives, defaultMonth] = await Promise.all([
    getCachedArchiveMonths(),
    getDefaultMonthWithFallback(),
  ]);
  return (
    <LayoutClient archives={archives} defaultMonth={defaultMonth}>
      {children}
    </LayoutClient>
  );
}

// Fallback layout that renders immediately without archives
// Uses current month as default until async data loads
function LayoutFallback({ children }: { children: ReactNode }) {
  const fallbackMonth = getCurrentMonthYear();
  return (
    <LayoutClient archives={[]} defaultMonth={fallbackMonth}>
      {children}
    </LayoutClient>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
      <ArchivesProvider>{children}</ArchivesProvider>
    </Suspense>
  );
}
