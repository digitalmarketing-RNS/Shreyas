import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLORS, FONT, textShadow} from './theme';
import type {Shot} from './timeline';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Spring that starts `delay` frames into the current Sequence. */
export const useEnter = (delay = 0, stiffness = 220, damping = 18) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {stiffness, damping, mass: 0.6}});
};

/** Footage layer, rendered inside a Sequence that starts at shot.from. */
export const ShotLayer: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  let scale = 1.06;
  if (shot.push) {
    scale = interpolate(frame, [0, shot.dur], shot.push, clamp);
  }
  if (shot.punch) {
    scale = interpolate(frame, [0, 7, shot.dur], [1.17, 1.07, 1.1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  }
  scale *= shot.zoom ?? 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <OffthreadVideo
        src={staticFile(`clips/${shot.src}.mp4`)}
        playbackRate={shot.rate ?? 1}
        trimBefore={shot.trim}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateY(${shot.y ?? 0}px) scale(${scale})`,
          filter: 'contrast(1.06) saturate(1.1) brightness(1.02)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Darkens a band of the frame so white copy stays legible on bright footage. */
export const Scrim: React.FC<{area: 'lower' | 'upper' | 'center'; strength?: number}> = ({
  area,
  strength = 0.6,
}) => {
  const g =
    area === 'lower'
      ? `linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(8,16,40,${strength}) 58%, rgba(8,16,40,${strength}) 72%, rgba(0,0,0,0) 92%)`
      : area === 'upper'
        ? `linear-gradient(180deg, rgba(8,16,40,${strength * 0.6}) 8%, rgba(8,16,40,${strength}) 20%, rgba(8,16,40,${strength * 0.7}) 34%, rgba(0,0,0,0) 48%)`
        : `radial-gradient(ellipse 90% 45% at 50% 46%, rgba(8,16,40,${strength}) 0%, rgba(8,16,40,${strength * 0.6}) 55%, rgba(0,0,0,0) 100%)`;
  return <AbsoluteFill style={{background: g}} />;
};

/** White flash that decays over `dur` frames, placed in a Sequence at the hit. */
export const Flash: React.FC<{dur?: number; peak?: number}> = ({dur = 7, peak = 0.85}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, dur], [peak, 0], {...clamp, easing: Easing.out(Easing.quad)});
  return <AbsoluteFill style={{backgroundColor: 'white', opacity: o, pointerEvents: 'none'}} />;
};

/** Small deterministic camera shake for slams; wrap content that should shake. */
export const Shake: React.FC<{at: number[]; children: React.ReactNode}> = ({at, children}) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  for (const hit of at) {
    const d = frame - hit;
    if (d >= 0 && d < 9) {
      const amp = 14 * (1 - d / 9);
      x += (random(`sx${frame}`) - 0.5) * 2 * amp;
      y += (random(`sy${frame}`) - 0.5) * 2 * amp;
    }
  }
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px)`}}>{children}</AbsoluteFill>;
};

export const baseText: React.CSSProperties = {
  fontFamily: FONT,
  color: COLORS.white,
  textShadow,
  fontVariantNumeric: 'lining-nums',
  fontFeatureSettings: '"lnum" 1',
  textAlign: 'center',
  lineHeight: 1,
  margin: 0,
};

export const Pill: React.FC<{
  children: React.ReactNode;
  size: number;
  bg?: string;
  color?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({children, size, bg = COLORS.orange, color = COLORS.white, rotate = 0, style}) => (
  <div
    style={{
      ...baseText,
      display: 'inline-block',
      fontSize: size,
      fontWeight: 900,
      color,
      background: bg,
      padding: `${size * 0.12}px ${size * 0.3}px ${size * 0.16}px`,
      borderRadius: size * 0.22,
      transform: `rotate(${rotate}deg)`,
      textShadow: 'none',
      boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Persistent offer badge shown during the montage sections. */
export const AdmissionsBadge: React.FC<{visibleFrom: number; visibleTo: number}> = ({
  visibleFrom,
  visibleTo,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame: frame - visibleFrom, fps, config: {damping: 16, stiffness: 180}});
  const out = interpolate(frame, [visibleTo - 5, visibleTo], [1, 0], clamp);
  if (frame < visibleFrom || frame > visibleTo) return null;
  const shine = ((frame - visibleFrom) % 60) / 60;
  return (
    <div
      style={{
        position: 'absolute',
        top: 300,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: out,
        transform: `translateY(${(1 - inS) * -40}px) scale(${0.8 + 0.2 * inS})`,
      }}
    >
      <div
        style={{
          ...baseText,
          position: 'relative',
          overflow: 'hidden',
          fontSize: 37,
          fontWeight: 800,
          letterSpacing: 3,
          padding: '16px 36px',
          borderRadius: 999,
          background: COLORS.orange,
          textShadow: 'none',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        ADMISSIONS OPEN · 2027–28
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 90,
            left: `${-20 + shine * 140}%`,
            background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>
    </div>
  );
};

/** Row of seven dots that fills as each identity lands. */
export const Dots: React.FC<{filled: number; pop?: number; glow?: boolean}> = ({filled, pop = 0, glow}) => (
  <div style={{display: 'flex', gap: 18, justifyContent: 'center'}}>
    {Array.from({length: 7}).map((_, i) => {
      const on = i < filled;
      const isNew = i === filled - 1;
      return (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: on ? COLORS.orange : 'rgba(255,255,255,0.35)',
            transform: `scale(${isNew ? 1 + 0.6 * (1 - pop) : 1})`,
            boxShadow: glow && on ? `0 0 18px ${COLORS.orange}` : '0 2px 6px rgba(0,0,0,0.3)',
          }}
        />
      );
    })}
  </div>
);

export const PhoneIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
  </svg>
);
