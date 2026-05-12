import { absoluteUrl, getSiteName, getSiteUrl, stripHtmlToText, truncateMetaDescription } from '@/lib/seo';
import { getBlogPostForMeta } from '@/lib/fetch-blog-meta';

type Props = { slug: string };

export default async function BlogArticleJsonLd({ slug }: Props) {
  const post = await getBlogPostForMeta(slug);
  if (!post) return null;

  const siteUrl = getSiteUrl();
  const siteName = getSiteName();
  const url = absoluteUrl(`/blog/${post.slug}`);
  const desc = truncateMetaDescription(stripHtmlToText(post.excerpt) || post.title);

  const json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: desc,
    image: post.coverImage ? [post.coverImage] : undefined,
    dateModified: post.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.svg') },
    },
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([json, breadcrumb]) }}
    />
  );
}
