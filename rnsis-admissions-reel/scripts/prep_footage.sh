#!/usr/bin/env bash
# Cut the reel's shots out of the RNSIS brand film ("Rnsis Film v3.mp4", 3840x2160 @ 24fps)
# and reframe each one to 1080x1920 (9:16).
#
# Usage: scripts/prep_footage.sh /path/to/film.mp4 [out_dir]
#
# Each row: name  in(s)  out(s)  crop-centre-start  crop-centre-end
# Crop centre is the horizontal centre of the 9:16 window as a fraction of frame width;
# when start != end the window pans linearly across the clip (used to follow the high
# jumper and to sweep across the group shot). In/out points sit inside the film's own
# shot boundaries, so no clip contains a stray cut unless noted.
set -euo pipefail

FILM="${1:?path to film.mp4}"
OUT="${2:-$(dirname "$0")/../public/clips}"
mkdir -p "$OUT"

CW=1215   # 2160 * 9/16, rounded to an odd-free width that ffmpeg accepts
W=3840

SHOTS=$(cat <<'EOF'
hook_a        18.750  19.670  0.55  0.55
hook_c        87.830  89.080  0.47  0.47
id_explorer   17.375  18.375  0.50  0.50
id_artist     38.375  39.500  0.52  0.52
id_scientist  72.000  73.170  0.48  0.48
id_innovator  60.290  61.460  0.42  0.42
id_athlete    27.080  28.250  0.53  0.74
id_performer  84.625  85.580  0.30  0.30
id_leader     100.460 101.210 0.52  0.52
payoff_group  109.500 113.210 0.17  0.83
proof_drone   6.700   9.650   0.50  0.50
proof_little  19.750  20.670  0.30  0.30
proof_big     59.290  60.210  0.58  0.58
fac_lab       44.750  45.790  0.45  0.45
fac_library   49.290  50.670  0.50  0.50
fac_computer  62.290  63.500  0.50  0.50
fac_sports    93.460  94.580  0.60  0.60
offer_bus     107.580 109.420 0.50  0.50
offer_front   104.040 106.040 0.52  0.52
EOF
)

while read -r name tin tout c0 c1; do
  [ -z "$name" ] && continue
  dur=$(python3 -c "print(round($tout-$tin,3))")
  # x(t) = clamp(centre(t)*W - CW/2) with centre interpolated over the clip.
  xexpr="max(0\,min($W-$CW\,($c0+($c1-$c0)*t/$dur)*$W-$CW/2))"
  ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$tin" -t "$dur" -i "$FILM" -an \
    -vf "crop=$CW:2160:x='$xexpr':y=0,scale=1080:1920:flags=lanczos,setsar=1" \
    -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -r 24 -movflags +faststart \
    "$OUT/$name.mp4"
  echo "$name  ${dur}s"
done <<< "$SHOTS"

# Stills for the break card and end card backgrounds.
ffmpeg -hide_banner -loglevel error -y -ss 4.0 -i "$FILM" -frames:v 1 \
  -vf "crop=$CW:2160:x=($W-$CW)/2:y=0,scale=1080:1920:flags=lanczos" -q:v 2 "$OUT/still_aerial.jpg"
ffmpeg -hide_banner -loglevel error -y -ss 111.3 -i "$FILM" -frames:v 1 \
  -vf "crop=$CW:2160:x=($W-$CW)/2:y=0,scale=1080:1920:flags=lanczos" -q:v 2 "$OUT/still_group.jpg"
echo "stills done"

# Smooth slow motion for the two hook shots that play at ~0.65x (motion-interpolated to 60 fps).
for name in proof_little hook_a; do
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$OUT/$name.mp4" -an \
    -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -movflags +faststart "$OUT/${name}_smooth.mp4"
  echo "${name}_smooth done"
done
