import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { ShotPlan } from '../timeline';

/**
 * One clip on the timeline. Adds a slow Ken Burns drift (alternating in/out so
 * consecutive shots don't feel samey) and a quick punch-in on hard cuts so
 * every cut lands with the beat.
 */
export const Shot: React.FC<{ shot: ShotPlan; look?: 'end' }> = ({ shot, look }) => {
  const frame = useCurrentFrame();
  const length = shot.inHalf + shot.frames + shot.outHalf;
  const sinceCut = frame - shot.inHalf;

  const zoomIn = shot.index % 2 === 0;
  const drift = interpolate(frame, [0, length], zoomIn ? [1.03, 1.1] : [1.1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const punch =
    shot.inHalf === 0
      ? interpolate(sinceCut, [0, 7], [1.08, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  let filter: string | undefined;
  if (look === 'end') {
    const k = interpolate(sinceCut, [8, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    filter = `blur(${10 * k}px) brightness(${1 - 0.5 * k}) saturate(${1 + 0.1 * k})`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${drift * punch})`, filter }}>
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
