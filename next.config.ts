import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from Vercel Blob Storage and other CDNs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
    ],
    // Use modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    // Define responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize cumulative layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Enable unoptimized for faster local development
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Optimize bundle size with better code splitting
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
      "react-markdown",
      "react-syntax-highlighter",
      "remark-gfm",
      "remark-math",
      "date-fns",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "framer-motion",
    ],
    // Enable optimistic client cache
    optimisticClientCache: true,
    // Speed up builds with parallel compilation
    webpackBuildWorker: true,
  },

  // Skip type checking during build (done locally via pre-deploy)
  // Note: ESLint is not run during Next.js 16 builds (removed in v16)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Production optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Enable compression
  compress: true,

  // Optimize power consumption
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Note: 'unsafe-inline' for scripts is required by Next.js for inline script hydration
            // Consider using nonces in a custom Document if stricter CSP is needed
            // 'unsafe-eval' has been removed for security - if issues arise, check for
            // libraries that require eval and consider alternatives
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.vercel-storage.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Set explicit turbopack root to silence workspace detection warning
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
