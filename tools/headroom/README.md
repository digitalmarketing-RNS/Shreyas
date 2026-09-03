# Headroom

[Headroom](https://github.com/headroomlabs-ai/headroom) compresses what an AI
agent sends to a model — tool outputs, logs, RAG chunks, files, conversation
history — before it leaves your machine. Compression runs locally; no prompt
content is sent anywhere to be compressed.

`install.sh` installs it, downloads the compression model, and proves the model
actually compresses before it reports success.

## Install

```bash
./install.sh
```

```bash
HEADROOM_EXTRAS=proxy ./install.sh    # lean: skips the torch/CUDA wheels
```

Requires [`uv`](https://astral.sh/uv). It fetches its own Python 3.13, so the
host Python version does not matter.

## Run

```bash
headroom proxy --port 8787
```

| | |
|---|---|
| Health | `http://127.0.0.1:8787/health` |
| Stats | `http://127.0.0.1:8787/stats` |
| Check routing | `headroom doctor` |

Point a client at it, or let Headroom wrap one:

```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 claude    # Claude Code
OPENAI_BASE_URL=http://127.0.0.1:8787/v1 your-app  # OpenAI-compatible

headroom wrap claude       # configures + launches; undo with: headroom unwrap claude
```

## The model warmup is not optional

This is the part worth knowing, and the main reason to use the script.

The Kompress weights (~274 MB) download from HuggingFace **lazily**. Until they
are cached, every request passes through **uncompressed** and savings read a flat
0%. There is no error — the only signal is a single log line:

```
Kompress model not ready; requests will not be compressed.
```

`install.sh` warms the model up front, where a failure is visible and
attributable, and then verifies that text actually gets smaller. A green run
means compression is genuinely working, not merely installed.

## Reading a 0%

If savings sit at zero after a warm install, the payload shape is the usual
reason rather than a fault:

- **Recent messages are protected.** `protect_recent` defaults to `4`, so the
  newest turns are left intact.
- **User messages are skipped.** `compress_user_messages` defaults to `False` —
  the model's own instructions are not rewritten.
- **Structured JSON is not the text model's job.** It routes to SmartCrusher.
  The Kompress model handles prose; already-dense or highly structured payloads
  compress very little through it.

Verify against the project's own seeded benchmark rather than a hand-rolled
payload:

```bash
cd <headroom checkout>/benchmarks
"$(uv tool dir)/headroom-ai/bin/python" index_proof_table.py --seed 20260902
```

## Notes

**Disk.** `[all]` installs ~6.6 GB, mostly CUDA torch wheels that a CPU-only host
never loads — the compressor that runs is the int8 ONNX model. `HEADROOM_EXTRAS=proxy`
is much smaller and keeps `onnxruntime`.

**Defaults are already safe.** The proxy binds loopback-only with no inbound
token and telemetry off. Opt in to telemetry with `HEADROOM_TELEMETRY=on`.

**The npm package is not the CLI.** `headroom-ai` on npm is the TypeScript SDK
and ships no `headroom` command. The CLI is PyPI-only.

**No budget by default.** `headroom doctor` warns that spend is unlimited; set
one with `headroom proxy --budget 10` or `HEADROOM_BUDGET`.
