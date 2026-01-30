import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_API_URL: 'https://honeypotscan-api.teycircoder4.workers.dev',
  },
};

export default nextConfig;
