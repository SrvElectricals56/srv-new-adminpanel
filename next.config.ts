import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
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
};

export default nextConfig;
