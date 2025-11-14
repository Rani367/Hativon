import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from Vercel Blob Storage and other CDNs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Use modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Define responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize cumulative layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Enable unoptimized for faster local development
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Optimize bundle size with better code splitting
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      'react-markdown',
      'react-syntax-highlighter',
      'remark-gfm',
      'remark-math',
      'date-fns',
    ],
    // Enable optimistic client cache
    optimisticClientCache: true,
  },

  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable compression
  compress: true,

  // Optimize power consumption
  poweredByHeader: false,

  // Empty turbopack config to silence the warning
  // Turbopack handles most optimizations automatically
  turbopack: {},
};

export default nextConfig;
