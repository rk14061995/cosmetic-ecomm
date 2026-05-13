/**
 * Mirrors backend `utils/marketingAcquisitionUrl.js` — keep in sync for form preview.
 * Used for first-touch signup attribution (`lib/attribution.ts`).
 */

export const MARKETING_CHANNELS = ['instagram', 'whatsapp', 'google_ads', 'web', 'other'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

const DEFAULT_MEDIUM: Record<MarketingChannel, string> = {
  instagram: 'social',
  whatsapp: 'social',
  google_ads: 'cpc',
  web: 'organic',
  other: 'referral',
};

function slugCampaign(label: string) {
  const s = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return s || 'campaign';
}

function hasAttributionSource(sp: URLSearchParams) {
  return !!(sp.get('utm_source') || sp.get('from') || sp.get('src') || sp.get('source'));
}

export function buildAcquisitionShareUrl(absUrl: string, channel: MarketingChannel, label: string): string {
  let u: URL;
  try {
    u = new URL(absUrl);
  } catch {
    return absUrl;
  }

  const defaultSource = String(channel || 'web').trim() || 'web';
  const defaultMedium = DEFAULT_MEDIUM[channel] || 'referral';

  if (!hasAttributionSource(u.searchParams)) {
    u.searchParams.set('utm_source', defaultSource);
  }
  if (!u.searchParams.get('utm_medium')) {
    u.searchParams.set('utm_medium', defaultMedium);
  }
  if (!u.searchParams.get('utm_campaign')) {
    u.searchParams.set('utm_campaign', slugCampaign(label));
  }

  return u.toString();
}
