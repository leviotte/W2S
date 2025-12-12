/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // REACT SETTINGS
  // ============================================================
  reactStrictMode: true, // ✅ Behouden van jouw originele setting

  // ============================================================
  // IMAGE OPTIMIZATION ⚡ (DIT LOST JE ERROR OP!)
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/wish2share4u.firebasestorage.app/**',
      },
      // Voorbereid voor toekomstige affiliate product afbeeldingen
      {
        protocol: 'https',
        hostname: 'images.bol.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
    ],
    // Optimale device sizes voor responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // WebP én AVIF voor maximale compressie
    formats: ['image/webp', 'image/avif'],
  },

  // ============================================================
  // PERFORMANCE OPTIMIZATIONS 🚀
  // ============================================================
  experimental: {
    // Optimized Package Imports = kleinere bundles!
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

  // Compiler optimizations
  compiler: {
    // Verwijder console.logs in production (behalve errors/warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
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
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      // Aggressive caching voor static assets
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
  // REDIRECTS (klaar voor je oude React routes)
  // ============================================================
  async redirects() {
    return [
      // Hier komen straks redirects van je oude React app
      // Bijvoorbeeld:
      // {
      //   source: '/events/:id',
      //   destination: '/event/:id',
      //   permanent: true,
      // },
    ];
  },

  // ============================================================
  // VERCEL OPTIMIZATIONS
  // ============================================================
  poweredByHeader: false, // Verwijdert 'X-Powered-By: Next.js' header

  // ============================================================
  // TYPESCRIPT & ESLINT
  // ============================================================
  typescript: {
    // Voor production: false houden!
    ignoreBuildErrors: false,
  },
  eslint: {
    // Voor production: false houden!
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;