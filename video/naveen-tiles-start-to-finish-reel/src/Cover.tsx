import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { theme } from './theme';
import { FilmGrain } from './toolkit/FilmGrain';
import { Vignette } from './toolkit/Vignette';
import './fonts';

/** Reel cover. Text sits inside the centre 1080x1350 so it survives the 4:5
 *  crop on the profile grid. */
export const Cover: React.FC<{ clip: string; at: number }> = ({ clip, at }) => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <AbsoluteFill style={{ transform: 'scale(1.08)' }}>
      <OffthreadVideo src={staticFile(clip)} startFrom={at} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0.65) 68%, rgba(0,0,0,0.2) 100%)' }} />
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
      <div style={{ background: theme.white, borderRadius: 26, padding: '16px 30px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <Img src={staticFile('brand/naveen-logo.png')} style={{ width: 300, height: 'auto', display: 'block' }} />
      </div>
      <div style={{ fontFamily: theme.body, fontWeight: 800, fontSize: 38, letterSpacing: 10, color: theme.white, marginTop: 44 }}>HOW A TILE IS MADE</div>
      <div style={{ fontFamily: theme.display, fontSize: 180, lineHeight: 0.98, color: theme.white, textAlign: 'center', marginTop: 16, textShadow: '0 10px 50px rgba(0,0,0,0.6)' }}>
        START TO
        <br />
        FINISH
      </div>
      <div style={{ marginTop: 20, fontFamily: theme.display, fontSize: 100, color: theme.white, background: theme.orange, padding: '0 28px 6px', transform: 'rotate(-2deg)' }}>STATE-OF-THE-ART</div>
      <div style={{ marginTop: 40, fontFamily: theme.body, fontWeight: 700, fontSize: 38, color: theme.white, background: 'rgba(8,14,30,0.6)', padding: '12px 26px', borderRadius: 14 }}>
        14 steps · raw earth to your floor
      </div>
    </AbsoluteFill>
    <Vignette intensity={0.4} centerSize={50} />
    <FilmGrain opacity={0.05} animate={false} />
  </AbsoluteFill>
);
