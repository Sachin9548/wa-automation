import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow images from external sources used in UI
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.shopify.com" },
      { protocol: "https", hostname: "*.myshopify.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "*.whatsapp.net" },
    ],
  },
  // Required for Vercel / Railway deployment
  output: "standalone",
};

export default nextConfig;
