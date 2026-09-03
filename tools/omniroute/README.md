# OmniRoute

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) is a self-hosted AI gateway.
It puts many upstream providers behind a single OpenAI-compatible endpoint and
handles routing and fallback, so a coding tool points at one base URL instead of
juggling per-provider SDKs and keys.

`install.sh` installs and bootstraps it end to end.

## Install

```bash
./install.sh
```

Pin a version or supply your own admin password:

```bash
OMNIROUTE_VERSION=3.8.50 OMNIROUTE_PASSWORD='…' ./install.sh
```

The script installs the global npm package, creates the SQLite database, sets the
dashboard password, pins the server to loopback, and runs the health checks. It is
safe to re-run — npm upgrades in place, and only the admin password is reset.

## Requirements

- Node `>=22.22.2 <23` or `>=24 <27` (the package's declared `engines`; the script
  fails early with a clear message on anything else)
- ~500 MB of disk for the global install

## Run

```bash
omniroute --no-open      # start; omit --no-open to launch a browser
```

| | |
|---|---|
| Dashboard | `http://localhost:20128` |
| API base | `http://localhost:20128/v1` |
| Data dir | `~/.omniroute` (DB, `.env`, logs) |

Then: connect a provider under **Providers**, mint a key under **Endpoints**, and
point your client at the API base with that key. `model: auto` uses OmniRoute's
routing; a specific `provider/model` bypasses it.

```bash
curl http://localhost:20128/v1/models -H "Authorization: Bearer YOUR_KEY"
```

## Useful commands

| Command | Purpose |
|---|---|
| `omniroute doctor --no-liveness` | Health checks without starting the server |
| `omniroute status` | Version, DB, and detected CLI tools |
| `omniroute providers list` | Provider connections |
| `omniroute logs --follow` | Stream usage logs |
| `omniroute-reset-password` | Recover dashboard access |

## Notes

**Binding.** OmniRoute defaults to `0.0.0.0` with no API-key requirement, which
leaves `/v1/*` reachable by anything that can route to the host — and those
requests bill your providers. The script therefore writes
`OMNIROUTE_SERVER_HOST=127.0.0.1` into `~/.omniroute/.env`. To expose it
deliberately, remove that line and set `REQUIRE_API_KEY=true`.

**Memory.** The default heap is small. Coding agents driving `/v1/responses` with
long contexts need much more, or the process dies with a V8 fatal error — set
`OMNIROUTE_MEMORY_MB=8192` for one agent, `10240`–`12288` for two concurrent long
requests.

**Install warnings.** npm prints `ERESOLVE` peer-dependency and `deprecated`
warnings during install. Those are expected and documented as harmless upstream.

**Secrets.** `~/.omniroute/.env` holds `STORAGE_ENCRYPTION_KEY`, which decrypts the
provider keys in `storage.sqlite`. Back it up with the database; losing it makes
stored credentials unrecoverable. Never commit it.
