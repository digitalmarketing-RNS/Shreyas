// Command xai-realtime opens a WebSocket session against the xAI Realtime API,
// sends a single text message to an agent, and streams the reply back to stdout.
//
// Usage:
//
//	export XAI_API_KEY=xai-...
//	go run . -agent agent_CvgfdQIkeaZ1IGqg -text "Hello!"
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

const defaultEndpoint = "wss://api.x.ai/v1/realtime"

// out is where transcript deltas land; tests swap it for a buffer.
var out io.Writer = os.Stdout

// event covers the subset of the server-to-client protocol this client acts on.
// Everything else is read and ignored so the stream stays drained.
type event struct {
	Type  string `json:"type"`
	Delta string `json:"delta"`
	Error *struct {
		Type    string `json:"type"`
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func main() {
	var (
		endpoint = flag.String("endpoint", defaultEndpoint, "realtime WebSocket endpoint")
		agentID  = flag.String("agent", os.Getenv("XAI_AGENT_ID"), "agent ID to connect to (or set XAI_AGENT_ID)")
		text     = flag.String("text", "Hello!", "message to send to the agent")
		timeout  = flag.Duration("timeout", 2*time.Minute, "give up if the response has not completed within this window")
	)
	flag.Parse()

	apiKey := os.Getenv("XAI_API_KEY")
	if apiKey == "" {
		log.Fatal("XAI_API_KEY is not set")
	}
	if *agentID == "" {
		log.Fatal("no agent ID: pass -agent or set XAI_AGENT_ID")
	}

	if err := run(*endpoint, apiKey, *agentID, *text, *timeout); err != nil {
		log.Fatal(err)
	}
}

func run(endpoint, apiKey, agentID, text string, timeout time.Duration) error {
	u, err := url.Parse(endpoint)
	if err != nil {
		return fmt.Errorf("parse endpoint: %w", err)
	}
	q := u.Query()
	q.Set("agent_id", agentID)
	u.RawQuery = q.Encode()

	headers := http.Header{"Authorization": {"Bearer " + apiKey}}
	ws, resp, err := websocket.DefaultDialer.Dial(u.String(), headers)
	if err != nil {
		// The handshake status is the only useful signal for auth and
		// routing failures, and websocket.Dial hides it in the response.
		if resp != nil {
			resp.Body.Close()
			return fmt.Errorf("dial %s: %w (HTTP %s)", u.Redacted(), err, resp.Status)
		}
		return fmt.Errorf("dial %s: %w", u.Redacted(), err)
	}
	defer ws.Close()

	hello := map[string]any{
		"type": "conversation.item.create",
		"item": map[string]any{
			"type": "message",
			"role": "user",
			"content": []map[string]any{
				{"type": "input_text", "text": text},
			},
		},
	}
	if err := ws.WriteJSON(hello); err != nil {
		return fmt.Errorf("send message: %w", err)
	}
	if err := ws.WriteJSON(map[string]any{"type": "response.create"}); err != nil {
		return fmt.Errorf("request response: %w", err)
	}

	// The read loop owns the connection, so shutdown runs through it rather
	// than closing the socket out from under an in-flight read.
	errc := make(chan error, 1)
	go func() { errc <- readLoop(ws) }()

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sigc)

	select {
	case err := <-errc:
		return err
	case <-sigc:
		return closeGracefully(ws, errc)
	case <-time.After(timeout):
		return fmt.Errorf("timed out after %s waiting for the response to complete", timeout)
	}
}

// readLoop streams transcript deltas to stdout and returns once the response
// is done, the peer closes, or the connection fails.
func readLoop(ws *websocket.Conn) error {
	wrote := false
	for {
		_, raw, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				return finish(wrote)
			}
			return fmt.Errorf("read: %w", err)
		}

		var ev event
		if err := json.Unmarshal(raw, &ev); err != nil {
			// A frame we cannot parse is not fatal; the stream may still
			// carry the deltas we came for.
			log.Printf("skipping unparsable event: %v", err)
			continue
		}

		switch ev.Type {
		case "response.output_audio_transcript.delta", "response.output_text.delta":
			fmt.Fprint(out, ev.Delta)
			wrote = wrote || ev.Delta != ""
		case "response.done":
			return finish(wrote)
		case "error":
			if ev.Error != nil {
				return fmt.Errorf("server error (%s/%s): %s", ev.Error.Type, ev.Error.Code, ev.Error.Message)
			}
			return fmt.Errorf("server error: %s", raw)
		}
	}
}

func finish(wrote bool) error {
	if wrote {
		fmt.Fprintln(out)
	}
	return nil
}

// closeGracefully sends the close frame and gives the read loop a moment to
// drain, so the server sees a clean disconnect instead of a dropped socket.
func closeGracefully(ws *websocket.Conn, errc <-chan error) error {
	msg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "")
	if err := ws.WriteControl(websocket.CloseMessage, msg, time.Now().Add(time.Second)); err != nil {
		return nil
	}
	select {
	case <-errc:
	case <-time.After(time.Second):
	}
	return nil
}
