import { ImageResponse } from 'next/og';
import { getSiteName } from '@/lib/seo';

export const runtime = 'edge';
export const alt = 'KosmeticX — K-Beauty & Skincare';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  const name = getSiteName();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #06b6d4 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            borderRadius: 32,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 34,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              textAlign: 'center',
            }}
          >
            K-Beauty · Skincare · Cosmetics
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
