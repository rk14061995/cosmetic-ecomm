import type { Metadata } from 'next';
import { sectionMetadata } from '@/lib/seo';

export const metadata: Metadata = sectionMetadata({
  title: 'Beauty Quiz',
  description:
    'Take the KosmeticX beauty quiz to discover skincare and makeup matched to your skin type, concerns, and goals — personalized picks in minutes.',
  path: '/quiz',
});

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
