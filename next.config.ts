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
    // Optimized device sizes - fewer breakpoints = smaller HTML
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [32, 64, 128, 256],
    // Long cache TTL for images
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    // Enable unoptimized for faster local development
    unoptimized: process.env.NODE_ENV === "development",
    // Reduce quality slightly for faster loading (still looks great)
    qualities: [75, 85],
  },

  // Optimize bundle size with better code splitting
  experimental: {
    // Aggressive tree-shaking for all heavy packages
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
      "@radix-ui/react-tabs",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "react-markdown",
      "react-syntax-highlighter",
      "remark-gfm",
      "remark-math",
      "rehype-sanitize",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
    // Enable optimistic client cache for instant navigation
    optimisticClientCache: true,
    // Parallel compilation for faster builds
    webpackBuildWorker: true,
    // Inline CSS for faster first paint
    inlineCss: true,
  },

  // Enable React strict mode for better performance patterns
  reactStrictMode: true,

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

  // Security and cache headers
  async headers() {
    return [
      // Immutable cache for static assets (1 year)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Immutable cache for fonts
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Security headers for all routes
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
