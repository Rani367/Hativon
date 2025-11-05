import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Layout from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";

const heebo = localFont({
  src: [
    {
      path: "../../public/fonts/Heebo-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/Heebo-Light.ttf",
      weight: "300",
      style: "normal",
    },
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
    {
      path: "../../public/fonts/Heebo-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Heebo-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-heebo",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "חטיבון - עיתון בית הספר",
    template: `%s | חטיבון`,
  },
  description: "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
  openGraph: {
    title: "חטיבון - עיתון בית הספר",
    description: "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
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
    description: "עיתון התלמידים של חטיבת הביניים - חדשות, כתבות ועדכונים מבית הספר",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={heebo.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
