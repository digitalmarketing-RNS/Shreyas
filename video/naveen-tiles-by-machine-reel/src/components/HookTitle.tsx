import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';

const TEASER = ['PRESS', 'FIRE', 'POLISH', 'PACK'];

/**
 * Three-bar opener:
 *  bar 1 - one word per beat over four teaser shots
 *  bar 2 - the title
 *  bar 3 - who makes it, over the factory gate
 */
export const HookTitle: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar = BEAT_FRAMES * 4;

  if (frame < bar) {
    const i = Math.floor(frame / BEAT_FRAMES);
    const f = frame - i * BEAT_FRAMES;
    const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 260, mass: 0.6 } });
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 140 }}>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 250,
            color: theme.white,
            letterSpacing: 6,
            transform: `scale(${1.35 - 0.35 * s})`,
            opacity: Math.min(1, s * 1.5),
            textShadow: '0 10px 50px rgba(0,0,0,0.65)',
          }}
        >
          {TEASER[i]}
          <span style={{ color: theme.orange }}>.</span>
        </div>
      </AbsoluteFill>
    );
  }

  if (frame < 2 * bar) {
    const f = frame - bar;
    const a = spring({ frame: f, fps, config: { damping: 16, stiffness: 170 } });
    const b = spring({ frame: f - BEAT_FRAMES, fps, config: { damping: 16, stiffness: 170 } });
    const c = spring({ frame: f - 2 * BEAT_FRAMES, fps, config: { damping: 18, stiffness: 150 } });
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 160 }}>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 85%)' }} />
        <div style={{ fontFamily: theme.body, fontWeight: 800, fontSize: 38, letterSpacing: 10, color: theme.white, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
          HOW A TILE IS MADE
        </div>
        <div style={{ fontFamily: theme.display, fontSize: 170, lineHeight: 1.0, color: theme.white, marginTop: 18, opacity: b, transform: `translateY(${(1 - b) * 50}px)`, textShadow: '0 10px 50px rgba(0,0,0,0.6)' }}>
          START TO FINISH
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: theme.display,
            fontSize: 118,
            color: theme.white,
            background: theme.orange,
            padding: '2px 30px 8px',
            transform: `rotate(-2deg) scale(${0.8 + 0.2 * c})`,
            opacity: c,
            boxShadow: '0 20px 60px rgba(240,100,30,0.45)',
          }}
        >
          BY MACHINE
        </div>
      </AbsoluteFill>
    );
  }

  const f = frame - 2 * bar;
  const a = spring({ frame: f, fps, config: { damping: 20, stiffness: 140 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', paddingLeft: theme.safe.left, paddingBottom: 560, opacity: 1 - exit }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        <div style={{ fontFamily: theme.body, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: theme.orange }}>INSIDE THE FACTORY OF</div>
        <div style={{ fontFamily: theme.display, fontSize: 104, lineHeight: 1.02, color: theme.white, marginTop: 8, textShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
          MURUDESHWAR
          <br />
          CERAMICS
        </div>
        <div style={{ fontFamily: theme.body, fontWeight: 700, fontSize: 36, color: theme.white, marginTop: 14 }}>makers of NAVEEN tiles</div>
      </div>
    </AbsoluteFill>
  );
};
