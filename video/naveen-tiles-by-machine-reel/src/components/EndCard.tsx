import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';

/** Facts shown on the end card, all from naveentile.com. */
const STATS = [
  { big: '1983', small: 'making tiles since' },
  { big: '860 LAKH', small: 'sq ft a year' },
  { big: 'ISO 9001', small: 'certified quality' },
];

/** Payoff: line on the impact, official logo on a white card, facts, CTA. */
export const EndCard: React.FC<{ cta: string }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (delay: number, damping = 16) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 160 } });
  const l1 = s(0);
  const l2 = s(BEAT_FRAMES);
  const logo = s(2 * BEAT_FRAMES, 18);
  const ctaS = s(7 * BEAT_FRAMES, 14);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 7 * BEAT_FRAMES) * ((2 * Math.PI) / BEAT_FRAMES));

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,16,34,0.45) 0%, rgba(10,16,34,0.2) 40%, rgba(10,16,34,0.6) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <div style={{ fontFamily: theme.display, fontSize: 112, color: theme.white, lineHeight: 1.04, opacity: l1, transform: `translateY(${(1 - l1) * 50}px)`, textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          EVERY STEP.
        </div>
        <div style={{ fontFamily: theme.display, fontSize: 112, color: theme.white, lineHeight: 1.04, opacity: l2, transform: `translateY(${(1 - l2) * 50}px)`, textShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          BY <span style={{ color: theme.orange }}>MACHINE.</span>
        </div>

        <div
          style={{
            marginTop: 70,
            background: theme.white,
            borderRadius: 36,
            padding: '34px 56px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            opacity: logo,
            transform: `translateY(${(1 - logo) * 40}px) scale(${0.9 + 0.1 * logo})`,
          }}
        >
          <Img src={staticFile('brand/naveen-logo.png')} style={{ width: 560, height: 'auto', display: 'block' }} />
        </div>

        <div style={{ marginTop: 56, display: 'flex', gap: 18 }}>
          {STATS.map((st, i) => {
            const k = s(3 * BEAT_FRAMES + i * 6, 18);
            return (
              <div
                key={st.big}
                style={{
                  width: 262,
                  padding: '18px 10px',
                  borderRadius: 20,
                  background: 'rgba(8,14,30,0.6)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  textAlign: 'center',
                  opacity: k,
                  transform: `translateY(${(1 - k) * 24}px)`,
                }}
              >
                <div style={{ fontFamily: theme.display, fontSize: 56, color: theme.white, lineHeight: 1.05 }}>{st.big}</div>
                <div style={{ fontFamily: theme.body, fontWeight: 700, fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{st.small}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 64,
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
