# Edit decision list for the rafting reel, built around Shreyas (red t-shirt,
# blue life jacket). Reel time 0 == song time SONG_IN in ilahi.wav and every cut
# sits on a detected beat of the song (129.2 BPM). Song landmarks in reel time:
#   0.00  last bar of the "ooh-aah" intro (drums)
#   1.84  "Shaamein malang si" - drums drop out (breakdown)
#  10.18  "baaghi udaan" (rebel flight)  -> Shreyas' leap off the raft
#  16.37  drums slam back in on "Ilahi mera JEE aaye aaye" -> the rapid
#  23.64  "na na na" section
SONG_IN = 27.56
FPS = 30

# Each shot: (name, reel_start, reel_end, kind, source, params)
#   video: src_in; track=True follows Shreyas' face (face tracker, cached), with
#          cx (0..1 of frame width, float or [(source_time, cx), ...]) as the
#          fallback/override; zoom (1 = full-height 9:16 crop); nat = natural-sound
#          gain; ramp = [(src_from, src_to, speed), ...]
#   photo: face = where his face is (0..1 of image), z0/z1 = zoom at start/end,
#          lift = how far below his face the frame centre sits (fraction of crop)
SHOTS = [
    # HOOK - flash-forward: his raft slamming into the big rapid
    ("H1", 0.00, 1.84, "video", "GX019687", dict(src_in=1.60, cx=[(1.6, 0.50), (3.44, 0.53)], nat=1.0)),
    # BREAKDOWN - "Shaamein malang si..." the calm before (hook text on top)
    ("B1", 1.84, 3.65, "video", "GX019670", dict(src_in=7.00, track=True, cx=0.76, zoom=1.45, nat=0.35)),
    ("B2", 3.65, 5.46, "photo", "GOPR9654", dict(z0=2.0, z1=2.5, lift=0.04)),
    ("B3", 5.46, 7.27, "video", "GX019677", dict(src_in=2.50, track=True, cx=0.78, zoom=1.3, nat=0.35)),
    # "baaghi udaan pe hi" - Shreyas runs and leaps off the raft, slow-mo on the flight
    ("B4", 7.27, 11.82, "video", "GX019670", dict(src_in=56.90, nat=0.9,
        cx=[(56.9, 0.47), (57.5, 0.47), (58.25, 0.50), (58.6, 0.47), (59.0, 0.50), (59.5, 0.57), (60.0, 0.60), (60.45, 0.59)],
        ramp=[(56.90, 58.55, 1.0), (58.55, 59.55, 0.5), (59.55, 60.45, 1.0)])),
    ("B6", 11.82, 12.73, "photo", "GOPR9680", dict(z0=2.4, z1=2.7, lift=0.10)),
    ("B7", 12.73, 14.56, "video", "GX019691", dict(src_in=17.90, track=True, cx=0.33, zoom=1.35, nat=0.5)),
    # build - nose of the raft tipping into the rapid
    ("B8", 14.56, 16.37, "video", "GX019686", dict(src_in=61.00, cx=0.50, nat=0.6)),
    # DROP - "Ilahi mera jee aaye aaye"
    ("D1", 16.37, 18.18, "video", "GX019694", dict(src_in=19.90, cx=0.45, nat=1.0)),
    ("D2", 18.18, 20.02, "photo", "DSC_0059", dict(z0=1.25, z1=1.9, lift=0.12)),
    ("D3", 20.02, 21.83, "video", "GX019694", dict(src_in=2.50, track=True, cx=0.62, zoom=1.45, nat=0.9)),
    ("D4", 21.83, 23.64, "photo", "DSC_0048", dict(z0=1.4, z1=1.9, lift=0.12)),
    # "na na na" - the fun montage, all him
    ("N1", 23.64, 24.55, "photo", "DSC_0042", dict(z0=2.0, z1=2.15, lift=0.12)),
    ("N2", 24.55, 25.45, "photo", "DSC_0043", dict(z0=2.0, z1=2.15, lift=0.12)),
    ("N3", 25.45, 27.29, "video", "GX019686", dict(src_in=0.60, track=True, cx=0.74, zoom=1.2, nat=0.8)),
    ("N4", 27.29, 28.19, "photo", "DSC_0072", dict(z0=2.0, z1=2.2, lift=0.12)),
    ("N5", 28.19, 29.10, "video", "GX019686", dict(src_in=119.05, track=True, cx=0.72, zoom=1.2, nat=0.8)),
    ("N6", 29.10, 30.91, "video", "GX019652", dict(src_in=20.00, track=True, cx=0.60, zoom=1.45, nat=0.6)),
    # photo dump: his poses with the squad
    ("N7", 30.91, 31.81, "photo", "GOPR9660", dict(z0=2.5, z1=2.8, lift=0.10)),
    ("N7b", 31.81, 32.74, "photo", "GOPR9662", dict(z0=2.5, z1=2.8, lift=0.10)),
    ("N8", 32.74, 34.55, "photo", "GOPR9666", dict(z0=2.1, z1=2.5, lift=0.22)),
    # outro - his smile to camera as the song fades
    ("N9", 34.55, 37.40, "video", "GX019670", dict(src_in=3.20, track=True, cx=0.62, zoom=1.6, nat=1.0)),
]
REEL_LEN = 37.40

TEXT = dict(lines=["they said it'll be a", "“chill” rafting trip"], t_in=2.05, t_out=7.00)
