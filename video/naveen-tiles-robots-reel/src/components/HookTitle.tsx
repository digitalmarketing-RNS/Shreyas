import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';
import { scramble, typed } from '../hud';

/** Bar 1: the feed boots and the title decodes on the beats. */
export const HookTitle: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const robots = p(5, BEAT_FRAMES + 1);
  const robotsPop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 200 } });
  const fringe = (1 - robots) * 16;
  const naveen = spring({ frame: frame - 2 * BEAT_FRAMES, fps, config: { damping: 11, stiffness: 220 } });
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: 'absolute', left: 86, top: 262 }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: theme.amber, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          {typed('◢ NAVEEN // ROBOTICS FEED', p(0, 8))}
        </div>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 60, letterSpacing: 12, color: theme.white, marginTop: 26, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
          {typed('MEET THE', p(2, 9))}
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 290,
            lineHeight: 0.98,
            color: theme.white,
            marginTop: 6,
            opacity: frame >= 5 ? 1 : 0,
            transform: `scale(${0.85 + 0.15 * robotsPop})`,
            transformOrigin: 'left center',
            textShadow: `${-fringe}px 0 0 rgba(255,40,80,0.85), ${fringe}px 0 0 rgba(0,220,255,0.85), 0 10px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {scramble('ROBOTS', robots, frame, 'robots')}
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 150,
            lineHeight: 1,
            color: theme.orange,
            marginTop: 4,
            opacity: naveen,
            transform: `scale(${1.5 - 0.5 * naveen})`,
            transformOrigin: 'left center',
            textShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          OF NAVEEN
        </div>
        <div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: 'rgba(255,255,255,0.92)', marginTop: 22, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
          {typed('▸ TECHNOLOGY AT WORK', p(3 * BEAT_FRAMES - 2, 3 * BEAT_FRAMES + 8))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
