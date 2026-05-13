import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Pin workspace root when multiple lockfiles exist (avoids Turbopack picking the wrong tree). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  async headers() {
    return [
      {
        source: '/favicon.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: false },
    ];
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinaryLoader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'example.com' },
    ],
  },
};

export default nextConfig;
