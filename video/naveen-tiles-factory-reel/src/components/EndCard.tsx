import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';

const SWOOSH = 'M 20 60 C 180 110, 520 110, 700 30';

/** Payoff: tagline on the impact, brand lockup a beat later, CTA last. */
export const EndCard: React.FC<{ logo?: string; cta: string }> = ({ logo, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (delay: number, damping = 16) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 160 } });
  const l1 = s(0);
  const l2 = s(BEAT_FRAMES);
  const brand = s(2 * BEAT_FRAMES, 20);
  const tag = s(2 * BEAT_FRAMES + 6, 20);
  const ctaS = s(4 * BEAT_FRAMES, 14);
  const swoosh = interpolate(frame, [2 * BEAT_FRAMES + 4, 2 * BEAT_FRAMES + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const path = evolvePath(swoosh, SWOOSH);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 4 * BEAT_FRAMES) * ((2 * Math.PI) / BEAT_FRAMES));

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(20,14,50,0.35) 0%, rgba(20,14,50,0.15) 40%, rgba(10,8,24,0.55) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 330 }}>
        <div style={{ fontFamily: theme.display, fontSize: 124, color: theme.white, lineHeight: 1.04, opacity: l1, transform: `translateY(${(1 - l1) * 50}px)`, textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          FROM EARTH
        </div>
        <div style={{ fontFamily: theme.display, fontSize: 124, color: theme.white, lineHeight: 1.04, opacity: l2, transform: `translateY(${(1 - l2) * 50}px)`, textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          TO YOUR <span style={{ color: theme.red }}>FLOOR.</span>
        </div>

        <div style={{ marginTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: brand, transform: `scale(${0.9 + 0.1 * brand})` }}>
          {logo ? (
            <Img src={staticFile(logo)} style={{ width: 640, height: 'auto' }} />
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  fontFamily: theme.wordmark,
                  fontWeight: 900,
                  fontStretch: '125%',
                  fontSize: 150,
                  letterSpacing: 10,
                  color: theme.white,
                  lineHeight: 1,
                  textShadow: '0 10px 40px rgba(62,44,142,0.8)',
                }}
              >
                NAVEEN
              </div>
              <svg width={720} height={120} viewBox="0 0 720 120" style={{ position: 'absolute', left: -40, top: 90 }}>
                <path d={SWOOSH} fill="none" stroke={theme.red} strokeWidth={12} strokeLinecap="round" strokeDasharray={path.strokeDasharray} strokeDashoffset={path.strokeDashoffset} />
              </svg>
            </div>
          )}
          <div style={{ marginTop: 64, fontFamily: theme.body, fontWeight: 800, fontSize: 36, letterSpacing: 9, color: theme.white, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
            CERAMIC &amp; VITRIFIED TILES
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: theme.body,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 6,
              color: theme.white,
              background: theme.red,
              padding: '8px 20px',
              borderRadius: 8,
              opacity: tag,
            }}
          >
            GVT · PGVT
          </div>
        </div>

        <div
          style={{
            marginTop: 90,
            opacity: ctaS,
            transform: `translateY(${(1 - ctaS) * 30}px) scale(${pulse})`,
            fontFamily: theme.body,
            fontWeight: 800,
            fontSize: 38,
            color: theme.indigo,
            background: theme.white,
            padding: '20px 40px',
            borderRadius: 999,
            boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
          }}
        >
          {cta}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
