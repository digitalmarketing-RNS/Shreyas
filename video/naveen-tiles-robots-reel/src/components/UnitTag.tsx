import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { UNITS, type Stage } from '../timeline';
import { scramble, typed } from '../hud';

const pad = (n: number) => String(n).padStart(2, '0');

/** Name tag + typed readouts for one robot, top-left under the status line. */
export const UnitTag: React.FC<{ stage: Stage; durationInFrames: number }> = ({ stage, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tag = stage.tag ?? '';
  const rows: [string, string][] = [
    ['TYPE', stage.type ?? ''],
    ['TASK', stage.task ?? ''],
    ['ZONE', stage.zone ?? ''],
  ];

  const slide = spring({ frame: frame - 1, fps, config: { damping: 18, stiffness: 220 } });
  const decode = interpolate(frame, [2, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar = interpolate(frame, [6, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const panel = interpolate(frame, [8, 13], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // flicker out over the last frames before the cut
  const tail = durationInFrames - frame;
  const out = tail < 6 ? (random(`uo${frame}`) > 0.45 ? 0.15 : 0.85) * (tail / 6) : 1;

  // RGB fringe while the name decodes
  const fringe = (1 - decode) * 10;

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: 'absolute', left: 86, top: 262, transform: `translateX(${(1 - slide) * -60}px)`, opacity: slide }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: theme.amber, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          ◢ UNIT {pad(stage.n ?? 0)} OF {pad(UNITS)}
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 150,
            lineHeight: 1.02,
            color: theme.white,
            marginTop: 4,
            textShadow: `${-fringe}px 0 0 rgba(255,40,80,0.8), ${fringe}px 0 0 rgba(0,220,255,0.8), 0 8px 34px rgba(0,0,0,0.65)`,
          }}
        >
          {scramble(tag, decode, frame, tag)}
        </div>
        <div style={{ height: 8, width: 520 * bar, background: theme.orange, marginTop: 6, boxShadow: '0 0 18px rgba(240,100,30,0.7)' }} />

        <div
          style={{
            marginTop: 18,
            padding: '16px 24px 16px 22px',
            background: theme.panel,
            borderLeft: `6px solid ${theme.orange}`,
            opacity: panel,
            fontFamily: theme.mono,
            fontSize: 30,
            lineHeight: '46px',
            width: 600,
          }}
        >
          {rows.map(([k, v], i) => {
            const start = 10 + i * 5;
            const p = interpolate(frame, [start, start + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={k} style={{ display: 'flex', opacity: p > 0 ? 1 : 0 }}>
                <span style={{ width: 150, color: 'rgba(170,198,245,0.85)', fontWeight: 500 }}>{k}</span>
                <span style={{ color: theme.white, fontWeight: 700 }}>
                  {typed(v, p)}
                  {p > 0 && p < 1 ? <span style={{ color: theme.amber }}>▌</span> : null}
                </span>
              </div>
            );
          })}
          {(() => {
            const p = interpolate(frame, [26, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const blink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.35;
            return (
              <div style={{ display: 'flex', alignItems: 'center', opacity: p }}>
                <span style={{ width: 150, color: 'rgba(170,198,245,0.85)', fontWeight: 500 }}>STATUS</span>
                <span style={{ width: 18, height: 18, background: '#3DDC84', marginRight: 12, opacity: blink, boxShadow: '0 0 12px rgba(61,220,132,0.9)' }} />
                <span style={{ color: '#7DF0B0', fontWeight: 800 }}>ACTIVE</span>
              </div>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};
