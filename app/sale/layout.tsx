import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Sale & Offers',
  description:
    'Limited-time beauty deals on KosmeticX — discounts on skincare, makeup, K-beauty favorites, and bundles. Grab your glow for less while stock lasts.',
  path: '/sale',
});

export default function SaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
