import type { Metadata } from 'next';

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

export function getSiteName() {
  return (process.env.NEXT_PUBLIC_SITE_NAME || 'KosmeticX').trim() || 'KosmeticX';
}

export const SITE_TAGLINE = 'K-Beauty, Skincare & Cosmetics';

export const DEFAULT_DESCRIPTION =
  'Shop authentic K-beauty, skincare, makeup, and haircare at KosmeticX. Curated brands, mystery beauty boxes, bundles, and fast delivery across India.';

export const KEYWORDS = [
  'K-beauty',
  'Korean skincare',
  'cosmetics India',
  'skincare online',
  'makeup',
  'haircare',
  'beauty box',
  'mystery box cosmetics',
  'KosmeticX',
  'authentic beauty products',
];

export function absoluteUrl(path: string) {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function truncateMetaDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function stripHtmlToText(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildVerification(): Metadata['verification'] | undefined {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const yandex = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION?.trim();
  if (!google && !yandex) return undefined;
  const v: Metadata['verification'] = {};
  if (google) v.google = google;
  if (yandex) v.yandex = yandex;
  return v;
}

export function defaultOpenGraph(overrides?: Partial<Metadata['openGraph']>): Metadata['openGraph'] {
  const siteName = getSiteName();
  const url = getSiteUrl();
  return {
    type: 'website',
    locale: 'en_IN',
    alternateLocale: ['en_US'],
    siteName,
    url,
    title: `${siteName} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    ...overrides,
  };
}

export function defaultTwitter(overrides?: Partial<Metadata['twitter']>): Metadata['twitter'] {
  const siteName = getSiteName();
  return {
    card: 'summary_large_image',
    title: `${siteName} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    ...overrides,
  };
}

/** Static marketing / listing pages — canonical + OG + Twitter. */
export function sectionMetadata(opts: { title: string; description: string; path: string }): Metadata {
  const siteName = getSiteName();
  const { title, description, path } = opts;
  const url = absoluteUrl(path);
  const fullTitle = `${title} | ${siteName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...defaultOpenGraph(),
      title: fullTitle,
      description,
      url,
    },
    twitter: {
      ...defaultTwitter(),
      title: fullTitle,
      description,
    },
  };
}
