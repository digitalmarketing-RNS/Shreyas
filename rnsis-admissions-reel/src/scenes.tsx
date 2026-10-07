import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, SCHOOL} from './theme';
import {FACILITIES, IDENTITIES} from './timeline';
import {baseText, Dots, PhoneIcon, Pill, Scrim, useEnter} from './ui';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Stack: React.FC<{top: number; children: React.ReactNode; gap?: number}> = ({top, children, gap = 0}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 64,
      right: 64,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap,
    }}
  >
    {children}
  </div>
);

/** Word that pops in: scale-down + un-blur. Fully visible on its first frame when delay=0. */
const Pop: React.FC<{delay?: number; children: React.ReactNode; from?: number}> = ({delay = 0, children, from = 1.35}) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay, 260, 16);
  if (frame < delay) return <div style={{opacity: 0}}>{children}</div>;
  // Copy that is on screen from frame 0 stays sharp: that frame is the feed thumbnail.
  const blur = delay === 0 ? 0 : interpolate(frame - delay, [0, 4], [6, 0], clamp);
  return <div style={{transform: `scale(${from - (from - 1) * s})`, filter: `blur(${blur}px)`}}>{children}</div>;
};

// ------------------------------------------------------------------ 0-4 s
/** Four-point sparkle glyph. */
const Sparkle: React.FC<{size: number; color?: string}> = ({size, color = COLORS.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={color} />
  </svg>
);

/** Twinkling star field for the "universe of possibilities" hook. */
const Starfield: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [110, 120], [1, 0], clamp);
  const burst = (at: number) => Math.max(0, 1 - Math.abs(frame - at - 4) / 10);
  return (
    <AbsoluteFill style={{opacity: fadeOut, pointerEvents: 'none'}}>
      {Array.from({length: 46}).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const y = 180 + random(`y${i}`) * 1250;
        const size = 3 + random(`s${i}`) * 7;
        const phase = random(`p${i}`) * Math.PI * 2;
        const speed = 0.15 + random(`v${i}`) * 0.25;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame * speed + phase));
        const glow = 1 + 1.4 * Math.max(burst(45), burst(67));
        const gold = random(`c${i}`) > 0.7;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y - frame * (0.6 + random(`d${i}`) * 0.8),
              width: size * glow,
              height: size * glow,
              borderRadius: '50%',
              background: gold ? COLORS.gold : COLORS.white,
              opacity: twinkle * 0.85,
              boxShadow: `0 0 ${10 * glow}px ${gold ? COLORS.gold : 'rgba(255,255,255,0.9)'}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const HookText: React.FC = () => {
  const frame = useCurrentFrame();
  const spark = (at: number) => {
    const d = frame - at;
    if (d < 0) return 0;
    return interpolate(d, [0, 5, 22], [0, 1, 0.55], clamp);
  };
  return (
    <AbsoluteFill>
      <Scrim area="lower" strength={0.6} />
      <Starfield />
      <Stack top={850} gap={12}>
        <Pop from={1.12}>
          <div style={{...baseText, fontSize: 80, fontWeight: 800}}>Every child holds</div>
        </Pop>
        <Pop delay={45} from={1.6}>
          <div style={{position: 'relative'}}>
            <div style={{...baseText, fontSize: 148, fontWeight: 900, letterSpacing: -2}}>A UNIVERSE</div>
            <div style={{position: 'absolute', left: -46, top: -34, opacity: spark(45), transform: `rotate(${frame * 3}deg) scale(${0.5 + spark(45)})`}}>
              <Sparkle size={56} color={COLORS.gold} />
            </div>
            <div style={{position: 'absolute', right: -40, bottom: -18, opacity: spark(49), transform: `rotate(${-frame * 3}deg) scale(${0.4 + spark(49)})`}}>
              <Sparkle size={40} />
            </div>
          </div>
        </Pop>
        <Pop delay={67} from={1.7}>
          <Pill size={80} rotate={-2.5} style={{marginTop: 14, letterSpacing: 1}}>
            OF POSSIBILITIES
          </Pill>
        </Pop>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4-11 s
export const IdentityText: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {article, word} = IDENTITIES[index];
  const bar = interpolate(frame, [2, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const pop = useEnter(0, 300, 20);
  return (
    <AbsoluteFill>
      <Scrim area="lower" strength={0.5} />
      <Stack top={930} gap={6}>
        <Pop from={1.2}>
          <div style={{...baseText, fontSize: 58, fontWeight: 600, fontStyle: 'italic', opacity: 0.95}}>{article}</div>
        </Pop>
        <Pop from={1.3}>
          <div style={{position: 'relative', display: 'inline-block', paddingBottom: 18}}>
            <div style={{...baseText, fontSize: 138, fontWeight: 900, letterSpacing: -1}}>{word}</div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                height: 14,
                width: `${bar * 100}%`,
                borderRadius: 7,
                background: COLORS.orange,
              }}
            />
          </div>
        </Pop>
        <div style={{marginTop: 34}}>
          <Dots filled={index + 1} pop={pop} />
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 11-12 s
export const BreakCard: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useEnter(0, 200, 20);
  const b = useEnter(4, 200, 18);
  const zoom = interpolate(frame, [22, 30], [1, 1.18], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${COLORS.blue} 0%, ${COLORS.navy} 70%, ${COLORS.deep} 100%)`}}>
      <AbsoluteFill style={{opacity: 0.16}}>
        <Img src={staticFile('clips/still_group.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <Stack top={760} gap={26}>
          <div style={{...baseText, fontSize: 56, fontWeight: 700, color: COLORS.cream, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>
            At {SCHOOL.name},
          </div>
          <div style={{...baseText, fontSize: 124, fontWeight: 900, opacity: b, transform: `translateY(${(1 - b) * 40}px)`}}>
            they get to be…
          </div>
          <div style={{marginTop: 40, opacity: b}}>
            <Dots filled={7} glow />
          </div>
        </Stack>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 12-16 s
export const PayoffText: React.FC = () => {
  const frame = useCurrentFrame();
  const cap = interpolate(frame, [28, 36], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Scrim area="upper" strength={0.55} />
      <Scrim area="lower" strength={0.35} />
      <Stack top={320}>
        <div style={{display: 'flex', gap: 34}}>
          <Pop from={1.9}>
            <div style={{...baseText, fontSize: 190, fontWeight: 900, letterSpacing: -3}}>ALL</div>
          </Pop>
          <Pop delay={4} from={1.9}>
            <div style={{...baseText, fontSize: 190, fontWeight: 900, letterSpacing: -3}}>OF</div>
          </Pop>
        </div>
        <Pop delay={9} from={2.1}>
          <Pill size={176} rotate={-2.5} style={{marginTop: 14, letterSpacing: -2}}>
            IT.
          </Pill>
        </Pop>
      </Stack>
      <Stack top={1120}>
        <div
          style={{
            ...baseText,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.25,
            opacity: cap,
            transform: `translateY(${(1 - cap) * 20}px)`,
          }}
        >
          With individual attention
          <br />
          for every child.
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 16-18 s
export const CbseText: React.FC = () => {
  const a = useEnter(0);
  const b = useEnter(5);
  const c = useEnter(10);
  return (
    <AbsoluteFill>
      <Scrim area="upper" strength={0.6} />
      <Stack top={330} gap={8}>
        <div style={{...baseText, fontSize: 200, fontWeight: 900, letterSpacing: 4, transform: `scale(${1.4 - 0.4 * a})`, opacity: a}}>CBSE</div>
        <div style={{...baseText, fontSize: 60, fontWeight: 800, letterSpacing: 16, color: COLORS.cream, opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>
          AFFILIATED
        </div>
        <div style={{marginTop: 26, opacity: c, transform: `translateY(${(1 - c) * 24}px)`}}>
          <Pill size={40} bg="rgba(255,255,255,0.95)" color={COLORS.blue} style={{fontWeight: 800, letterSpacing: 1}}>
            Since 2013 · {SCHOOL.area}
          </Pill>
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 18-20 s
export const StagesText: React.FC = () => {
  const label = useEnter(0);
  return (
    <AbsoluteFill>
      <Scrim area="lower" strength={0.55} />
      <Stack top={920} gap={12}>
        <div style={{...baseText, fontSize: 38, fontWeight: 800, letterSpacing: 8, color: COLORS.cream, opacity: label}}>
          ONE CAMPUS · EVERY STAGE
        </div>
        <Pop from={1.4}>
          <div style={{...baseText, fontSize: 132, fontWeight: 900, letterSpacing: -1}}>NURSERY</div>
        </Pop>
        <Pop delay={30} from={1.5}>
          <div style={{...baseText, fontSize: 112, fontWeight: 900, letterSpacing: -1}}>
            TO GRADE <span style={{color: COLORS.orange}}>10</span>
          </div>
        </Pop>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 20-24 s
export const FacilitiesText: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(3, Math.floor(frame / 30));
  const local = frame - i * 30;
  const slide = interpolate(local, [0, 5], [-80, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Scrim area="lower" strength={0.5} />
      <Stack top={1040} gap={22}>
        <div style={{...baseText, fontSize: 38, fontWeight: 800, letterSpacing: 8, color: COLORS.cream}}>WORLD-CLASS CAMPUS</div>
        <div style={{transform: `translateX(${slide}px)`}}>
          <Pill size={76} bg={COLORS.white} color={COLORS.blue}>
            {FACILITIES[i]}
          </Pill>
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 24-28 s
export const OfferText: React.FC = () => {
  const frame = useCurrentFrame();
  const sub = interpolate(frame, [16, 24], [0, 1], clamp);
  const breathe = 1 + 0.015 * Math.sin((frame / 30) * Math.PI * 2);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'rgba(10,20,50,0.38)'}} />
      <Scrim area="center" strength={0.45} />
      <Stack top={500} gap={0}>
        <Pop from={1.8}>
          <div style={{...baseText, fontSize: 116, fontWeight: 900, letterSpacing: 6}}>ADMISSIONS</div>
        </Pop>
        <Pop delay={4} from={2}>
          <div style={{...baseText, fontSize: 250, fontWeight: 900, letterSpacing: -4, marginTop: -8}}>OPEN</div>
        </Pop>
        <Pop delay={12} from={2.2}>
          <div style={{transform: `scale(${breathe})`, marginTop: 10}}>
            <Pill size={124} rotate={-2.5}>
              2027–28
            </Pill>
          </div>
        </Pop>
        <div style={{...baseText, fontSize: 46, fontWeight: 700, marginTop: 48, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`}}>
          Give your child the start they deserve.
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 28-35 s
export const EndCard: React.FC<{finalHit: number}> = ({finalHit}) => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 10], [100, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const crest = useEnter(2, 160, 14);
  const l1 = useEnter(5);
  const l2 = useEnter(8);
  const l3 = useEnter(12);
  const l4 = useEnter(16);
  const l5 = useEnter(18);
  const l6 = useEnter(26);
  const hit = frame - finalHit;
  const hitPulse = hit >= 0 ? 1 + 0.12 * Math.exp(-hit / 6) * Math.cos(hit / 2.2) : 1;
  const shine = interpolate(hit, [0, 18], [-60, 160], clamp);
  const btnPulse = 1 + 0.035 * Math.max(0, Math.sin(((frame - 24) / 30) * Math.PI * 2));
  const bgZoom = interpolate(frame, [0, 210], [1.12, 1.0], clamp);
  const tagWords = ['Educating', 'Minds.', 'Enriching', 'Values.'];
  // Tagline builds word by word after the call to action (text only).
  const tagStart = [66, 74, 88, 96];

  return (
    <AbsoluteFill style={{transform: `translateY(${wipe}%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 32%, #3E6BC9 0%, ${COLORS.blue} 35%, ${COLORS.navy} 75%, ${COLORS.deep} 100%)`}} />
      <AbsoluteFill style={{opacity: 0.2, mixBlendMode: 'luminosity'}}>
        <Img src={staticFile('clips/still_aerial.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${bgZoom})`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,26,64,0.1) 0%, rgba(13,26,64,0.65) 100%)'}} />

      <Stack top={286}>
        <div
          style={{
            position: 'relative',
            width: 330,
            height: 301,
            transform: `scale(${(0.6 + 0.4 * crest) * hitPulse})`,
            opacity: crest,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -26,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 68%)',
            }}
          />
          <Img src={staticFile('brand/crest.png')} style={{position: 'absolute', width: 330, height: 301, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              WebkitMaskImage: `url(${staticFile('brand/crest.png')})`,
              WebkitMaskSize: '100% 100%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                bottom: -40,
                width: 70,
                left: `${shine}%`,
                transform: 'rotate(18deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>
        </div>
        <div style={{...baseText, fontSize: 44, fontWeight: 800, letterSpacing: 3, marginTop: 20, opacity: l1}}>
          RNS INTERNATIONAL SCHOOL
        </div>
        <div style={{...baseText, fontSize: 98, fontWeight: 900, letterSpacing: -0.5, whiteSpace: "nowrap", marginTop: 22, opacity: l2, transform: `scale(${1.3 - 0.3 * l2})`}}>
          ADMISSIONS OPEN
        </div>
        <div style={{marginTop: 14, opacity: l3, transform: `scale(${1.6 - 0.6 * l3})`}}>
          <Pill size={100} rotate={-2}>
            2027–28
          </Pill>
        </div>
        <div style={{...baseText, fontSize: 42, fontWeight: 700, color: COLORS.cream, marginTop: 22, opacity: l4}}>
          Nursery to Grade 10 · CBSE Affiliated
        </div>
        <div style={{marginTop: 26, opacity: l5, transform: `translateY(${(1 - l5) * 30}px) scale(${btnPulse})`}}>
          <div
            style={{
              ...baseText,
              fontSize: 50,
              fontWeight: 900,
              letterSpacing: 2,
              color: COLORS.blue,
              background: COLORS.white,
              textShadow: 'none',
              padding: '24px 58px',
              borderRadius: 999,
              boxShadow: `0 0 0 6px rgba(255,106,0,0.9), 0 18px 40px rgba(0,0,0,0.4)`,
            }}
          >
            BOOK A CAMPUS VISIT
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 26, opacity: l6}}>
          <PhoneIcon size={60} color={COLORS.orange} />
          <div style={{...baseText, fontSize: 70, fontWeight: 900, letterSpacing: 1}}>{SCHOOL.phone}</div>
        </div>
        <div style={{...baseText, fontSize: 38, fontWeight: 700, marginTop: 12, opacity: l6, color: COLORS.cream}}>
          {SCHOOL.web} · {SCHOOL.area}
        </div>
      </Stack>

      <Stack top={1310}>
        <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center'}}>
          {tagWords.map((w, i) => {
            const o = interpolate(frame, [tagStart[i], tagStart[i] + 6], [0, 1], clamp);
            return (
              <span key={i} style={{...baseText, fontSize: 44, fontWeight: 500, fontStyle: 'italic', color: COLORS.cream, opacity: o}}>
                {w}
              </span>
            );
          })}
        </div>
      </Stack>
    </AbsoluteFill>
  );
};

export const IdentitySequences: React.FC<{start: number}> = ({start}) => (
  <>
    {IDENTITIES.map((_, i) => (
      <Sequence key={i} from={start + i * 30} durationInFrames={30} layout="none">
        <IdentityText index={i} />
      </Sequence>
    ))}
  </>
);
