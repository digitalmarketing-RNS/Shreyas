import React from 'react';
import { Composition, Still } from 'remotion';
import { RobotsReel, type RobotsReelProps } from './RobotsReel';
import { Cover } from './Cover';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './timeline';

const defaults: RobotsReelProps = {
  music: true,
  cta: 'naveentile.com',
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="RobotsReel"
      component={RobotsReel}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaults}
    />
    <Still id="Cover" component={Cover} width={WIDTH} height={HEIGHT} defaultProps={{ clip: 'clips/u7_153-PK.mp4', at: 20 }} />
  </>
);
