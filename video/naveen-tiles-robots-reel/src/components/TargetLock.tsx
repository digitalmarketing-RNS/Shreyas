import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { ShotPlan } from '../timeline';
import { lerpRect, roiAt, typed, type Rect } from '../hud';

const START: Rect = { x: 70, y: 300, w: 940, h: 1150 };

/**
 * Scanning brackets: they open wide on the cut, snap onto the robot, turn
 * orange with a pulse when locked, then track it for the rest of the shot.
 */
export const TargetLock: React.FC<{ shot: ShotPlan; label: string; lockAt?: number }> = ({ shot, label, lockAt = 13 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const target = roiAt(shot, frame);
  if (!target) return null;

  const acquire = spring({ frame: frame - (lockAt - 12), fps, config: { damping: 15, stiffness: 140 } });
  const r = lerpRect(START, target, Math.min(1, acquire));
  const locked = frame >= lockAt;
  const appear = interpolate(frame, [lockAt - 12, lockAt - 9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tail = shot.frames - frame;
  const fadeOut = interpolate(tail, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const color = locked ? theme.orange : 'rgba(255,255,255,0.9)';
  const len = Math.max(26, Math.min(70, Math.min(r.w, r.h) * 0.2));
  const sw = 6;

  // lock pulse: an outline that expands and fades
  const pulseT = frame - lockAt;
  const pulse = pulseT >= 0 && pulseT < 10 ? pulseT / 10 : -1;

  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  // keep the chip clear of the name tag / readout panel in the top third
  const chipBelow = r.y - 52 < 730;
  const chipY = chipBelow ? r.y + r.h + 14 : r.y - 52;
  const coords = `X ${(cx / 1080).toFixed(2)} Y ${(cy / 1920).toFixed(2)}`;
  const status = !locked ? 'ACQUIRING…' : frame < lockAt + 14 ? '◉ TARGET LOCKED' : `◉ ${label}`;
  const since = frame < lockAt + 14 ? frame - lockAt : frame - lockAt - 14;
  const chipType = locked ? interpolate(since, [0, 6], [0.25, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;

  return (
    <AbsoluteFill style={{ opacity: appear * fadeOut }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="square" style={{ filter: locked ? 'drop-shadow(0 0 8px rgba(240,100,30,0.8))' : 'drop-shadow(0 0 6px rgba(0,0,0,0.6))' }}>
          <path d={`M ${r.x} ${r.y + len} L ${r.x} ${r.y} L ${r.x + len} ${r.y}`} />
          <path d={`M ${r.x + r.w - len} ${r.y} L ${r.x + r.w} ${r.y} L ${r.x + r.w} ${r.y + len}`} />
          <path d={`M ${r.x} ${r.y + r.h - len} L ${r.x} ${r.y + r.h} L ${r.x + len} ${r.y + r.h}`} />
          <path d={`M ${r.x + r.w - len} ${r.y + r.h} L ${r.x + r.w} ${r.y + r.h} L ${r.x + r.w} ${r.y + r.h - len}`} />
        </g>
        {/* thin full outline once locked */}
        {locked ? <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(240,100,30,0.06)" stroke="rgba(240,100,30,0.45)" strokeWidth={1.5} /> : null}
        {/* edge ticks + centre cross */}
        <g stroke={color} strokeWidth={3} opacity={0.9}>
          <line x1={cx} y1={r.y - 12} x2={cx} y2={r.y + 8} />
          <line x1={cx} y1={r.y + r.h - 8} x2={cx} y2={r.y + r.h + 12} />
          <line x1={r.x - 12} y1={cy} x2={r.x + 8} y2={cy} />
          <line x1={r.x + r.w - 8} y1={cy} x2={r.x + r.w + 12} y2={cy} />
          <line x1={cx - 16} y1={cy} x2={cx - 6} y2={cy} />
          <line x1={cx + 6} y1={cy} x2={cx + 16} y2={cy} />
          <line x1={cx} y1={cy - 16} x2={cx} y2={cy - 6} />
          <line x1={cx} y1={cy + 6} x2={cx} y2={cy + 16} />
        </g>
        {pulse >= 0 ? (
          <rect
            x={r.x - 40 * pulse}
            y={r.y - 40 * pulse}
            width={r.w + 80 * pulse}
            height={r.h + 80 * pulse}
            fill="none"
            stroke={theme.amber}
            strokeWidth={4}
            opacity={1 - pulse}
          />
        ) : null}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: Math.max(56, Math.min(r.x, 1024 - 360)),
          top: chipY,
          fontFamily: theme.mono,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: 2,
          background: locked ? theme.orange : 'rgba(255,255,255,0.92)',
          color: locked ? theme.white : theme.ink,
          padding: '6px 12px',
          whiteSpace: 'nowrap',
        }}
      >
        {typed(status, chipType)}
      </div>
      {locked ? (
        <div
          style={{
            position: 'absolute',
            left: r.x + r.w - 260,
            width: 246,
            top: r.y + r.h - 40,
            textAlign: 'right',
            fontFamily: theme.mono,
            fontWeight: 600,
            fontSize: 20,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {coords}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
