import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { PAGE_SCRIPT } from "@/lib/page-script";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

const serif = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-sans",
  display: "swap",
});

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script can add the dark class before React hydrates.
    <html
      lang="he"
      dir="rtl"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PAGE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
