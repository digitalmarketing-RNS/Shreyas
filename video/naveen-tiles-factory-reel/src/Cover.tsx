import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { theme } from './theme';
import { FilmGrain } from './toolkit/FilmGrain';
import { Vignette } from './toolkit/Vignette';
import './fonts';

/** Reel cover / thumbnail. Text sits inside the centre 1080x1350 so it
 *  survives the 4:5 crop on the profile grid. */
export const Cover: React.FC<{ clip: string; at: number }> = ({ clip, at }) => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <AbsoluteFill style={{ transform: 'scale(1.08)' }}>
      <OffthreadVideo src={staticFile(clip)} startFrom={at} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.2) 100%)' }} />
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 160 }}>
      <div style={{ fontFamily: theme.body, fontWeight: 800, fontSize: 34, letterSpacing: 10, color: 'rgba(255,255,255,0.9)' }}>
        INSIDE THE NAVEEN FACTORY
      </div>
      <div style={{ fontFamily: theme.display, fontSize: 190, lineHeight: 0.98, color: theme.white, textAlign: 'center', marginTop: 24, textShadow: '0 10px 50px rgba(0,0,0,0.6)' }}>
        HOW A TILE
        <br />
        IS <span style={{ background: theme.red, padding: '0 22px', display: 'inline-block', transform: 'rotate(-2deg)' }}>BORN</span>
      </div>
      <div style={{ marginTop: 40, fontFamily: theme.body, fontWeight: 700, fontSize: 40, color: theme.white, background: 'rgba(10,8,24,0.55)', padding: '12px 26px', borderRadius: 14 }}>
        13 steps · rock to floor
      </div>
    </AbsoluteFill>
    <Vignette intensity={0.4} centerSize={50} />
    <FilmGrain opacity={0.05} animate={false} />
  </AbsoluteFill>
);
