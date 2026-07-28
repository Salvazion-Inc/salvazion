import { ImageResponse } from 'next/og';
import { SEO } from '@/lib/seo/config';

export const alt = SEO.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Same visual as opengraph-image for Twitter/X card previews. */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #040404 0%, #0a120c 45%, #041a0c 100%)',
          padding: '56px 64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              border: '2px solid #8FD99A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8FD99A',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                color: '#8FD99A',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              SALVAZION
            </span>
            <span style={{ color: '#9BB0A0', fontSize: 18, marginTop: 4 }}>
              Faith · Family · Technology
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              color: '#F2F7F3',
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
              maxWidth: 980,
            }}
          >
            Make Salvation, Health and Freedom Great Again
          </div>
          <div
            style={{
              color: '#B8C9BC',
              fontSize: 26,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            One freemium App — Bible, devotionals, health, Freedom, community &
            $SALVAZION on Solana
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#8FD99A',
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <span>app.salvazion.org</span>
          <span style={{ color: '#9BB0A0', fontWeight: 500 }}>
            Free to start · Premium available
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
