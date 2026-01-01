import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable static optimization for now
  output: 'standalone',
};

export default nextConfig;