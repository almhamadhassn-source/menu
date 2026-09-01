import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  // Server Actions default to a 1MB request body cap — too small for the welcome-video upload
  // in src/lib/actions.ts (updateRestaurant). Logo/item images stay well under this either way.
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
}

export default nextConfig
