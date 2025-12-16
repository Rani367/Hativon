import { ReactNode, Suspense } from "react";
import { getCachedArchiveMonths } from "@/lib/posts/cached-queries";
import { LayoutClient } from "./layout-client";

interface LayoutProps {
  children: ReactNode;
}

// Async component for fetching archives - can be streamed
async function ArchivesProvider({ children }: { children: ReactNode }) {
  const archives = await getCachedArchiveMonths();
  return <LayoutClient archives={archives}>{children}</LayoutClient>;
}

// Fallback layout that renders immediately without archives
function LayoutFallback({ children }: { children: ReactNode }) {
  return <LayoutClient archives={[]}>{children}</LayoutClient>;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
      <ArchivesProvider>{children}</ArchivesProvider>
    </Suspense>
  );
}
