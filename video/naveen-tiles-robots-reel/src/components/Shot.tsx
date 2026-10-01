import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { ShotPlan } from '../timeline';

/** Extra zoom on the whole picture so the impact shake never shows an edge. */
export const OUTER_SCALE = 1.04;

/**
 * Scale applied to the picture `sinceCut` frames after the cut into `shot`:
 * a slow Ken Burns drift (alternating in/out) times a punch-in on the cut.
 * The HUD uses the same numbers so its target boxes stay glued to the robots.
 */
export const shotScale = (shot: ShotPlan, sinceCut: number): number => {
  const length = shot.inHalf + shot.frames + shot.outHalf;
  const local = sinceCut + shot.inHalf;
  const zoomIn = shot.index % 2 === 0;
  const drift = interpolate(local, [0, length], zoomIn ? [1.0, 1.06] : [1.06, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const punch = interpolate(sinceCut, [0, 7], [1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return drift * punch * OUTER_SCALE;
};

/** One clip on the timeline. `look="end"` blurs and darkens it under the end card. */
export const Shot: React.FC<{ shot: ShotPlan; look?: 'end' }> = ({ shot, look }) => {
  const frame = useCurrentFrame();
  const sinceCut = frame - shot.inHalf;

  let filter: string | undefined;
  if (look === 'end') {
    const k = interpolate(sinceCut, [6, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    filter = `blur(${12 * k}px) brightness(${1 - 0.55 * k}) saturate(${1 - 0.2 * k})`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${shotScale(shot, sinceCut) / OUTER_SCALE})`, filter }}>
        <OffthreadVideo
          src={staticFile(shot.file)}
          startFrom={shot.startFrom}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
