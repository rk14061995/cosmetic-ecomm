import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Mystery Beauty Boxes',
  description:
    'Surprise yourself with curated mystery beauty boxes from KosmeticX. Full-size and deluxe samples from trusted K-beauty and skincare brands.',
  path: '/mystery-boxes',
});

export default function MysteryBoxesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
