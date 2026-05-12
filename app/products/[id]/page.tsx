import { redirect } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const p = await params;
  const raw = p?.id;
  const segment = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!segment?.trim()) redirect('/products');

  let id = segment.trim();
  try {
    id = decodeURIComponent(id);
  } catch {
    /* use trimmed segment */
  }

  return <ProductDetailClient id={id} />;
}
