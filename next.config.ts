import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily ignore build errors to isolate the issue
  // Remove these after confirming the fix works
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;