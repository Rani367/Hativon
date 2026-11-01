import type { Metadata } from "next";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: copy.site.title, template: `%s | ${SITE_NAME}` },
  description: copy.site.description,
  openGraph: {
    title: copy.site.title,
    description: copy.site.description,
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
