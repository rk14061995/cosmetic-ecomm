import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import BlogArticleJsonLd from '@/components/seo/BlogArticleJsonLd';
import { blogPostDescription, getBlogPostForMeta } from '@/lib/fetch-blog-meta';
import { absoluteUrl, defaultOpenGraph, defaultTwitter, getSiteName } from '@/lib/seo';

type Props = { children: ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostForMeta(slug);
  if (!post) {
    return { title: 'Article', robots: { index: false, follow: true } };
  }

  const title = post.title;
  const description = blogPostDescription(post);
  const path = `/blog/${post.slug}`;
  const images = post.coverImage ? [{ url: post.coverImage, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: defaultOpenGraph({
      type: 'article',
      title: `${title} | ${getSiteName()}`,
      description,
      url: absoluteUrl(path),
      images,
    }),
    twitter: defaultTwitter({
      title: `${title} | ${getSiteName()}`,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    }),
  };
}

export default async function BlogPostLayout({ children, params }: Props) {
  const { slug } = await params;
  return (
    <>
      <BlogArticleJsonLd slug={slug} />
      {children}
    </>
  );
}
