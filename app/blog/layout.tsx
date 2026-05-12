import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Beauty Blog',
  description:
    'Skincare tips, makeup tutorials, K-beauty trends, and product guides from KosmeticX. Learn how to build a routine that works for your skin.',
  path: '/blog',
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
