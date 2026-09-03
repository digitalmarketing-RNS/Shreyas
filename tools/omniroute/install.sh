#!/usr/bin/env bash
# Install and bootstrap OmniRoute (https://github.com/diegosouzapw/OmniRoute),
# a self-hosted AI gateway that fronts many providers behind one OpenAI-compatible
# endpoint.
#
# Usage:
#   ./install.sh                  # install, bootstrap, harden, verify
#   OMNIROUTE_VERSION=3.8.50 ./install.sh
#   OMNIROUTE_PASSWORD=... ./install.sh   # otherwise a password is generated
#
# The install is global (npm -g) and state lives in $HOME/.omniroute, so this is
# safe to re-run: npm upgrades in place and setup only resets the admin password.

set -euo pipefail

VERSION="${OMNIROUTE_VERSION:-latest}"
DATA_DIR="${DATA_DIR:-$HOME/.omniroute}"
PORT="${PORT:-20128}"

log() { printf '\033[36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. Preflight -------------------------------------------------------------
command -v node >/dev/null 2>&1 || die "node not found. OmniRoute needs Node >=22.22.2 (<23) or >=24 (<27)."
command -v npm  >/dev/null 2>&1 || die "npm not found."

# The package declares engines: >=22.22.2 <23 || >=24.0.0 <27. Node 23 and 27+
# are rejected by npm at install time, so fail early with a clearer message.
node -e '
  const [maj, min, pat] = process.versions.node.split(".").map(Number);
  const ok = (maj === 22 && (min > 22 || (min === 22 && pat >= 2))) || (maj >= 24 && maj < 27);
  if (!ok) {
    console.error(`Node ${process.versions.node} is unsupported; use >=22.22.2 <23 or >=24 <27.`);
    process.exit(1);
  }
' || die "unsupported Node version."

log "Node $(node -v), npm $(npm -v) — OK"

# --- 2. Install ---------------------------------------------------------------
# ~450 MB unpacked; this takes a couple of minutes. The ERESOLVE/deprecated
# warnings npm prints here are expected and documented as harmless upstream.
log "Installing omniroute@${VERSION} globally (this takes a few minutes)…"
npm install -g "omniroute@${VERSION}"

command -v omniroute >/dev/null 2>&1 || die "omniroute is not on PATH after install; check your npm global bin dir."
log "Installed omniroute $(omniroute --version 2>/dev/null | tail -1)"

# --- 3. Bootstrap -------------------------------------------------------------
# Creates $DATA_DIR/storage.sqlite and sets the dashboard admin password.
if [ -n "${OMNIROUTE_PASSWORD:-}" ]; then
  ADMIN_PW="$OMNIROUTE_PASSWORD"
  PW_SOURCE="OMNIROUTE_PASSWORD"
else
  ADMIN_PW="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
  PW_SOURCE="generated"
fi

log "Bootstrapping database and admin login…"
omniroute setup --non-interactive --password "$ADMIN_PW"

# --- 4. Harden ----------------------------------------------------------------
# By default the gateway binds 0.0.0.0 with no API-key requirement, which makes
# the inference plane reachable by anything that can route to this host (and
# bills your providers). Bind loopback unless the operator opted out.
ENV_FILE="$DATA_DIR/.env"
mkdir -p "$DATA_DIR"
if ! grep -q '^OMNIROUTE_SERVER_HOST=' "$ENV_FILE" 2>/dev/null; then
  printf '\n# Bind the gateway to loopback only (see server startup security notice).\n# Remove this line, or set REQUIRE_API_KEY=true, to expose it on the network.\nOMNIROUTE_SERVER_HOST=127.0.0.1\n' >> "$ENV_FILE"
  log "Pinned OMNIROUTE_SERVER_HOST=127.0.0.1 in $ENV_FILE"
fi

# --- 5. Verify ----------------------------------------------------------------
# doctor exits non-zero only on hard failures; "CLI ... not installed" warnings
# are expected on a server with no coding agents on it.
log "Running health checks…"
omniroute doctor --no-liveness || die "omniroute doctor reported failures."

cat <<EOF

$(printf '\033[32m✔ OmniRoute is installed.\033[0m')

  Start it:    omniroute --no-open
  Dashboard:   http://localhost:${PORT}
  API base:    http://localhost:${PORT}/v1
  Data dir:    ${DATA_DIR}

  Admin password (${PW_SOURCE}): ${ADMIN_PW}
  Store it now — it is not written to disk in plain text.

  Next: open the dashboard, connect a provider under "Providers", then mint an
  API key under "Endpoints" and point your client at the API base above.
EOF
