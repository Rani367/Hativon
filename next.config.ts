import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Public pages are static, so per-request script nonces aren't possible and
// inline scripts must stay allowed.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [32, 64, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    qualities: [75, 85],
  },

  reactStrictMode: true,
  poweredByHeader: false,

  // The merged May–June 2026 issue lives at /2026/june. This runs before the
  // page, whose permanentRedirect sends a doubled Location header on Vercel
  // ("/2026/june, /2026/june"), which browsers follow to a 404.
  async redirects() {
    return [
      { source: "/2026/may", destination: "/2026/june", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        // Retired service worker. Browsers must re-check it on every visit so
        // the self-removal script reaches everyone who installed the old one.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },

  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
