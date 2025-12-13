import { ReactNode } from "react";
import { getCachedArchiveMonths } from "@/lib/posts/cached-queries";
import { LayoutClient } from "./layout-client";

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  // Fetch archives on the server with caching - instant loading
  const archives = await getCachedArchiveMonths();

  return <LayoutClient archives={archives}>{children}</LayoutClient>;
}
