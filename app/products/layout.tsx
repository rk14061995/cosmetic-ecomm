import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Shop Skincare & Makeup',
  description:
    'Browse KosmeticX — K-beauty, skincare, makeup, and haircare. Filter by brand, category, and price. Authentic products with reviews and fast delivery.',
  path: '/products',
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
