import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA mobile-first Bénin :
 * - NetworkFirst pages avec timeout court (réseau lent → cache immédiat)
 * - Cache images / static / brand agressif
 * - Fallback document → /offline
 */
const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_PWA_DEV !== "1",
  register: true,
  customWorkerSrc: "worker",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    navigateFallbackDenylist: [/^\/api\//, /^\/admin/, /^\/auth\//],
    runtimeCaching: [
      {
        // Pages HTML — timeout court pour ressenti rapide sur 3G
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        urlPattern: ({ request }: any) => request?.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-shell",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 48,
            maxAgeSeconds: 60 * 60 * 24 * 3,
          },
        },
      },
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "unsplash-images",
          expiration: {
            maxEntries: 96,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-images",
          expiration: {
            maxEntries: 96,
            maxAgeSeconds: 60 * 60 * 24 * 14,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: {
            maxEntries: 96,
            maxAgeSeconds: 60 * 60 * 24 * 14,
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 160,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /\/(icons|brand|favicon)\//i,
        handler: "CacheFirst",
        options: {
          // bump name = invalide l’ancien cache (ex. ancien C bleu)
          cacheName: "brand-icons-c2",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 90,
          },
        },
      },
      {
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1440],
    imageSizes: [48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "gsap", "@gsap/react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, immutable",
          },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
