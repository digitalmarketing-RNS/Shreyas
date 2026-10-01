import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { PROCESS_STEPS, type Stage } from '../timeline';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Chapter card for one step of the process: outlined step number, big title
 *  wiping up, red rule, and a one-line explainer. */
export const StageLabel: React.FC<{ stage: Stage; durationInFrames: number }> = ({ stage, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  const titleS = spring({ frame: frame - 3, fps, config: { damping: 18, stiffness: 150 } });
  const subS = spring({ frame: frame - 9, fps, config: { damping: 20, stiffness: 140 } });
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        paddingLeft: theme.safe.left,
        paddingTop: 292,
        opacity: 1 - out,
        transform: `translateY(${-out * 30}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, transform: `translateX(${(1 - inS) * -80}px)`, opacity: inS }}>
        <span
          style={{
            fontFamily: theme.display,
            fontSize: 118,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: '3px rgba(255,255,255,0.95)',
            letterSpacing: 2,
          }}
        >
          {pad2(stage.n ?? 0)}
        </span>
        <span style={{ fontFamily: theme.body, fontWeight: 700, fontSize: 32, color: 'rgba(255,255,255,0.75)', letterSpacing: 2 }}>
          / {pad2(PROCESS_STEPS)}
        </span>
      </div>
      <div style={{ overflow: 'hidden', marginTop: 4, paddingBottom: 6 }}>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 138,
            lineHeight: 1.02,
            color: theme.white,
            letterSpacing: 1.5,
            textShadow: '0 6px 34px rgba(0,0,0,0.5)',
            transform: `translateY(${(1 - titleS) * 105}%)`,
          }}
        >
          {stage.title}
        </div>
      </div>
      <div
        style={{
          width: 150 * titleS,
          height: 10,
          background: theme.red,
          marginTop: 8,
          borderRadius: 2,
          boxShadow: '0 4px 18px rgba(227,38,61,0.6)',
        }}
      />
      <div style={{ marginTop: 22, opacity: subS, transform: `translateY(${(1 - subS) * 20}px)` }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: theme.body,
            fontWeight: 650,
            fontSize: 40,
            color: theme.white,
            padding: '12px 22px',
            borderRadius: 14,
            background: 'rgba(10,8,24,0.5)',
            backdropFilter: 'blur(8px)',
            maxWidth: 1080 - theme.safe.left - theme.safe.right,
          }}
        >
          {stage.sub}
        </span>
      </div>
      {stage.counter ? <KilnCounter from={stage.counter[0]} to={stage.counter[1]} /> : null}
    </AbsoluteFill>
  );
};

/** Temperature climbing through the kiln zones read off the control panel. */
const KilnCounter: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = interpolate(frame, [4, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const s = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 160 } });
  const value = Math.round(from + (to - from) * k);
  const glow = 0.5 + 0.5 * k;
  return (
    <div
      style={{
        position: 'absolute',
        left: theme.safe.left,
        top: 1290,
        opacity: s,
        transform: `scale(${0.85 + 0.15 * s})`,
        transformOrigin: 'left center',
      }}
    >
      <span
        style={{
          fontFamily: theme.display,
          fontSize: 190,
          lineHeight: 1,
          color: theme.heat,
          textShadow: `0 0 ${30 * glow}px rgba(255,120,30,${0.8 * glow}), 0 0 ${80 * glow}px rgba(255,80,20,${0.5 * glow})`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span style={{ fontFamily: theme.display, fontSize: 90, color: theme.heat, marginLeft: 8 }}>°C</span>
    </div>
  );
};
