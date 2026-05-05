import { ReactNode } from "react";
import { LayoutClient } from "./layout-client";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <LayoutClient>{children}</LayoutClient>;
}
