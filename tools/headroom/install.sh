#!/usr/bin/env bash
# Install and bootstrap Headroom (https://github.com/headroomlabs-ai/headroom),
# a local context-compression layer that shrinks what an AI agent sends to the
# model. Compression runs on this machine; no prompt content leaves it.
#
# Usage:
#   ./install.sh                       # install, warm the model, verify
#   HEADROOM_EXTRAS=proxy ./install.sh # leaner install, skips the torch/CUDA wheels
#   HEADROOM_PORT=8787 ./install.sh
#
# Re-runnable: uv upgrades the tool in place and the model warmup is a no-op
# once the weights are cached.

set -euo pipefail

EXTRAS="${HEADROOM_EXTRAS:-all}"
PORT="${HEADROOM_PORT:-8787}"

log() { printf '\033[36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. Preflight -------------------------------------------------------------
command -v uv >/dev/null 2>&1 || die "uv not found. Install it: curl -LsSf https://astral.sh/uv/install.sh | sh"

# The CLI ships only in the PyPI package; the npm package of the same name is
# the TypeScript SDK and provides no `headroom` command.
log "Installing headroom-ai[${EXTRAS}] (uv-managed Python 3.13)…"

# --- 2. Install ---------------------------------------------------------------
# [all] resolves the CUDA build of torch — roughly 6.6 GB installed, most of it
# unused on a CPU-only host. HEADROOM_EXTRAS=proxy is the lean alternative; the
# compressor that actually runs is the int8 ONNX model, and onnxruntime is in
# [proxy]. uv downloads Python 3.13 itself if the host lacks it.
uv tool install --python 3.13 "headroom-ai[${EXTRAS}]"

# uv puts the shim in ~/.local/bin, which is not always on PATH yet.
export PATH="$HOME/.local/bin:$PATH"
command -v headroom >/dev/null 2>&1 || die "headroom is not on PATH; add \$HOME/.local/bin to it."
log "Installed $(headroom --version)"

# --- 3. Warm the compression model --------------------------------------------
# This step is the reason this script exists. The Kompress weights (~274 MB) are
# fetched from HuggingFace lazily, and until they are cached every request
# passes through UNCOMPRESSED — the only signal is one log line reading
# "Kompress model not ready; requests will not be compressed". Savings look like
# a silent 0%, not an error. Warm it once, up front, where a failure is visible.
log "Downloading and warming the Kompress model (~274 MB, once)…"
TOOL_PY="$(uv tool dir)/headroom-ai/bin/python"
[ -x "$TOOL_PY" ] || die "could not locate the headroom tool environment at $TOOL_PY"

"$TOOL_PY" - <<'PY' || die "model warmup failed — check HuggingFace connectivity."
import sys
from headroom.transforms.kompress_compressor import (
    prefetch_kompress_artifacts, warm_kompress_model,
)
if not prefetch_kompress_artifacts():
    print("could not fetch Kompress artifacts from HuggingFace", file=sys.stderr)
    sys.exit(1)
if not warm_kompress_model():
    print("Kompress artifacts cached but the model failed to initialize", file=sys.stderr)
    sys.exit(1)
print("Kompress model cached and initialized.")
PY

# --- 4. Verify ----------------------------------------------------------------
# doctor reports the proxy as a failure when it is not running, which is the
# expected state right after install, so its exit code is not a useful gate
# here. Prove compression instead: the model either shrinks text or it does not.
log "Verifying compression actually runs…"
"$TOOL_PY" - <<'PY' || die "compression check failed."
import sys
from headroom.transforms import kompress_compressor as kc
kc.warm_kompress_model()
c = kc.KompressCompressor()
if not c.is_ready():
    print("compressor reports not ready after warmup", file=sys.stderr)
    sys.exit(1)
prose = ("The quarterly review covered a broad range of operational topics. "
         "Attendees discussed the migration effort, which remains on schedule. "
         "Several teams raised concerns about capacity over the holidays. ") * 40
out = str(c.compress(prose, allow_download=False).compressed)
if len(out) >= len(prose):
    print(f"model ran but did not compress ({len(prose)} -> {len(out)} chars)", file=sys.stderr)
    sys.exit(1)
print(f"compression OK: {len(prose)} -> {len(out)} chars ({1 - len(out)/len(prose):.0%} smaller)")
PY

cat <<EOF

$(printf '\033[32m✔ Headroom is installed and the model is warm.\033[0m')

  Start the proxy:  headroom proxy --port ${PORT}
  Health:           http://127.0.0.1:${PORT}/health
  Check routing:    headroom doctor
  Savings:          headroom savings

  Point a client at it:
    Claude Code:  ANTHROPIC_BASE_URL=http://127.0.0.1:${PORT} claude
    OpenAI apps:  OPENAI_BASE_URL=http://127.0.0.1:${PORT}/v1

  Or wrap an agent in one step:  headroom wrap claude    (undo: headroom unwrap claude)
EOF
