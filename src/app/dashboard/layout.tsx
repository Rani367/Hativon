import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { requireUser } from "@/lib/auth/guards";
import { studioCopy } from "@/lib/studio-copy";
// The editor shows articles in their published typography.
import "../(public)/public.css";
import "../studio.css";

export const metadata: Metadata = {
  title: studioCopy.nav.myArticles,
  robots: { index: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  return <StudioShell user={user}>{children}</StudioShell>;
}
