import { absoluteUrl, getSiteName, getSiteUrl, stripHtmlToText, truncateMetaDescription } from '@/lib/seo';
import type { ProductMeta } from '@/lib/fetch-product-meta';

type Props = { product: ProductMeta };

export default function ProductJsonLd({ product }: Props) {
  const siteUrl = getSiteUrl();
  const path = `/products/${product.slug || product._id}`;
  const url = absoluteUrl(path);
  const img = product.images?.[0]?.url;
  const desc = truncateMetaDescription(
    stripHtmlToText(product.description) || `${product.name} — ${getSiteName()}`
  );
  const price = product.discountPrice ?? product.price;
  const offers =
    typeof price === 'number'
      ? {
          '@type': 'Offer',
          url,
          priceCurrency: 'INR',
          price: String(price),
          availability: 'https://schema.org/InStock',
        }
      : undefined;

  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: desc,
    image: img ? [img] : undefined,
    sku: product._id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.category,
    url,
    offers,
    aggregateRating:
      product.ratings != null && product.numReviews != null && product.numReviews > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: String(product.ratings),
            reviewCount: String(product.numReviews),
          }
        : undefined,
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Products', item: absoluteUrl('/products') },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([json, breadcrumb]) }}
    />
  );
}
