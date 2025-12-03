import { PageTransition } from "@/components/shared/page-transition";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
