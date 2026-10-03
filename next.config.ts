import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize packages that have ESM/CJS compatibility issues on Vercel serverless
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
