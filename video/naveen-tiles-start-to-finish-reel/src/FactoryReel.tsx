import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import type { TransitionPresentation } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { zoomBlur } from './toolkit/zoom-blur';
import { lightLeak } from './toolkit/light-leak';
import { FilmGrain } from './toolkit/FilmGrain';
import { Vignette } from './toolkit/Vignette';
import { Shot } from './components/Shot';
import { HookTitle } from './components/HookTitle';
import { StageLabel } from './components/StageLabel';
import { ProgressRail } from './components/ProgressRail';
import { EndCard } from './components/EndCard';
import { END_STAGE, SHOTS, STAGES, STAGE_SPANS, counterDelay, type TransitionType } from './timeline';
import './fonts';

export type FactoryReelProps = {
  /** false renders the SFX + factory-ambience mix only, for trending audio in-app. */
  music: boolean;
  cta: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentation = (type: TransitionType): TransitionPresentation<any> => {
  switch (type) {
    case 'zoomBlur':
      return zoomBlur({ blurAmount: 26, scaleAmount: 1.18 });
    case 'lightLeak':
      return lightLeak({ temperature: 'warm', direction: 'right', intensity: 0.85 });
    case 'slide':
      return slide({ direction: 'from-bottom' });
    case 'fade':
      return fade();
  }
};

/** White flash + short camera shake on the big hits: the drop, the kiln and the end card. */
const FIRE_STAGE = STAGES.findIndex((s) => s.counter);
const IMPACTS = [STAGE_SPANS[1].from, ...(FIRE_STAGE > 0 ? [STAGE_SPANS[FIRE_STAGE].from] : []), STAGE_SPANS[END_STAGE].from];

const useShake = () => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  for (const at of IMPACTS) {
    const t = frame - at;
    if (t >= 0 && t < 12) {
      const amp = 22 * Math.exp(-t / 3.5);
      x += (random(`sx${frame}`) - 0.5) * 2 * amp;
      y += (random(`sy${frame}`) - 0.5) * 2 * amp;
    }
  }
  return `translate(${x}px, ${y}px)`;
};

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 1, 7], [0.95, 0.8, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, mixBlendMode: 'screen' }} />;
};

export const FactoryReel: React.FC<FactoryReelProps> = ({ music, cta }) => {
  const shake = useShake();
  const rail = { from: STAGE_SPANS[1].from, to: STAGE_SPANS[END_STAGE].from };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ transform: `${shake} scale(1.04)` }}>
        <TransitionSeries>
          {SHOTS.flatMap((shot) => {
            const items = [
              <TransitionSeries.Sequence key={shot.key} durationInFrames={shot.inHalf + shot.frames + shot.outHalf}>
                <Shot shot={shot} look={shot.stage === END_STAGE ? 'end' : undefined} />
              </TransitionSeries.Sequence>,
            ];
            if (shot.out) {
              items.push(
                <TransitionSeries.Transition
                  key={`${shot.key}-out`}
                  presentation={presentation(shot.out.type)}
                  timing={linearTiming({ durationInFrames: shot.out.frames })}
                />,
              );
            }
            return items;
          })}
        </TransitionSeries>
      </AbsoluteFill>

      {/* legibility: darken the top where the labels sit and the bottom under the IG caption */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 30%, rgba(0,0,0,0) 48%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      <Sequence durationInFrames={STAGE_SPANS[0].frames}>
        <HookTitle durationInFrames={STAGE_SPANS[0].frames} />
      </Sequence>

      {STAGE_SPANS.filter((s) => STAGES[s.stage].n !== undefined).map((span) => (
        <Sequence key={span.stage} from={span.from} durationInFrames={span.frames}>
          <StageLabel stage={STAGES[span.stage]} durationInFrames={span.frames} counterDelay={counterDelay(span.stage)} />
        </Sequence>
      ))}

      <Sequence from={rail.from} durationInFrames={rail.to - rail.from}>
        <ProgressRail offset={rail.from} />
      </Sequence>

      <Sequence from={STAGE_SPANS[END_STAGE].from}>
        <EndCard cta={cta} />
      </Sequence>

      {IMPACTS.map((at) => (
        <Sequence key={at} from={at} durationInFrames={8}>
          <Flash />
        </Sequence>
      ))}

      <Vignette intensity={0.38} centerSize={55} />
      <FilmGrain opacity={0.05} />

      <Audio src={staticFile(music ? 'audio/mix_music.wav' : 'audio/mix_nomusic.wav')} />
    </AbsoluteFill>
  );
};
