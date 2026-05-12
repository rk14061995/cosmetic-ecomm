import { cache } from 'react';

export type ProductMeta = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  images?: { url: string }[];
  category?: string;
  brand?: string;
  ratings?: number;
  numReviews?: number;
  updatedAt?: string;
};

async function fetchProductBySegment(segment: string): Promise<ProductMeta | null> {
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!api || !segment?.trim()) return null;

  const id = segment.trim();
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    /* keep id */
  }

  try {
    const res = await fetch(`${api}/products/${encodeURIComponent(decoded)}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const product = data.product as ProductMeta | undefined;
    return product && product._id ? product : null;
  } catch {
    return null;
  }
}

/** Deduped per request for generateMetadata + page + JSON-LD. */
export const getProductForMeta = cache(fetchProductBySegment);
