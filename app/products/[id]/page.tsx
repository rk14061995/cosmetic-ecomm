import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ProductJsonLd from '@/components/seo/ProductJsonLd';
import { getProductForMeta } from '@/lib/fetch-product-meta';
import {
  absoluteUrl,
  defaultOpenGraph,
  defaultTwitter,
  getSiteName,
  stripHtmlToText,
  truncateMetaDescription,
} from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await params;
  const raw = p?.id;
  const segment = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!segment?.trim()) return { title: 'Product' };

  let id = segment.trim();
  try {
    id = decodeURIComponent(id);
  } catch {
    /* use trimmed segment */
  }

  const product = await getProductForMeta(id);
  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: true } };
  }

  const siteName = getSiteName();
  const description = truncateMetaDescription(
    stripHtmlToText(product.description) || `${product.name} — shop authentic beauty at ${siteName}.`
  );
  const path = `/products/${product.slug || product._id}`;
  const ogImage = product.images?.[0]?.url;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: defaultOpenGraph({
      title: `${product.name} | ${siteName}`,
      description,
      url: absoluteUrl(path),
      images: ogImage ? [{ url: ogImage, alt: product.name }] : undefined,
    }),
    twitter: defaultTwitter({
      title: `${product.name} | ${siteName}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    }),
  };
}

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

  const product = await getProductForMeta(id);

  return (
    <>
      {product ? <ProductJsonLd product={product} /> : null}
      <ProductDetailClient id={id} />
    </>
  );
}
