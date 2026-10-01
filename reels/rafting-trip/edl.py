# Edit decision list for the rafting reel, built around Shreyas (red t-shirt,
# blue life jacket). Reel time 0 == song time SONG_IN in ilahi.wav and every cut
# sits on a detected beat of the song (129.2 BPM). Song landmarks in reel time:
#   0.00  last bar of the "ooh-aah" intro (drums)
#   1.84  "Shaamein malang si" - drums drop out (breakdown)
#  16.37  drums slam back in on "Ilahi mera JEE aaye aaye" -> the rapid
#  23.64  "na na na" section
#  36.81  end of the "na na na" phrase -> the splash of his jump, music fades
SONG_IN = 27.56
FPS = 30

# Each shot: (name, reel_start, reel_end, kind, source, params)
#   video: src_in; track=True follows Shreyas' face (face tracker, cached), with
#          cx (0..1 of frame width, float or [(source_time, cx), ...]) as the
#          fallback/override; zoom (1 = full-height 9:16 crop); nat = natural-sound
#          gain; ramp = [(src_from, src_to, speed), ...] for speed ramps
#   photo: face = (x, y) override for his position, z0/z1 = zoom at start/end, lift = how far below his face the frame
#          centre sits (fraction of crop); flash = camera-shutter flash on the cut
SHOTS = [
    # HOOK - flash-forward: his raft slamming into the big rapid, slow-mo on impact
    ("H1", 0.00, 1.84, "video", "GX019687", dict(src_in=1.75, cx=[(1.6, 0.50), (3.44, 0.53)], nat=1.0,
        ramp=[(1.75, 2.55, 1.0), (2.55, 3.10, 0.5)])),
    # BREAKDOWN - "Shaamein malang si..." the calm before (hook text on top)
    ("B1", 1.84, 3.65, "video", "GX019670", dict(src_in=7.00, track=True, cx=0.76, zoom=1.45, nat=0.35)),
    ("B2", 3.65, 5.46, "photo", "GOPR9654", dict(z0=2.0, z1=2.5, lift=0.04)),
    ("B3", 5.46, 7.27, "video", "GX019677", dict(src_in=2.50, track=True, cx=0.78, zoom=1.3, nat=0.35)),
    ("B4", 7.27, 9.10, "photo", "GOPR9680", dict(z0=2.3, z1=2.7, lift=0.10)),
    ("B5", 9.10, 10.92, "video", "GX019652", dict(src_in=0.00, track=True, cx=0.48, zoom=1.3, nat=0.5)),
    ("B6", 10.92, 12.73, "video", "GX019691", dict(src_in=17.90, track=True, cx=0.33, zoom=1.35, nat=0.5)),
    # build - raft lining up for the rapid, then the nose tipping in
    ("B7", 12.73, 14.56, "video", "GX019686", dict(src_in=56.00, cx=0.50, nat=0.6)),
    ("B8", 14.56, 16.37, "video", "GX019686", dict(src_in=61.00, cx=0.50, nat=0.7)),
    # DROP - "Ilahi mera jee aaye aaye"
    ("D1", 16.37, 18.18, "video", "GX019694", dict(src_in=19.90, cx=0.45, nat=1.0,
        ramp=[(19.90, 20.50, 1.0), (20.50, 21.15, 0.5)])),
    ("D2", 18.18, 20.02, "photo", "DSC_0059", dict(z0=1.25, z1=1.9, lift=0.12, flash=True)),
    # photographer's burst, one frame per beat
    ("D3", 20.02, 20.46, "photo", "DSC_0042", dict(z0=1.9, z1=1.95, lift=0.12, flash=True)),
    ("D3b", 20.46, 20.92, "photo", "DSC_0043", dict(z0=1.9, z1=1.95, lift=0.12, flash=True)),
    ("D3c", 20.92, 21.83, "photo", "DSC_0048", dict(z0=1.7, z1=1.85, lift=0.12, flash=True)),
    ("D4", 21.83, 23.64, "video", "GX019694", dict(src_in=2.50, track=True, cx=0.62, zoom=1.3, nat=0.9)),
    # "na na na" - the fun montage
    ("N1", 23.64, 25.45, "video", "GX019686", dict(src_in=0.60, track=True, cx=0.74, zoom=1.2, nat=0.8)),
    ("N2", 25.45, 26.36, "photo", "DSC_0072", dict(z0=2.0, z1=2.2, lift=0.12, flash=True)),
    ("N3", 26.36, 27.29, "video", "GX019686", dict(src_in=119.05, track=True, cx=0.72, zoom=1.2, nat=0.8)),
    ("N4", 27.29, 29.10, "video", "GX019652", dict(src_in=20.00, track=True, cx=0.60, zoom=1.45, nat=0.6)),
    ("N5", 29.10, 29.56, "photo", "GOPR9660", dict(z0=2.6, z1=2.7, lift=0.10, flash=True)),
    ("N6", 29.56, 30.00, "photo", "GOPR9662", dict(z0=2.9, z1=3.0, lift=0.04, flash=True,
        face=(0.626, 0.60))),  # mid-dab, face hidden in his arm, so placed by hand
    ("N7", 30.00, 30.91, "video", "GX019670", dict(src_in=0.00, track=True, cx=0.76, zoom=1.4, nat=0.6)),
    # him standing on the raft... (photo) -> standing on the edge (video), match cut
    ("N8", 30.91, 32.74, "photo", "GOPR9666", dict(z0=2.1, z1=2.5, lift=0.22, flash=True)),
    # FINALE - the jump: real time on the edge, slow-mo flight, splash on the last beat
    ("F1", 32.74, 38.36, "video", "GX019670", dict(src_in=56.88, nat=1.0,
        cx=[(56.9, 0.47), (57.5, 0.47), (58.25, 0.50), (58.6, 0.47), (59.0, 0.50), (59.5, 0.57),
            (60.0, 0.60), (60.45, 0.59), (61.0, 0.58), (61.3, 0.57)],
        ramp=[(56.88, 58.45, 1.0), (58.45, 59.65, 0.5), (59.65, 61.30, 1.0)])),
]
REEL_LEN = 38.36

TEXT = dict(lines=["they said it'll be a", "“chill” rafting trip"], t_in=2.05, t_out=7.00)

# audio envelopes (reel time, gain)
MUSIC_ENV = [(0, 0.62), (1.80, 0.62), (1.84, 1.0), (36.85, 1.0), (37.95, 0.0), (38.36, 0.0)]
NAT_ENV = [(0, 1.0), (1.82, 1.0), (1.86, 0.30), (16.30, 0.30), (16.37, 0.75), (17.6, 0.75), (18.0, 0.45),
           (36.55, 0.45), (36.80, 1.0), (38.36, 1.0)]
FADE_OUT = 0.7  # seconds of fade to black at the end
