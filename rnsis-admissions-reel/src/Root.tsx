import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Reel} from './Reel';
import {DURATION, FPS} from './timeline';

export const Root: React.FC = () => (
  <>
    {/* Main cut: original music + voice lines from the RNSIS brand film. */}
    <Composition
      id="AdmissionsReel"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{soundtrack: 'audio/soundtrack_vo.wav'}}
    />
    {/* Same edit with music + SFX only (for A/B testing or adding a fresh VO later). */}
    <Composition
      id="AdmissionsReelMusicOnly"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{soundtrack: 'audio/soundtrack_music.wav'}}
    />
  </>
);
