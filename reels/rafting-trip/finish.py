"""Mix audio (song + natural sound + transition SFX) and export the final reel files."""
import subprocess, sys, json, os
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edl
from edl import SONG, SONG_IN, REEL_LEN, TEXT, MUSIC_ENV, NAT_ENV, FADE_OUT, SHOTS

SR = 48000
N = int(round(REEL_LEN * SR))
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else "out"
VIDEO = "video_fx.mp4" if os.path.exists("video_fx.mp4") else "video.mp4"
os.makedirs(OUTDIR, exist_ok=True)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)
    return r


def env(points):
    """Piecewise-linear gain envelope from (time, gain) points."""
    t = np.arange(N) / SR
    ts, gs = zip(*points)
    return np.interp(t, ts, gs).astype(np.float32)[:, None]


# --- audio -----------------------------------------------------------------
run(["ffmpeg", "-v", "error", "-y", "-ss", f"{SONG_IN}", "-t", f"{REEL_LEN + 0.5}", "-i", SONG,
     "-ar", str(SR), "-ac", "2", "music_seg.wav"])
music, _ = sf.read("music_seg.wav", dtype="float32"); music = music[:N]
nat, _ = sf.read("nat.wav", dtype="float32"); nat = np.pad(nat, ((0, max(0, N - len(nat))), (0, 0)))[:N]
# clean GoPro rumble/hiss
nat = sosfilt(butter(4, [120, 9000], btype="band", fs=SR, output="sos"), nat, axis=0).astype(np.float32)

# "underwater" muffle on the music while he is in the air
muffle = getattr(edl, "MUFFLE", None)
if muffle:
    lp = sosfilt(butter(4, 450, btype="low", fs=SR, output="sos"), music, axis=0).astype(np.float32)
    b = env(muffle)
    music = music * (1 - b) + lp * 1.4 * b

# transition SFX: a filtered-noise whoosh on whip / zoom / spin cuts, a sub boom on the drop
rng = np.random.default_rng(7)
sfx = np.zeros((N, 2), np.float32)
whoosh_src = sosfilt(butter(2, [500, 6000], btype="band", fs=SR, output="sos"),
                     rng.standard_normal((int(0.5 * SR), 2)), axis=0).astype(np.float32)
for name, a, *_ in SHOTS:
    kind = getattr(edl, "TRANSITIONS", {}).get(name)
    if not kind:
        continue
    c = int(a * SR)
    if kind in ("whip_l", "whip_r", "zoom", "spin", "drop"):
        L = int(0.32 * SR); t = np.linspace(0, 1, L)
        shape = (np.sin(np.pi * t) ** 2 * (t ** 0.6)).astype(np.float32)[:, None]  # swells into the cut
        s0 = c - int(0.22 * SR)
        seg = whoosh_src[:L] * shape * (0.10 if kind != "drop" else 0.16)
        if kind == "whip_l": seg = seg * np.array([1.0, 0.6], np.float32)
        if kind == "whip_r": seg = seg * np.array([0.6, 1.0], np.float32)
        lo, hi = max(0, s0), min(N, s0 + L)
        sfx[lo:hi] += seg[lo - s0:hi - s0]
    if kind == "drop":
        L = int(0.9 * SR); t = np.arange(L) / SR
        boom = (np.sin(2 * np.pi * (58 - 18 * t) * t) * np.exp(-t * 4.5)).astype(np.float32)[:, None] * 0.45
        hi = min(N, c + L); sfx[c:hi] += np.repeat(boom[:hi - c], 2, axis=1)

m_env = env(MUSIC_ENV)
n_env = env(NAT_ENV)
mix = music * m_env + nat * n_env + sfx
nomusic = nat * env([(0, 1.0), (REEL_LEN, 1.0)]) + sfx


def loudnorm(x, name):
    """Two-pass EBU R128 normalisation to Instagram-friendly -14 LUFS / -1.5 dBTP."""
    raw = f"{name}_raw.wav"; out = f"{name}.wav"
    sf.write(raw, x, SR, subtype="FLOAT")  # float, so peaks above 0 dBFS are not clipped before normalising
    f = "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json"
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", raw, "-af", f, "-f", "null", "-"])
    j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    f2 = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    # brick-wall limiter after normalising: the drop boom and splash transients stay under -1.5 dBFS
    run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
         f2 + f",aresample={SR},alimiter=limit=0.80:attack=2:release=60:level=false", "-ar", str(SR), out])
    return out


mix_wav = loudnorm(mix, "mix")
nat_wav = loudnorm(nomusic, "natonly")

# --- optional hook text ------------------------------------------------------
W, H = 1080, 1920
fade = f"fade=out:st={REEL_LEN - FADE_OUT:.3f}:d={FADE_OUT}"
if TEXT:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fonts = [ImageFont.truetype("fonts/Poppins-Medium.ttf", 50), ImageFont.truetype("fonts/Poppins-Bold.ttf", 80)]
    ys = [430, 492]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    soft = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dsoft = ImageDraw.Draw(soft)
    tight = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dtight = ImageDraw.Draw(tight)
    for line, font, y in zip(TEXT["lines"], fonts, ys):
        x = (W - d.textlength(line, font=font)) / 2
        dsoft.text((x, y + 4), line, font=font, fill=(0, 0, 0, 185))
        dtight.text((x, y + 2), line, font=font, fill=(0, 0, 0, 120))
        d.text((x, y), line, font=font, fill=(255, 255, 255, 255))
    # wide soft glow keeps the text readable over bright sky and cloud, tight one adds crispness
    soft = soft.filter(ImageFilter.GaussianBlur(14)); tight = tight.filter(ImageFilter.GaussianBlur(3))
    for lay in (soft, soft, tight, layer):
        img = Image.alpha_composite(img, lay)
    img.save("text.png")
    t_in, t_out = TEXT["t_in"], TEXT["t_out"]
    graph = (f"[1:v]format=rgba,fade=in:st={t_in}:d=0.25:alpha=1,fade=out:st={t_out - 0.25}:d=0.25:alpha=1[t];"
             f"[0:v][t]overlay=0:0:shortest=1,{fade},format=yuv420p[v]")
else:
    graph = f"[0:v]{fade},format=yuv420p[v]"


def export(audio, path):
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", VIDEO]
    if TEXT:
        cmd += ["-loop", "1", "-framerate", "30", "-t", f"{REEL_LEN}", "-i", "text.png"]
    cmd += ["-i", audio, "-filter_complex", graph, "-map", "[v]", "-map", f"{2 if TEXT else 1}:a",
            "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-maxrate", "16M", "-bufsize", "32M",
            "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p", "-r", "30", "-g", "60",
            "-c:a", "aac", "-aac_coder", "twoloop", "-b:a", "320k", "-ar", str(SR), "-movflags", "+faststart", "-t", f"{REEL_LEN}", path]
    run(cmd)
    print("wrote", path)


export(mix_wav, f"{OUTDIR}/rafting_reel_final.mp4")
export(nat_wav, f"{OUTDIR}/rafting_reel_no_music.mp4")
