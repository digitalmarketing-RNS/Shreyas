# Edit decision list for the rafting reel (v4), built around Shreyas (red t-shirt,
# blue life jacket), using only shots where he is clearly visible and looks good.
# Song: "Ik Junoon (Paint It Red)" - Zindagi Na Milegi Dobara, 126 BPM.
# Reel time 0 == song time SONG_IN; every cut sits on a detected beat.
#   0.00-4.17  quiet guitar build  -> calm water, smiles, paddle cheer
#   4.17       the drop (full kit)  -> zoom punch into the rapid
#  17.19-19.88 his leap in slow-mo, music muffled as if underwater
#  19.88       splash on the beat, music fades out
SONG = "music/ikjunoon.wav"
SONG_IN = 13.351
FPS = 30

# Each shot: (name, reel_start, reel_end, kind, source, params)
#   video: src_in; track=True follows Shreyas' face (face tracker, cached), with
#          cx (0..1 of frame width, float or [(source_time, cx), ...]) as the
#          fallback/override; zoom (1 = full-height 9:16 crop); nat = natural-sound
#          gain; ramp = [(src_from, src_to, speed), ...] for speed ramps
#   photo: face = (x, y) override for his position, z0/z1 = zoom at start/end,
#          lift = how far below his face the frame centre sits (fraction of crop),
#          flash = camera-shutter flash on the cut
SHOTS = [
    # BUILD - calm water
    ("S1", 0.00, 1.43, "video", "GX019670", dict(src_in=4.60, track=True, cx=0.58, zoom=1.6, nat=0.5)),
    ("S2", 1.43, 2.86, "video", "GX019677", dict(src_in=2.50, track=True, cx=0.74, zoom=1.4, nat=0.5)),
    ("S3", 2.86, 4.17, "video", "GX019686", dict(src_in=0.60, track=True, cx=0.74, zoom=1.2, nat=0.6)),
    # DROP - the rapid: the DSLR hero shot wide, then punched in tight on his face
    ("D1", 4.17, 5.11, "photo", "DSC_0059", dict(z0=1.05, z1=1.2, lift=0.12, flash=True)),
    ("D1b", 5.11, 6.06, "photo", "DSC_0059", dict(z0=2.7, z1=2.9, lift=0.10)),
    ("D2", 6.06, 7.01, "photo", "DSC_0072", dict(z0=2.0, z1=2.2, lift=0.12)),
    ("D3", 7.01, 8.92, "video", "GX019691", dict(src_in=17.90, track=True, cx=0.33, zoom=1.35, nat=0.7)),
    ("D4", 8.92, 9.88, "video", "GX019686", dict(src_in=119.10, track=True, cx=0.72, zoom=1.8, nat=0.7)),
    # poses and calm-water smiles
    ("M1", 9.88, 10.82, "photo", "GOPR9660", dict(z0=2.5, z1=2.75, lift=0.10, flash=True)),
    ("M2", 10.82, 11.78, "photo", "GOPR9666", dict(z0=2.1, z1=2.4, lift=0.22, flash=True)),
    ("M3", 11.78, 12.74, "video", "GX019678", dict(src_in=5.50, track=True, cx=0.68, zoom=1.5, nat=0.5)),
    ("M4", 12.74, 14.64, "video", "GX019670", dict(src_in=11.00, track=True, cx=0.66, zoom=1.6, nat=0.5)),
    # FINALE - on the raft edge, the leap in slow-mo, splash on the beat
    ("F1", 14.64, 21.35, "video", "GX019670", dict(src_in=55.90, nat=1.0,
        cx=[(55.9, 0.47), (57.5, 0.47), (58.25, 0.50), (58.6, 0.47), (59.0, 0.50), (59.5, 0.57),
            (60.0, 0.60), (60.45, 0.59), (61.0, 0.58), (61.3, 0.57)],
        ramp=[(55.90, 58.45, 1.0), (58.45, 59.65, 0.48), (59.65, 61.30, 1.0)])),
]
REEL_LEN = 21.35
TEXT = None  # no on-screen text

# Transition into each shot, applied around the cut (see fx.py):
#   zoom = zoom-blur punch, whip_l / whip_r = whip pan, spin = rotate-blur,
#   drop = big zoom punch + shake + RGB split, flash = punch-in after a shutter flash
TRANSITIONS = {
    "S2": "zoom", "S3": "whip_l", "D1": "drop", "D1b": "zoom", "D2": "whip_r", "D3": "spin",
    "D4": "zoom", "M1": "flash", "M2": "flash", "M3": "whip_r", "M4": "zoom", "F1": "whip_l",
}
SHAKES = [(19.88, 0.35, 16)]  # (reel time, duration, pixels) - the splash
FADE_OUT = 0.6

# audio (reel time, gain)
TAKEOFF, SPLASH = 17.19, 19.88
MUSIC_ENV = [(0, 1.0), (TAKEOFF, 1.0), (TAKEOFF + 0.3, 0.75), (SPLASH, 0.75), (SPLASH + 0.05, 1.0),
             (SPLASH + 0.3, 0.9), (REEL_LEN, 0.0)]
MUFFLE = [(0, 0), (TAKEOFF, 0), (TAKEOFF + 0.3, 1), (SPLASH - 0.02, 1), (SPLASH, 0), (REEL_LEN, 0)]
NAT_ENV = [(0, 0.35), (4.10, 0.35), (4.17, 0.8), (5.0, 0.8), (5.5, 0.4), (TAKEOFF - 0.4, 0.4),
           (TAKEOFF, 0.7), (SPLASH - 0.1, 0.7), (SPLASH, 1.1), (REEL_LEN, 1.0)]
