# xai-realtime

A small Go client for the xAI Realtime API. It opens a WebSocket session with an
agent, sends one text message, streams the reply transcript to stdout, and exits
when the response completes.

## Setup

```
export XAI_API_KEY=xai-...
```

The key is read from the environment only — do not pass it on the command line,
where it lands in shell history and process listings.

## Usage

```
go run . -agent agent_CvgfdQIkeaZ1IGqg -text "Hello!"
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `-agent` | `$XAI_AGENT_ID` | Agent to connect to. Required. |
| `-text` | `Hello!` | Message sent as the first user turn. |
| `-endpoint` | `wss://api.x.ai/v1/realtime` | Realtime WebSocket endpoint. |
| `-timeout` | `2m` | Give up if the response has not completed in this window. |

Ctrl-C sends a close frame and shuts down cleanly rather than dropping the socket.

## Protocol

On connect the client writes two frames:

1. `conversation.item.create` — a `message` item with `role: user` and one
   `input_text` content block.
2. `response.create` — asks the agent to respond.

It then reads until the session ends, acting on four server event types:

| Event | Handling |
| --- | --- |
| `response.output_audio_transcript.delta` | Delta printed to stdout. |
| `response.output_text.delta` | Delta printed to stdout. |
| `response.done` | Response is complete; exit 0. |
| `error` | Reported with its type, code, and message; exit 1. |

Any other event is read and ignored so the stream stays drained. A frame that
fails to parse is logged and skipped — it does not end the session.

## Tests

```
go test ./...
```

The tests run a mock realtime server over `httptest`, covering the frames the
client sends, both delta types, server errors, unparsable frames, the timeout,
and the handshake status surfaced on a failed dial. No API key or network access
is needed.

## Troubleshooting

A failed dial reports the HTTP handshake status, which is where the useful
signal lives:

```
dial wss://api.x.ai/v1/realtime?agent_id=...: websocket: bad handshake (HTTP 401 Unauthorized)
```

`401` means the key is missing or rejected; `404` usually means the agent ID does
not exist or is not visible to that key.
