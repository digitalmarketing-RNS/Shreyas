import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { theme } from './theme';
import { FilmGrain } from './toolkit/FilmGrain';
import { Vignette } from './toolkit/Vignette';
import './fonts';

const Corner: React.FC<{ x: number; y: number; dx: 1 | -1; dy: 1 | -1; len?: number; color?: string }> = ({ x, y, dx, dy, len = 70, color = theme.orange }) => (
  <path d={`M ${x} ${y + dy * len} L ${x} ${y} L ${x + dx * len} ${y}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="square" />
);

/** Reel cover. Text sits inside the centre 1080x1350 so it survives the 4:5
 *  crop on the profile grid. */
export const Cover: React.FC<{ clip: string; at: number }> = ({ clip, at }) => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <AbsoluteFill style={{ transform: 'scale(1.06)' }}>
      <OffthreadVideo src={staticFile(clip)} startFrom={at} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 10%, rgba(0,0,0,0.62) 30%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.35) 100%)' }} />
    <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0.13) 4px)' }} />
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <Corner x={70} y={310} dx={1} dy={1} color="rgba(255,255,255,0.9)" />
      <Corner x={1010} y={310} dx={-1} dy={1} color="rgba(255,255,255,0.9)" />
      <Corner x={70} y={1610} dx={1} dy={-1} color="rgba(255,255,255,0.9)" />
      <Corner x={1010} y={1610} dx={-1} dy={-1} color="rgba(255,255,255,0.9)" />
    </svg>
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 370 }}>
      <div style={{ background: theme.white, borderRadius: 24, padding: '14px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <Img src={staticFile('brand/naveen-logo.png')} style={{ width: 280, height: 'auto', display: 'block' }} />
      </div>
      <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 58, letterSpacing: 14, color: theme.white, marginTop: 40, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>MEET THE</div>
      <div style={{ fontFamily: theme.display, fontSize: 280, lineHeight: 0.98, color: theme.white, textShadow: '-6px 0 0 rgba(255,40,80,0.7), 6px 0 0 rgba(0,220,255,0.7), 0 10px 50px rgba(0,0,0,0.6)' }}>
        ROBOTS
      </div>
      <div style={{ fontFamily: theme.display, fontSize: 140, lineHeight: 1, color: theme.orange, textShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>OF NAVEEN</div>
      <div style={{ marginTop: 34, fontFamily: theme.mono, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: theme.white, background: theme.orange, padding: '10px 24px' }}>
        ◉ TECHNOLOGY AT WORK
      </div>
    </AbsoluteFill>
    <Vignette intensity={0.4} centerSize={50} />
    <FilmGrain opacity={0.05} animate={false} />
  </AbsoluteFill>
);
