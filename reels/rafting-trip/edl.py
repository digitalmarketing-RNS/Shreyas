# Edit decision list for the rafting reel.
# Reel time 0 == song time SONG_IN in ilahi.wav. Cuts land on the song's beat grid
# (129.2 BPM, beat = 0.4645 s). Song landmarks in reel time:
#   0.00  last bar of the "ooh-aah" intro (drums)
#   1.84  "Shaamein malang si" - drums drop out (breakdown)
#  10.18  "baaghi udaan" (rebel flight)  -> Shreyas' leap off the raft
#  16.37  drums slam back in on "Ilahi mera JEE aaye aaye" -> the rapid
#  23.80  "na na na" section
#  36.81  end of the "na na na" phrase
SONG_IN = 27.56
FPS = 30

# Each shot: (name, reel_start, reel_end, kind, source, params)
#   video: src_in, cx = crop centre (0..1 of 1920 width) either a float or a list of
#          (source_time, cx) keyframes; nat = natural-sound gain; ramp = speed segments
#   photo: f0/f1 = focus point at start/end (0..1 of image), z0/z1 = zoom (1 = full height)
SHOTS = [
    # HOOK - flash-forward of the wildest moment (intro bar, drums)
    ("H1", 0.00, 1.84, "video", "GX019687", dict(src_in=1.60, cx=[(1.6, 0.50), (3.44, 0.53)], nat=1.0)),
    # BREAKDOWN - "Shaamein malang si, raatein surang si..." (the calm before)
    ("B1", 1.84, 3.65, "photo", "GOPR9654", dict(f0=(0.50, 0.52), f1=(0.50, 0.56), z0=1.0, z1=1.10)),
    ("B2", 3.65, 5.46, "photo", "DSC_0048", dict(f0=(0.56, 0.47), f1=(0.565, 0.46), z0=1.0, z1=1.14)),
    ("B3", 5.46, 7.27, "video", "GX019677", dict(src_in=6.00, cx=0.55, nat=0.35)),
    # "baaghi udaan pe hi" - Shreyas runs and leaps off the raft (slow-mo on the leap)
    ("B4", 7.27, 10.92, "video", "GX019670", dict(src_in=45.60, nat=0.9,
        cx=[(45.6, 0.45), (47.2, 0.53), (48.0, 0.55), (48.75, 0.50)],
        ramp=[(45.60, 47.75, 1.0), (47.75, 48.25, 0.5), (48.25, 48.75, 1.0)])),
    ("B6", 10.92, 12.73, "video", "GX019685", dict(src_in=32.20, cx=[(32.2, 0.47), (33.1, 0.62), (34.0, 0.70)], nat=0.5)),
    ("B7", 12.73, 14.56, "video", "GX019691", dict(src_in=2.00, cx=[(2.0, 0.52), (2.9, 0.52), (3.83, 0.60)], nat=0.5)),
    # build - nose of the raft tipping into the rapid
    ("B8", 14.56, 16.37, "video", "GX019686", dict(src_in=61.00, cx=0.50, nat=0.6)),
    # DROP - "Ilahi mera jee aaye aaye"
    ("D1", 16.37, 18.23, "video", "GX019694", dict(src_in=19.90, cx=0.45, nat=1.0)),
    ("D2", 18.23, 20.09, "video", "GX019686", dict(src_in=63.20, cx=0.55, nat=0.8)),
    ("D3", 20.09, 21.94, "photo", "DSC_0059", dict(f0=(0.58, 0.44), f1=(0.59, 0.43), z0=1.0, z1=1.16)),
    ("D4", 21.94, 23.80, "video", "GX019691", dict(src_in=13.00, cx=0.17, nat=0.8)),
    # "na na na" - the fun montage
    ("N1", 23.80, 24.73, "video", "GX019694", dict(src_in=14.00, cx=0.52, nat=0.8)),
    ("N2", 24.73, 25.66, "video", "GX019687", dict(src_in=6.20, cx=0.52, nat=0.8)),
    ("N3", 25.66, 27.52, "video", "GX019692", dict(src_in=0.00, cx=[(0.0, 0.42), (0.5, 0.45), (1.86, 0.40)], nat=0.8)),
    ("N4", 27.52, 28.45, "photo", "DSC_0072", dict(f0=(0.62, 0.48), f1=(0.62, 0.47), z0=1.0, z1=1.08)),
    ("N5", 28.45, 29.37, "video", "GX019686", dict(src_in=65.50, cx=0.58, nat=0.8)),
    ("N6", 29.37, 31.23, "video", "GX019691", dict(src_in=17.00, cx=[(17.0, 0.60), (18.0, 0.70), (18.86, 0.72)], nat=0.8)),
    # quick photo-dump beat: the squad's poses
    ("N7", 31.23, 32.16, "photo", "GOPR9660", dict(f0=(0.50, 0.56), f1=(0.50, 0.57), z0=1.05, z1=1.13)),
    ("N7b", 32.16, 33.09, "photo", "GOPR9662", dict(f0=(0.48, 0.54), f1=(0.48, 0.55), z0=1.05, z1=1.13)),
    # shore photographer's burst of the man-overboard moment (one photo per beat)
    ("N8", 33.09, 33.56, "photo", "DSC_0080", dict(f0=(0.30, 0.50), f1=(0.30, 0.50), z0=1.06, z1=1.10)),
    ("N8b", 33.56, 34.02, "photo", "DSC_0081", dict(f0=(0.70, 0.50), f1=(0.70, 0.50), z0=1.06, z1=1.10)),
    ("N8c", 34.02, 34.95, "photo", "DSC_0083", dict(f0=(0.76, 0.60), f1=(0.78, 0.62), z0=1.06, z1=1.18)),
    # outro - his grin to camera
    ("N9", 34.95, 37.40, "video", "GX019692", dict(src_in=35.60, cx=0.30, nat=1.0)),
]
REEL_LEN = 37.40

TEXT = dict(lines=["they said it'll be a", "“chill” rafting trip"], t_in=2.05, t_out=7.00)
