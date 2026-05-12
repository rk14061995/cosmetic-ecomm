import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Affiliate Program',
  description:
    'Partner with KosmeticX — earn commissions promoting authentic K-beauty and skincare. Join our affiliate program and grow with a trusted beauty brand.',
  path: '/affiliate',
});

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
