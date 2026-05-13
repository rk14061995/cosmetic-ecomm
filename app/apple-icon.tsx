import { ImageResponse } from 'next/og';
import { getSiteName } from '@/lib/seo';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const letter = getSiteName().charAt(0).toUpperCase() || 'K';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #22d3ee 100%)',
          color: '#ffffff',
          fontSize: 112,
          fontWeight: 800,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {letter}
      </div>
    ),
    { ...size }
  );
}
