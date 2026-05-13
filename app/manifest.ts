import type { MetadataRoute } from 'next';
import { getSiteName } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  const siteName = getSiteName();
  return {
    name: `${siteName} — K-Beauty & Skincare`,
    short_name: siteName,
    description: 'Shop authentic K-beauty, skincare, makeup, and haircare online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfbf9',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
