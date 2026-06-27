import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow images from external sources used in UI
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Required for Vercel / Railway deployment
  output: "standalone",
};

export default nextConfig;
