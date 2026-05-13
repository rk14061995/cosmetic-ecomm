import { absoluteUrl, getSiteName, getSiteUrl } from '@/lib/seo';

export default function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const name = getSiteName();
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
    logo: absoluteUrl('/favicon.svg'),
    sameAs: [] as string[],
  };
  const sameAs = process.env.NEXT_PUBLIC_SOCIAL_PROFILES?.split(',').map((s) => s.trim()).filter(Boolean);
  if (sameAs?.length) org.sameAs = sameAs;

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteUrl,
    publisher: { '@type': 'Organization', name, url: siteUrl },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([org, website]),
      }}
    />
  );
}
