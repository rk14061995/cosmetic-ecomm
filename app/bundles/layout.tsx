import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Beauty Bundles',
  description:
    'Save more with curated skincare and makeup bundles on KosmeticX. Routine sets, gift-ready kits, and K-beauty combos picked by experts.',
  path: '/bundles',
});

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
