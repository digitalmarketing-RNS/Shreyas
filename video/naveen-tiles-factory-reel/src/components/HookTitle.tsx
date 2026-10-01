import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES } from '../timeline';

const LINES: { text: string; accent?: boolean }[] = [
  { text: 'THIS TILE' },
  { text: 'WAS ONCE' },
  { text: 'A ROCK.', accent: true },
];

/** Opening hook: three lines land on the first three beats, then the whole
 *  block rushes toward camera into the drop. */
export const HookTitle: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [durationInFrames - 9, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 80%)',
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 180,
          transform: `scale(${1 + exit * 0.6})`,
          opacity: 1 - exit,
          filter: exit > 0 ? `blur(${exit * 14}px)` : undefined,
        }}
      >
        {LINES.map((line, i) => {
          const start = i * BEAT_FRAMES;
          const s = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 190, mass: 0.7 } });
          const visible = frame >= start;
          return (
            <div
              key={line.text}
              style={{
                opacity: visible ? Math.min(1, s * 1.4) : 0,
                transform: `translateY(${(1 - s) * 60}px) scale(${1.25 - 0.25 * s})`,
                filter: `blur(${(1 - s) * 10}px)`,
                marginTop: i === 0 ? 0 : 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: theme.display,
                  fontSize: line.accent ? 200 : 150,
                  lineHeight: 1.02,
                  color: theme.white,
                  letterSpacing: 2,
                  padding: line.accent ? '4px 30px 10px' : 0,
                  background: line.accent ? theme.red : 'transparent',
                  transform: line.accent ? 'rotate(-2.5deg)' : undefined,
                  textShadow: line.accent ? 'none' : '0 8px 40px rgba(0,0,0,0.55)',
                  boxShadow: line.accent ? '0 20px 60px rgba(227,38,61,0.45)' : undefined,
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
