package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// mockServer stands in for the realtime endpoint: it records the frames the
// client sends and replays the frames handed to it.
func mockServer(t *testing.T, replies []map[string]any, received *[]map[string]any) *httptest.Server {
	t.Helper()
	upgrader := websocket.Upgrader{}
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.URL.Query().Get("agent_id"); got != "agent_test" {
			t.Errorf("agent_id = %q, want %q", got, "agent_test")
		}
		if got := r.Header.Get("Authorization"); got != "Bearer test-key" {
			t.Errorf("Authorization = %q, want %q", got, "Bearer test-key")
		}
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("upgrade: %v", err)
			return
		}
		defer ws.Close()

		for range 2 { // conversation.item.create, then response.create
			var frame map[string]any
			if err := ws.ReadJSON(&frame); err != nil {
				t.Errorf("read client frame: %v", err)
				return
			}
			*received = append(*received, frame)
		}
		for _, reply := range replies {
			if err := ws.WriteJSON(reply); err != nil {
				t.Errorf("write reply: %v", err)
				return
			}
		}
	}))
}

func wsURL(s *httptest.Server) string {
	return "ws" + strings.TrimPrefix(s.URL, "http")
}

func TestRunStreamsTranscript(t *testing.T) {
	var received []map[string]any
	srv := mockServer(t, []map[string]any{
		{"type": "response.output_audio_transcript.delta", "delta": "Hi "},
		{"type": "response.output_audio_transcript.delta", "delta": "there"},
		{"type": "response.done"},
	}, &received)
	defer srv.Close()

	var buf bytes.Buffer
	out = &buf
	defer func() { out = os.Stdout }()

	if err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 10*time.Second); err != nil {
		t.Fatalf("run: %v", err)
	}
	if got, want := buf.String(), "Hi there\n"; got != want {
		t.Errorf("transcript = %q, want %q", got, want)
	}

	if len(received) != 2 {
		t.Fatalf("received %d frames, want 2", len(received))
	}
	if got := received[0]["type"]; got != "conversation.item.create" {
		t.Errorf("first frame type = %v, want conversation.item.create", got)
	}
	if got := received[1]["type"]; got != "response.create" {
		t.Errorf("second frame type = %v, want response.create", got)
	}
	item, _ := json.Marshal(received[0]["item"])
	if want := `{"content":[{"text":"Hello!","type":"input_text"}],"role":"user","type":"message"}`; string(item) != want {
		t.Errorf("item = %s, want %s", item, want)
	}
}

func TestRunStreamsTextDeltas(t *testing.T) {
	var received []map[string]any
	srv := mockServer(t, []map[string]any{
		{"type": "response.output_text.delta", "delta": "written reply"},
		{"type": "response.done"},
	}, &received)
	defer srv.Close()

	var buf bytes.Buffer
	out = &buf
	defer func() { out = os.Stdout }()

	if err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 10*time.Second); err != nil {
		t.Fatalf("run: %v", err)
	}
	if got, want := buf.String(), "written reply\n"; got != want {
		t.Errorf("transcript = %q, want %q", got, want)
	}
}

func TestRunReportsServerError(t *testing.T) {
	var received []map[string]any
	srv := mockServer(t, []map[string]any{
		{"type": "error", "error": map[string]any{
			"type": "invalid_request_error", "code": "agent_not_found", "message": "no such agent",
		}},
	}, &received)
	defer srv.Close()

	out = &bytes.Buffer{}
	defer func() { out = os.Stdout }()

	err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 10*time.Second)
	if err == nil {
		t.Fatal("run returned nil, want a server error")
	}
	for _, want := range []string{"invalid_request_error", "agent_not_found", "no such agent"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not mention %q", err, want)
		}
	}
}

func TestRunSkipsUnparsableFrames(t *testing.T) {
	upgrader := websocket.Upgrader{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("upgrade: %v", err)
			return
		}
		defer ws.Close()
		for range 2 {
			if _, _, err := ws.ReadMessage(); err != nil {
				t.Errorf("read client frame: %v", err)
				return
			}
		}
		ws.WriteMessage(websocket.TextMessage, []byte("not json"))
		ws.WriteJSON(map[string]any{"type": "response.output_text.delta", "delta": "ok"})
		ws.WriteJSON(map[string]any{"type": "response.done"})
	}))
	defer srv.Close()

	var buf bytes.Buffer
	out = &buf
	defer func() { out = os.Stdout }()

	if err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 10*time.Second); err != nil {
		t.Fatalf("run: %v", err)
	}
	if got, want := buf.String(), "ok\n"; got != want {
		t.Errorf("transcript = %q, want %q", got, want)
	}
}

func TestRunTimesOut(t *testing.T) {
	// Connects, then holds the socket open without ever replying.
	upgrader := websocket.Upgrader{}
	done := make(chan struct{})
	defer close(done)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("upgrade: %v", err)
			return
		}
		defer ws.Close()
		<-done
	}))
	defer srv.Close()

	out = &bytes.Buffer{}
	defer func() { out = os.Stdout }()

	err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 200*time.Millisecond)
	if err == nil || !strings.Contains(err.Error(), "timed out") {
		t.Fatalf("err = %v, want a timeout", err)
	}
}

func TestRunReportsHandshakeStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "nope", http.StatusUnauthorized)
	}))
	defer srv.Close()

	err := run(wsURL(srv), "test-key", "agent_test", "Hello!", 10*time.Second)
	if err == nil || !strings.Contains(err.Error(), "401") {
		t.Fatalf("err = %v, want the 401 handshake status", err)
	}
}
