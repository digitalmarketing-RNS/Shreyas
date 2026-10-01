import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { PROCESS_STEPS, STAGE_SPANS } from '../timeline';

/** "Rock -> tile" journey bar under the Reels header: one segment per step,
 *  the current one filling in real time. Frame is relative to the rail's own
 *  Sequence, which starts at step 1. */
export const ProgressRail: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame() + offset;
  const appear = interpolate(frame - offset, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const width = 1080 - theme.safe.left - theme.safe.left;
  const gap = 8;
  const seg = (width - gap * (PROCESS_STEPS - 1)) / PROCESS_STEPS;

  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <div
        style={{
          position: 'absolute',
          left: theme.safe.left,
          top: 196,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: theme.body,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 6,
          color: 'rgba(255,255,255,0.92)',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        <span>NAVEEN TILES</span>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: theme.red, display: 'inline-block' }} />
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>ROCK → TILE</span>
      </div>
      <div style={{ position: 'absolute', left: theme.safe.left, top: 246, display: 'flex', gap }}>
        {Array.from({ length: PROCESS_STEPS }, (_, i) => {
          const span = STAGE_SPANS.find((s) => s.stage === i + 1)!;
          const fill = interpolate(frame, [span.from, span.from + span.frames], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const active = fill > 0 && fill < 1;
          return (
            <div
              key={i}
              style={{
                width: seg,
                height: 8,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.28)',
                overflow: 'hidden',
                boxShadow: active ? '0 0 14px rgba(227,38,61,0.8)' : undefined,
              }}
            >
              <div style={{ width: `${fill * 100}%`, height: '100%', background: fill >= 1 ? theme.red : '#FF5A6B' }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
