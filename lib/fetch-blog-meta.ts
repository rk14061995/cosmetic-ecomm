import { cache } from 'react';
import { stripHtmlToText, truncateMetaDescription } from '@/lib/seo';

export type BlogPostMeta = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  updatedAt?: string;
  published?: boolean;
};

async function fetchPostBySlug(slug: string): Promise<BlogPostMeta | null> {
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!api || !slug?.trim()) return null;

  try {
    const res = await fetch(`${api}/blog/${encodeURIComponent(slug.trim())}`, {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const post = data.post as BlogPostMeta | undefined;
    if (!post?.title || !post.slug) return null;
    return post;
  } catch {
    return null;
  }
}

export const getBlogPostForMeta = cache(fetchPostBySlug);

export function blogPostDescription(post: BlogPostMeta): string {
  const raw = post.excerpt || '';
  const plain = stripHtmlToText(raw);
  return truncateMetaDescription(plain || post.title);
}
