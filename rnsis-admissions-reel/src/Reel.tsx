import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {
  BreakCard,
  CbseText,
  EndCard,
  FacilitiesText,
  HookText,
  IdentitySequences,
  OfferText,
  PayoffText,
  StagesText,
} from './scenes';
import {DURATION, SHOTS, T} from './timeline';
import {AdmissionsBadge, Flash, ShotLayer, Shake, Vignette} from './ui';

export type ReelProps = {soundtrack: string};

export const Reel: React.FC<ReelProps> = ({soundtrack}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Shake at={[T.identities, T.payoff, T.offer]}>
        {SHOTS.map((shot) => (
          <Sequence key={`${shot.src}-${shot.from}`} from={shot.from} durationInFrames={shot.dur}>
            <ShotLayer shot={shot} />
          </Sequence>
        ))}
        <Vignette strength={0.45} />

        <Sequence from={T.hook} durationInFrames={T.identities - T.hook}>
          <HookText />
        </Sequence>
        <IdentitySequences start={T.identities} />
        <Sequence from={T.breakCard} durationInFrames={T.payoff - T.breakCard}>
          <BreakCard />
        </Sequence>
        <Sequence from={T.payoff} durationInFrames={T.drone - T.payoff}>
          <PayoffText />
        </Sequence>
        <Sequence from={T.drone} durationInFrames={T.stages - T.drone}>
          <CbseText />
        </Sequence>
        <Sequence from={T.stages} durationInFrames={T.facilities - T.stages}>
          <StagesText />
        </Sequence>
        <Sequence from={T.facilities} durationInFrames={T.offer - T.facilities}>
          <FacilitiesText />
        </Sequence>
        <Sequence from={T.offer} durationInFrames={T.end - T.offer}>
          <OfferText />
        </Sequence>
      </Shake>

      <AdmissionsBadge visibleFrom={T.identities} visibleTo={T.breakCard - 1} />
      <AdmissionsBadge visibleFrom={T.stages} visibleTo={T.offer - 1} />

      <Sequence from={T.end} durationInFrames={DURATION - T.end}>
        <EndCard finalHit={T.finalHit - T.end} />
      </Sequence>

      {/* Flashes on the big musical landings. */}
      {[
        {at: T.identities, peak: 0.55},
        {at: T.payoff, peak: 0.9},
        {at: T.offer, peak: 0.8},
        {at: T.finalHit, peak: 0.35},
      ].map(({at, peak}) => (
        <Sequence key={at} from={at} durationInFrames={10}>
          <Flash peak={peak} />
        </Sequence>
      ))}

      <Audio src={staticFile(soundtrack)} />
    </AbsoluteFill>
  );
};
