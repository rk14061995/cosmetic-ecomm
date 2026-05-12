import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

const STATIC_PATHS: MetadataRoute.Sitemap = [
  '',
  '/products',
  '/sale',
  '/mystery-boxes',
  '/bundles',
  '/quiz',
  '/blog',
  '/gift-cards',
  '/subscribe',
  '/affiliate',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
].map((path) => ({
  url: `${getSiteUrl()}${path || '/'}`,
  lastModified: new Date(),
  changeFrequency: path === '' ? 'daily' : 'weekly',
  priority: path === '' ? 1 : path === '/products' ? 0.95 : 0.7,
}));

async function fetchProductUrls(base: string): Promise<MetadataRoute.Sitemap> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return [];

  try {
    const res = await fetch(`${api.replace(/\/+$/, '')}/products?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = data.products || [];
    return products.map((p: { _id: string; updatedAt?: string }) => ({
      url: `${base}/products/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    return [];
  }
}

async function fetchBlogUrls(base: string): Promise<MetadataRoute.Sitemap> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return [];

  try {
    const res = await fetch(`${api.replace(/\/+$/, '')}/blog?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data.posts || [];
    return posts.map((post: { slug: string; updatedAt?: string }) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [productEntries, blogEntries] = await Promise.all([
    fetchProductUrls(base),
    fetchBlogUrls(base),
  ]);

  return [...STATIC_PATHS, ...productEntries, ...blogEntries];
}
