import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Beauty Subscription',
  description:
    'Subscribe to monthly beauty boxes and member perks on KosmeticX. New K-beauty and skincare discoveries delivered on your schedule.',
  path: '/subscribe',
});

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
