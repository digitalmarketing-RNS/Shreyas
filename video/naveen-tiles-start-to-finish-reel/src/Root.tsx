import React from 'react';
import { Composition, Still } from 'remotion';
import { FactoryReel, type FactoryReelProps } from './FactoryReel';
import { Cover } from './Cover';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './timeline';

const defaults: FactoryReelProps = {
  music: true,
  cta: 'naveentile.com',
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FactoryReel"
      component={FactoryReel}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaults}
    />
    <Still id="Cover" component={Cover} width={WIDTH} height={HEIGHT} defaultProps={{ clip: 'clips/s46_97_1-KL.mp4', at: 20 }} />
  </>
);
