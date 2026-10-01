import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { theme } from '../theme';
import { BEAT_FRAMES, END_STAGE, FPS, STAGE_SPANS, UNITS } from '../timeline';
import { cutJolt, unitAt } from '../hud';

const TOP = 200;
const BOTTOM = 1480;
const LEFT = 44;
const RIGHT = 1036;

const pad = (n: number) => String(n).padStart(2, '0');
const timecode = (f: number) => `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`;

const Corner: React.FC<{ x: number; y: number; dx: 1 | -1; dy: 1 | -1; len: number }> = ({ x, y, dx, dy, len }) => (
  <path
    d={`M ${x} ${y + dy * len} L ${x} ${y} L ${x + dx * len} ${y}`}
    fill="none"
    stroke="rgba(255,255,255,0.88)"
    strokeWidth={5}
    strokeLinecap="square"
  />
);

/**
 * The camera-feed chrome that stays up the whole reel: frame corners, REC +
 * timecode, the unit counter, a slow scan line and CRT lines. It jolts
 * sideways on every cut so the glitch transitions hit the overlay too.
 */
export const HudFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const boot = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const len = 30 + 50 * boot;
  const jolt = cutJolt(frame);
  const jx = jolt > 0 ? (random(`hj${frame}`) - 0.5) * 36 * jolt : 0;

  const unit = unitAt(frame);
  const counter =
    unit === 0 ? 'SCANNING…' : unit === -1 ? `${pad(UNITS)}/${pad(UNITS)} ACTIVE` : `UNIT ${pad(unit)}/${pad(UNITS)}`;
  const recOn = Math.floor(frame / BEAT_FRAMES) % 2 === 0;

  // scan line: one sweep per bar
  const bar = BEAT_FRAMES * 4;
  const sweep = (frame % bar) / bar;
  const scanY = TOP + (BOTTOM - TOP) * sweep;
  // the scan line bows out under the end card so it never crosses the logo
  const scanOn = interpolate(frame, [STAGE_SPANS[END_STAGE].from, STAGE_SPANS[END_STAGE].from + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ transform: `translateX(${jx}px)`, opacity: boot }}>
      {/* CRT lines */}
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0.13) 4px)',
        }}
      />
      {/* scan line + trail */}
      <div
        style={{
          position: 'absolute',
          left: LEFT,
          width: RIGHT - LEFT,
          top: scanY - 90,
          height: 90,
          opacity: scanOn,
          background: 'linear-gradient(180deg, rgba(240,100,30,0) 0%, rgba(240,100,30,0.10) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: LEFT,
          width: RIGHT - LEFT,
          top: scanY,
          height: 2,
          opacity: scanOn,
          background: 'rgba(255,178,63,0.55)',
          boxShadow: '0 0 14px rgba(255,140,40,0.9)',
        }}
      />

      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Corner x={LEFT} y={TOP} dx={1} dy={1} len={len} />
        <Corner x={RIGHT} y={TOP} dx={-1} dy={1} len={len} />
        <Corner x={LEFT} y={BOTTOM} dx={1} dy={-1} len={len} />
        <Corner x={RIGHT} y={BOTTOM} dx={-1} dy={-1} len={len} />
        {/* left ruler */}
        {Array.from({ length: 23 }, (_, i) => (
          <line
            key={i}
            x1={LEFT + 2}
            x2={LEFT + 2 + (i % 5 === 0 ? 22 : 11)}
            y1={TOP + 140 + i * 44}
            y2={TOP + 140 + i * 44}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={2}
          />
        ))}
      </svg>

      {/* status line */}
      <div
        style={{
          position: 'absolute',
          left: LEFT + 22,
          top: TOP + 14,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: theme.mono,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 2,
          color: 'rgba(255,255,255,0.92)',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}
      >
        <span style={{ width: 16, height: 16, borderRadius: 8, background: theme.live, opacity: recOn ? 1 : 0.15, boxShadow: '0 0 12px rgba(255,59,48,0.9)' }} />
        <span>REC</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{timecode(frame)}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 1080 - RIGHT + 22,
          top: TOP + 14,
          fontFamily: theme.mono,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 2,
          color: unit === -1 ? theme.amber : 'rgba(255,255,255,0.92)',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}
      >
        {counter}
      </div>
    </AbsoluteFill>
  );
};
