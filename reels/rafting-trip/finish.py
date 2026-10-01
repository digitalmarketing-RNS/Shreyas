"""Mix audio, overlay the hook text and export the final reel files."""
import subprocess, sys, json, os
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edl import SONG_IN, REEL_LEN, TEXT, MUSIC_ENV, NAT_ENV, FADE_OUT

SR = 48000
N = int(round(REEL_LEN * SR))
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else "out"
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
run(["ffmpeg", "-v", "error", "-y", "-ss", f"{SONG_IN}", "-t", f"{REEL_LEN + 0.5}", "-i", "music/ilahi.wav",
     "-ar", str(SR), "-ac", "2", "music_seg.wav"])
music, _ = sf.read("music_seg.wav", dtype="float32"); music = music[:N]
nat, _ = sf.read("nat.wav", dtype="float32"); nat = nat[:N]
# clean GoPro rumble/hiss
sos = butter(4, [120, 9000], btype="band", fs=SR, output="sos")
nat = sosfilt(sos, nat, axis=0).astype(np.float32)

# music: tucked under the hook's screams, full from the breakdown, fades after the
# splash; natural sound: loud on the hook, low under the song, swells for the drop
# and for the splash as the song fades
m_env = env(MUSIC_ENV)
n_env = env(NAT_ENV)

mix = music * m_env + nat * n_env
nomusic = nat * env([(0, 1.0), (37.4, 1.0)])


def loudnorm(x, name):
    """Two-pass EBU R128 normalisation to Instagram-friendly -14 LUFS / -1.5 dBTP."""
    raw = f"{name}_raw.wav"; out = f"{name}.wav"
    sf.write(raw, x, SR)
    f = "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json"
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", raw, "-af", f, "-f", "null", "-"])
    j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    f2 = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", f2 + f",aresample={SR}", "-ar", str(SR), out])
    return out


mix_wav = loudnorm(mix, "mix")
nat_wav = loudnorm(nomusic, "natonly")

# --- hook text ---------------------------------------------------------------
W, H = 1080, 1920
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fonts = [ImageFont.truetype("fonts/Poppins-Medium.ttf", 50), ImageFont.truetype("fonts/Poppins-Bold.ttf", 80)]
ys = [430, 492]
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
soft = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dsoft = ImageDraw.Draw(soft)
tight = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dtight = ImageDraw.Draw(tight)
for line, font, y in zip(TEXT["lines"], fonts, ys):
    w = d.textlength(line, font=font)
    x = (W - w) / 2
    dsoft.text((x, y + 4), line, font=font, fill=(0, 0, 0, 185))
    dtight.text((x, y + 2), line, font=font, fill=(0, 0, 0, 120))
    d.text((x, y), line, font=font, fill=(255, 255, 255, 255))
# wide soft glow keeps the text readable over bright sky and cloud, tight one adds crispness
soft = soft.filter(ImageFilter.GaussianBlur(14))
tight = tight.filter(ImageFilter.GaussianBlur(3))
for lay in (soft, soft, tight, layer):
    img = Image.alpha_composite(img, lay)
img.save("text.png")

t_in, t_out = TEXT["t_in"], TEXT["t_out"]
overlay = (f"[1:v]format=rgba,fade=in:st={t_in}:d=0.25:alpha=1,fade=out:st={t_out - 0.25}:d=0.25:alpha=1[t];"
           f"[0:v][t]overlay=0:0:shortest=1,fade=out:st={REEL_LEN - FADE_OUT:.3f}:d={FADE_OUT},format=yuv420p[v]")


def export(audio, path, text=True):
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", "video.mp4"]
    if text:
        cmd += ["-loop", "1", "-framerate", "30", "-t", f"{REEL_LEN}", "-i", "text.png", "-i", audio,
                "-filter_complex", overlay, "-map", "[v]", "-map", "2:a"]
    else:
        cmd += ["-i", audio, "-map", "0:v", "-map", "1:a"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-maxrate", "16M", "-bufsize", "32M", "-profile:v", "high", "-level", "4.1",
            "-pix_fmt", "yuv420p", "-r", "30", "-g", "60", "-c:a", "aac", "-b:a", "256k", "-ar", str(SR),
            "-movflags", "+faststart", "-t", f"{REEL_LEN}", path]
    run(cmd)
    print("wrote", path)


export(mix_wav, f"{OUTDIR}/rafting_reel_final.mp4")
export(nat_wav, f"{OUTDIR}/rafting_reel_no_music.mp4")
