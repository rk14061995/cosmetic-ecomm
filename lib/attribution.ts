/** First-touch marketing attribution (Instagram, WhatsApp, etc.). Stored until successful signup. Use admin “Acquisition links” for ready-made URLs with UTMs. */

const STORAGE_KEY = 'cosmetic_ecomm_first_touch_v1';

export type StoredAttribution = {
  source: string;
  medium: string;
  campaign: string;
  landingPath: string;
  capturedAt: string;
};

function normalizeSourceFromUrl(raw: string | null): string {
  if (!raw) return '';
  const s = raw.trim().toLowerCase();
  const aliases: Record<string, string> = {
    ig: 'instagram',
    insta: 'instagram',
    instagram: 'instagram',
    fb: 'facebook',
    meta: 'facebook',
    facebook: 'facebook',
    wa: 'whatsapp',
    whatsapp: 'whatsapp',
    yt: 'youtube',
    youtube: 'youtube',
    tw: 'twitter',
    twitter: 'twitter',
    x: 'twitter',
    tt: 'tiktok',
    tiktok: 'tiktok',
  };
  if (aliases[s]) return aliases[s];
  if (/^[a-z0-9][a-z0-9_-]{0,39}$/.test(s)) return s;
  return '';
}

function readQuerySource(params: URLSearchParams): string {
  const raw =
    params.get('utm_source') ||
    params.get('from') ||
    params.get('src') ||
    params.get('source') ||
    '';
  return normalizeSourceFromUrl(raw);
}

/** Call on app load. Persists once per browser until cleared after signup. Ignores `ref` (used for referral codes). */
export function captureFirstTouchAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const source = readQuerySource(params);
    if (!source) return;
    const medium = (params.get('utm_medium') || '').trim().slice(0, 80);
    const campaign = (params.get('utm_campaign') || '').trim().slice(0, 120);
    const landingPath = `${window.location.pathname}${window.location.search}`.slice(0, 500);
    const payload: StoredAttribution = {
      source,
      medium,
      campaign,
      landingPath,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // storage blocked or full
  }
}

export function getAttributionForRegister(): StoredAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;
    if (!parsed || typeof parsed.source !== 'string' || !parsed.source.trim()) return null;
    return {
      source: String(parsed.source).trim().toLowerCase().slice(0, 40),
      medium: String(parsed.medium || '').slice(0, 80),
      campaign: String(parsed.campaign || '').slice(0, 120),
      landingPath: String(parsed.landingPath || '').slice(0, 500),
      capturedAt: typeof parsed.capturedAt === 'string' ? parsed.capturedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearStoredAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
