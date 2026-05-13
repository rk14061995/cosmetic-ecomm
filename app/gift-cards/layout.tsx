import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Gift Cards',
  description:
    'Give the gift of glow with KosmeticX digital gift cards. Perfect for birthdays, holidays, and beauty lovers who love to choose their own favorites.',
  path: '/gift-cards',
});

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
