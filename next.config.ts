import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from any school's domain (for student photos, logos)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
  // Suppress hydration warnings from PrimeReact
  reactStrictMode: true,
};

export default nextConfig;
