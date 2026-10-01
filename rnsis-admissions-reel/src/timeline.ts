// Edit decision list. 30 fps, 120 BPM music => one beat every 15 frames, and every
// section boundary below is a downbeat in scripts/compose_music.py.
export const FPS = 30;
export const DURATION = 945; // 31.5 s

export const T = {
  hook: 0, // "Every child holds A UNIVERSE OF POSSIBILITIES"
  identities: 90, // seven 1-second identity cuts
  breakCard: 300, // "At RNS International School, they get to be..."
  payoff: 330, // "ALL OF IT." + VO "every child discovers their unique talents"
  drone: 450, // CBSE affiliated, since 2013
  stages: 510, // Nursery -> Grade 10
  facilities: 570, // four half-second facility flashes
  offer: 630, // ADMISSIONS OPEN 2027-28
  end: 750, // end card + VO tagline
  finalHit: 870, // crest + "RNS International School" VO
} as const;

export type Shot = {
  src: string; // file in public/clips
  from: number; // composition frame
  dur: number; // frames on screen
  rate?: number; // playback rate (clips are 24 fps sources, some slowed to fill the slot)
  trim?: number; // composition frames to skip at the start of the clip
  push?: [number, number]; // slow scale drift across the shot
  punch?: boolean; // fast zoom settle on the cut
  zoom?: number; // base scale, e.g. to reframe a face higher in the frame
  y?: number; // vertical shift in px (needs (zoom - 1) * 960 >= |y| to keep the frame covered)
};

export const SHOTS: Shot[] = [
  {src: 'proof_little', from: 0, dur: 30, rate: 0.87, push: [1.02, 1.08]},
  {src: 'hook_a', from: 30, dur: 30, rate: 0.87, push: [1.02, 1.08]},
  {src: 'hook_c', from: 60, dur: 30, push: [1.02, 1.08]},

  {src: 'id_explorer', from: 90, dur: 30, rate: 0.95, punch: true},
  {src: 'id_artist', from: 120, dur: 30, punch: true},
  {src: 'id_scientist', from: 150, dur: 30, punch: true},
  {src: 'id_innovator', from: 180, dur: 30, punch: true},
  {src: 'id_athlete', from: 210, dur: 30, push: [1.0, 1.05]},
  {src: 'id_performer', from: 240, dur: 30, rate: 0.9, punch: true},
  {src: 'id_leader', from: 270, dur: 30, rate: 0.7, punch: true, zoom: 1.25, y: -230},

  {src: 'payoff_group', from: 330, dur: 120, rate: 0.915, push: [1.0, 1.06]},

  {src: 'proof_drone', from: 450, dur: 60, trim: 18, push: [1.0, 1.05]},
  {src: 'hook_a', from: 510, dur: 30, rate: 0.87, push: [1.1, 1.16]},
  {src: 'proof_big', from: 540, dur: 30, rate: 0.87, push: [1.04, 1.1]},
  {src: 'fac_lab', from: 570, dur: 15, trim: 6, punch: true},
  {src: 'fac_library', from: 585, dur: 15, trim: 6, punch: true},
  {src: 'fac_computer', from: 600, dur: 15, trim: 6, punch: true},
  {src: 'fac_sports', from: 615, dur: 15, trim: 6, punch: true},

  {src: 'offer_bus', from: 630, dur: 60, rate: 0.895, push: [1.08, 1.02]},
  {src: 'offer_front', from: 690, dur: 60, rate: 0.975, push: [1.02, 1.08]},
];

// The seven "possibilities" that follow the hook "Every child holds a universe of possibilities".
export const IDENTITIES = [
  {article: 'An', word: 'EXPLORER'},
  {article: 'An', word: 'ARTIST'},
  {article: 'A', word: 'SCIENTIST'},
  {article: 'An', word: 'INNOVATOR'},
  {article: 'An', word: 'ATHLETE'},
  {article: 'A', word: 'PERFORMER'},
  {article: 'A', word: 'LEADER'},
];

export const FACILITIES = ['SCIENCE LABS', 'LIBRARY', 'COMPUTER LAB', 'SPORTS'];
