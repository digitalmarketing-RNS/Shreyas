import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import type { TransitionPresentation } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { glitch } from './toolkit/glitch';
import { FilmGrain } from './toolkit/FilmGrain';
import { Vignette } from './toolkit/Vignette';
import { OUTER_SCALE, Shot } from './components/Shot';
import { HudFrame } from './components/HudFrame';
import { HookTitle } from './components/HookTitle';
import { UnitTag } from './components/UnitTag';
import { TargetLock } from './components/TargetLock';
import { EndCard } from './components/EndCard';
import { END_STAGE, SHOTS, STAGES, STAGE_SPANS, type TransitionType } from './timeline';
import { CUTS } from './hud';
import './fonts';

export type RobotsReelProps = {
  /** false renders the SFX + factory-ambience mix only, for trending audio in-app. */
  music: boolean;
  cta: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentation = (type: TransitionType): TransitionPresentation<any> =>
  type === 'glitch' ? glitch({ intensity: 0.75, slices: 6 }) : fade();

/** What the target chip says once it has locked on, by robot family. */
const trackLabel = (stage: number): string => {
  const tag = STAGES[stage].tag ?? '';
  if (tag.startsWith('PICKER')) return 'TRACKING VACUUM HEAD';
  if (tag.startsWith('SHUTTLE')) return 'TRACKING SHUTTLE';
  return 'TRACKING GRIPPER';
};

const END_AT = STAGE_SPANS[END_STAGE].from;
const IMPACTS = [0, END_AT];

const useShake = () => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  const hits = [...IMPACTS.map((at) => [at, 22] as const), ...CUTS.filter((c) => c !== END_AT).map((c) => [c, 9] as const)];
  for (const [at, a] of hits) {
    const t = frame - at;
    if (t >= 0 && t < 12) {
      const amp = a * Math.exp(-t / 3.2);
      x += (random(`sx${frame}`) - 0.5) * 2 * amp;
      y += (random(`sy${frame}`) - 0.5) * 2 * amp;
    }
  }
  return `translate(${x}px, ${y}px)`;
};

const Flash: React.FC<{ peak: number }> = ({ peak }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 1, 7], [peak, peak * 0.8, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, mixBlendMode: 'screen' }} />;
};

export const RobotsReel: React.FC<RobotsReelProps> = ({ music, cta }) => {
  const shake = useShake();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ transform: `${shake} scale(${OUTER_SCALE})` }}>
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

      {/* legibility: darken the top where the tags sit and the bottom under the IG caption */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0) 42%, rgba(0,0,0,0) 74%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {SHOTS.filter((s) => s.roi).map((shot) => (
        <Sequence key={shot.key} from={shot.at} durationInFrames={shot.frames}>
          <TargetLock shot={shot} label={trackLabel(shot.stage)} />
        </Sequence>
      ))}

      <Sequence durationInFrames={STAGE_SPANS[0].frames}>
        <HookTitle durationInFrames={STAGE_SPANS[0].frames} />
      </Sequence>

      {STAGE_SPANS.filter((s) => STAGES[s.stage].tag !== undefined).map((span) => (
        <Sequence key={span.stage} from={span.from} durationInFrames={span.frames}>
          <UnitTag stage={STAGES[span.stage]} durationInFrames={span.frames} />
        </Sequence>
      ))}

      <HudFrame />

      <Sequence from={END_AT}>
        <EndCard cta={cta} />
      </Sequence>

      {IMPACTS.map((at) => (
        <Sequence key={at} from={at} durationInFrames={8}>
          <Flash peak={at === 0 ? 0.5 : 0.9} />
        </Sequence>
      ))}

      <Vignette intensity={0.4} centerSize={55} />
      <FilmGrain opacity={0.05} />

      <Audio src={staticFile(music ? 'audio/mix_music.wav' : 'audio/mix_nomusic.wav')} />
    </AbsoluteFill>
  );
};
