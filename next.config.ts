import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Allow cross-origin dev access (mobile/network devices)
  allowedDevOrigins: ['192.168.29.8', '172.17.240.1', '10.121.152.231', '10.255.222.231'],
  // Allow images from external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "srvelectricals.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // ── Chunk splitting: each lazy-loaded page gets its own small bundle ──────
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20_000,
          maxSize: 200_000,
          cacheGroups: {
            // Vendor libs (react, lucide, etc.) in one shared chunk
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
            // Admin page components each get their own chunk
            adminPages: {
              test: /[\\/]src[\\/]components[\\/]/,
              name(module: { context?: string }) {
                const match = module.context?.match(
                  /[\\/]components[\\/]([^\\/]+)/
                );
                return match ? `page-${match[1].toLowerCase()}` : 'page-misc';
              },
              chunks: 'async',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
