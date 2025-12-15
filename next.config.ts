// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ============================================================
  // REACT SETTINGS
  // ============================================================
  reactStrictMode: true,

  // ============================================================
  // IMAGE OPTIMIZATION ⚡
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/wish2share4u.firebasestorage.app/**',
      },
      {
        protocol: 'https',
        hostname: 'images.bol.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },

  // ============================================================
  // PERFORMANCE OPTIMIZATIONS 🚀
  // ============================================================
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'date-fns',
      'react-hook-form',
      'zod',
    ],
  },

  // ============================================================
  // COMPILER OPTIMIZATIONS
  // ============================================================
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // ============================================================
  // SECURITY & PERFORMANCE HEADERS 🔒
  // ============================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ============================================================
  // REDIRECTS
  // ============================================================
  async redirects() {
    return [];
  },

  // ============================================================
  // VERCEL OPTIMIZATIONS
  // ============================================================
  poweredByHeader: false,

  // ============================================================
  // TYPESCRIPT (GEEN ESLINT KEY!)
  // ============================================================
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;