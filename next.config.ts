import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    staticGenerationMaxConcurrency: 1,
    turbopackMemoryLimit: 1024 * 1024 * 1024, // Giới hạn 1GB RAM cho Turbopack
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'purecatamphetamine.github.io',
      },
    ],
  },
};

export default nextConfig;
