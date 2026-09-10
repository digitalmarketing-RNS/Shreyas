/**
 * RNS Voice Agent — entry point.
 *
 * Bridges an xAI voice agent to a Plivo phone number and runs outbound
 * campaigns against it. Start with `npm start`; on Hostinger, set this file as
 * the application startup file.
 */
import express from 'express';
import { appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { WebSocketServer } from 'ws';
import { config, configWarnings } from './src/config.js';
import { log } from './src/logger.js';
import { closeStore } from './src/store.js';
import { apiRouter } from './src/api/routes.js';
import { handleConsoleSocket } from './src/api/console.js';
import { plivoRouter } from './src/plivo/routes.js';
import { handlePlivoStream } from './src/plivo/bridge.js';
import { reconcile, startDialer, stopDialer } from './src/campaign/dialer.js';

/**
 * Managed hosts report a crashed Node process as a bare 503 and put the real
 * error somewhere the account holder often cannot reach. Writing it beside the
 * application means it can be opened in a file manager.
 */
function recordStartupFailure(err) {
  const message = `${new Date().toISOString()} startup failed: ${err?.stack ?? err}\n`;
  try {
    appendFileSync(new URL('startup-error.log', import.meta.url), message);
  } catch {
    /* the directory may be read-only; stderr is the fallback */
  }
  console.error(message);
}

let listening = false;

process.on('uncaughtException', (err) => {
  // Before the server is listening, any throw is fatal and worth recording.
  // A flag rather than the `server` binding: that is a const declared further
  // down, so reading it here during a startup crash would itself throw.
  if (!listening) {
    recordStartupFailure(err);
    process.exit(1);
  }
  log.error({ err }, 'uncaught exception');
});

const app = express();
app.disable('x-powered-by');
// Hostinger terminates TLS ahead of the app, so trust its forwarded headers.
app.set('trust proxy', true);

// Plivo posts form-encoded webhooks; lead and opt-out lists arrive as raw text;
// the dashboard sends JSON.
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRouter);
app.use('/plivo', plivoRouter);

app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));

app.use(express.static(join(config.root, 'public'), { index: 'index.html', maxAge: '1h' }));

app.use((err, _req, res, _next) => {
  log.error({ err }, 'unhandled request error');
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = createServer(app);

// ---------------------------------------------------------------------------
// WebSocket endpoints
// ---------------------------------------------------------------------------

const streamWss = new WebSocketServer({ noServer: true });
const consoleWss = new WebSocketServer({ noServer: true });
const echoWss = new WebSocketServer({ noServer: true });

streamWss.on('connection', (ws, req) => handlePlivoStream(ws, req));
consoleWss.on('connection', handleConsoleSocket);

// A trivial echo endpoint the dashboard uses to prove this host actually
// proxies WebSockets. On shared hosting that is the usual point of failure,
// and without it a broken deployment just looks like silent calls.
echoWss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'echo-ready' }));
  ws.on('message', (raw) => {
    if (ws.readyState === ws.OPEN) ws.send(raw.toString());
  });
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const accept = (wss) => wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));

  // The stream URL carries the call id and token as path segments, so match
  // the prefix as well as the bare path. The bare path stays accepted because
  // a call already in flight when this deploys still has the old URL.
  if (url.pathname === '/plivo/stream' || url.pathname.startsWith('/plivo/stream/')) {
    // Plivo cannot set headers on the upgrade, so authorisation happens in
    // the bridge, against the signed token in that URL.
    accept(streamWss);
    return;
  }

  switch (url.pathname) {

    case '/ws/console':
      if (config.dashboardPassword && url.searchParams.get('token') !== config.dashboardPassword) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      accept(consoleWss);
      return;

    case '/ws/echo':
      accept(echoWss);
      return;

    default:
      socket.destroy();
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.on('error', (err) => {
  recordStartupFailure(err);
  process.exit(1);
});

server.listen(config.port, () => {
  listening = true;
  log.info(
    {
      port: config.port,
      agent: config.xaiAgentId || `(model ${config.xaiModel})`,
      number: config.plivoNumberDisplay || '(not set)',
      publicBaseUrl: config.publicBaseUrl || '(not set)',
    },
    `${config.brand} voice agent is listening`,
  );
  for (const warning of configWarnings()) log.warn(warning);
  reconcile();
  startDialer();
});

const reconciler = setInterval(reconcile, 5 * 60_000);
reconciler.unref?.();

function shutdown(signal) {
  log.info({ signal }, 'shutting down');
  stopDialer();
  clearInterval(reconciler);
  closeStore();
  server.close(() => process.exit(0));
  // A live call must not hold the process open indefinitely.
  setTimeout(() => process.exit(0), 8000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// A single bad webhook should never take the whole dialer down.
process.on('unhandledRejection', (err) => log.error({ err }, 'unhandled promise rejection'));
