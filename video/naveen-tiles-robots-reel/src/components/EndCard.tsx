import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';
import { typed } from '../hud';

/** Payoff: TECHNOLOGY AT WORK., the official logo on a white card, CTA. */
export const EndCard: React.FC<{ cta: string }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (delay: number, damping = 14) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 170 } });
  const l1 = s(3);
  const l2 = s(BEAT_FRAMES, 11);
  const logo = s(2 * BEAT_FRAMES + 4, 18);
  const line = s(3 * BEAT_FRAMES + 3, 18);
  const ctaS = s(4 * BEAT_FRAMES, 13);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 4 * BEAT_FRAMES) * ((2 * Math.PI) / BEAT_FRAMES));
  const status = interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(8,14,32,0.15) 0%, rgba(8,14,32,0.55) 75%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 318 }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: theme.amber, height: 40, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          {typed('◢ ALL UNITS ACTIVE', status)}
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 176,
            lineHeight: 1.0,
            color: theme.white,
            marginTop: 18,
            opacity: l1,
            transform: `scale(${1.25 - 0.25 * l1})`,
            textShadow: '0 10px 44px rgba(0,0,0,0.55)',
          }}
        >
          TECHNOLOGY
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 200,
            lineHeight: 1.0,
            color: theme.orange,
            opacity: l2,
            transform: `scale(${1.4 - 0.4 * l2})`,
            textShadow: '0 10px 44px rgba(0,0,0,0.55)',
          }}
        >
          AT WORK.
        </div>

        <div
          style={{
            marginTop: 54,
            background: theme.white,
            borderRadius: 34,
            padding: '30px 52px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            opacity: logo,
            transform: `translateY(${(1 - logo) * 40}px) scale(${0.9 + 0.1 * logo})`,
          }}
        >
          <Img src={staticFile('brand/naveen-logo.png')} style={{ width: 500, height: 'auto', display: 'block' }} />
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: theme.body,
            fontWeight: 700,
            fontSize: 38,
            color: 'rgba(255,255,255,0.95)',
            opacity: line,
            transform: `translateY(${(1 - line) * 20}px)`,
            textShadow: '0 2px 14px rgba(0,0,0,0.7)',
          }}
        >
          Precision engineered · Since 1983
        </div>

        <div
          style={{
            marginTop: 40,
            opacity: ctaS,
            transform: `translateY(${(1 - ctaS) * 30}px) scale(${pulse})`,
            fontFamily: theme.body,
            fontWeight: 800,
            fontSize: 38,
            color: theme.white,
            background: theme.orange,
            padding: '20px 44px',
            borderRadius: 999,
            boxShadow: '0 16px 50px rgba(240,100,30,0.45)',
          }}
        >
          {cta}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
