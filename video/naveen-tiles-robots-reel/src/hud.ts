import { interpolate, random } from 'remotion';
import { shotScale } from './components/Shot';
import { HEIGHT, SHOTS, STAGE_SPANS, STAGES, WIDTH, type ShotPlan } from './timeline';

export type Rect = { x: number; y: number; w: number; h: number };

/** Target box for `shot`, `sinceCut` frames after its cut, in screen pixels. */
export const roiAt = (shot: ShotPlan, sinceCut: number): Rect | null => {
  const keys = shot.roi;
  if (!keys || keys.length === 0) return null;
  const frames = keys.map((k) => k[0]);
  const pick = (i: number) =>
    keys.length === 1 ? keys[0][i] : interpolate(sinceCut, frames, keys.map((k) => k[i]), { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s = shotScale(shot, sinceCut);
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const x = pick(1);
  const y = pick(2);
  return { x: cx + (x - cx) * s, y: cy + (y - cy) * s, w: pick(3) * s, h: pick(4) * s };
};

export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/<>%';

/** Decode effect: characters lock in left to right, the rest keep cycling. */
export const scramble = (text: string, progress: number, frame: number, seed: string): string => {
  const p = Math.max(0, Math.min(1, progress));
  const locked = Math.floor(p * text.length);
  const tick = Math.floor(frame / 2);
  return text
    .split('')
    .map((ch, i) => {
      if (i < locked || ch === ' ' || p >= 1) return ch;
      return GLYPHS[Math.floor(random(`${seed}-${i}-${tick}`) * GLYPHS.length)];
    })
    .join('');
};

/** Typewriter: the first `progress` share of the text. */
export const typed = (text: string, progress: number): string =>
  text.slice(0, Math.round(Math.max(0, Math.min(1, progress)) * text.length));

/** Timeline frames of every cut (shot boundaries). */
export const CUTS = SHOTS.slice(1).map((s) => s.at);

/** Which roster unit (1-based) is on screen at `frame`, 0 for hook, -1 for end card. */
export const unitAt = (frame: number): number => {
  for (let i = STAGE_SPANS.length - 1; i >= 0; i--) {
    if (frame >= STAGE_SPANS[i].from) {
      const st = STAGES[i];
      if (st.n !== undefined) return st.n;
      return st.id === 'end' ? -1 : 0;
    }
  }
  return 0;
};

/** Short HUD jolt around each cut: 0 outside, peaks at the cut. */
export const cutJolt = (frame: number, radius = 4): number => {
  let k = 0;
  for (const c of CUTS) {
    const d = Math.abs(frame - c);
    if (d < radius) k = Math.max(k, 1 - d / radius);
  }
  return k;
};
