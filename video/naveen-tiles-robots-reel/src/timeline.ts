import edit from './edit.json';
import clips from './clips.generated.json';

export type TransitionType = 'glitch' | 'fade';

/** One robot on the roster (or the hook / end card when `tag` is absent). */
export type Stage = {
  id?: string;
  n?: number;
  tag?: string;
  type?: string;
  task?: string;
  zone?: string;
};

/** Target box keyframe in clip pixels: [frame since cut, x, y, w, h]. */
export type RoiKey = [number, number, number, number, number];

export type ShotPlan = {
  key: string;
  file: string;
  index: number;
  stage: number;
  /** Frames this shot owns on the timeline, cut point to cut point. */
  frames: number;
  /** Timeline frame of the cut into this shot. */
  at: number;
  /** Overlap borrowed from the neighbours for transitions (frames). */
  inHalf: number;
  outHalf: number;
  /** Where in the clip file the sequence starts playing. */
  startFrom: number;
  out?: { type: TransitionType; frames: number };
  roi?: RoiKey[];
};

export const FPS: number = edit.fps;
export const WIDTH: number = edit.width;
export const HEIGHT: number = edit.height;
export const BEAT_FRAMES = Math.round((60 / edit.bpm) * edit.fps);
export const STAGES: Stage[] = edit.stages as Stage[];
export const UNITS = STAGES.filter((s) => s.tag !== undefined).length;

const clipInfo = clips as Record<string, { file: string; padFrames: number }>;

export const SHOTS: ShotPlan[] = (() => {
  let at = 0;
  let prevOut = 0;
  return edit.shots.map((s, index) => {
    const extra = s as { out?: ShotPlan['out']; roi?: number[][] };
    const out = extra.out;
    const inHalf = prevOut / 2;
    const outHalf = out ? out.frames / 2 : 0;
    const info = clipInfo[s.key];
    const plan: ShotPlan = {
      key: s.key,
      file: info.file,
      index,
      stage: s.stage,
      frames: s.frames,
      at,
      inHalf,
      outHalf,
      startFrom: info.padFrames - inHalf,
      out,
      roi: extra.roi as RoiKey[] | undefined,
    };
    at += s.frames;
    prevOut = out ? out.frames : 0;
    return plan;
  });
})();

export const TOTAL_FRAMES = SHOTS.reduce((sum, s) => sum + s.frames, 0);

/** First timeline frame and length of every stage. */
export const STAGE_SPANS: { stage: number; from: number; frames: number }[] = STAGES.map((_, i) => {
  const shots = SHOTS.filter((s) => s.stage === i);
  const from = shots[0].at;
  const frames = shots.reduce((sum, s) => sum + s.frames, 0);
  return { stage: i, from, frames };
});

export const END_STAGE = STAGES.length - 1;
