import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Layout from "@/components/layout/layout";
import { ClientProviders } from "@/components/shared/client-providers";

// Optimized font loading - only load what's needed, with aggressive preloading
const heebo = localFont({
  src: [
    {
      path: "../../public/fonts/Heebo-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Heebo-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Heebo-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-heebo",
  display: "swap", // Show text immediately with fallback, swap when loaded
  preload: true, // Preload for fastest loading
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
  adjustFontFallback: "Arial", // Reduce layout shift with font metrics adjustment
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "חטיבון",
  title: {
    default: "חטיבון - עיתון בית הספר",
    template: `%s | חטיבון`,
  },
  description:
    "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
  openGraph: {
    title: "חטיבון - עיתון בית הספר",
    description:
      "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
    url: siteUrl,
    siteName: "חטיבון",
    images: [
      {
        url: `${siteUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "חטיבון - עיתון בית הספר",
      },
    ],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "חטיבון - עיתון בית הספר",
    description:
      "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
    images: [`${siteUrl}/opengraph-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteUrl}/site.webmanifest`,
};

export const viewport: Viewport = {
  themeColor: "white",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Structured data for Google Search - controls site name in results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "חטיבון",
              alternateName: "Hativon",
              url: siteUrl,
              description:
                "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
              inLanguage: "he",
              publisher: {
                "@type": "Organization",
                name: "חטיבון",
                url: siteUrl,
              },
            }),
          }}
        />
        {/* Preconnect to external resources for faster loading */}
        <link
          rel="preconnect"
          href="https://hqsluqjwqsbrbrz6.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for image CDN */}
        <link
          rel="dns-prefetch"
          href="https://hqsluqjwqsbrbrz6.public.blob.vercel-storage.com"
        />
        {/* Preload critical above-the-fold image if exists */}
        <link
          rel="preload"
          as="image"
          href="/main.jpg"
          type="image/jpeg"
          fetchPriority="high"
        />
      </head>
      <body className={heebo.className}>
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
