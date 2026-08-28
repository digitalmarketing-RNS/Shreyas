/**
 * Startup diagnostics.
 *
 * Run this when the app will not start:  node doctor.js
 *
 * Shared hosting usually reports a failed Node process as a bare 503 with the
 * real error buried somewhere you cannot easily reach, so this reproduces the
 * startup sequence step by step and says exactly which step fails.
 */

import { existsSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
let failures = 0;

const pass = (label, detail = '') => console.log(`  OK    ${label}${detail ? ` — ${detail}` : ''}`);
const fail = (label, detail, fix) => {
  failures++;
  console.log(`  FAIL  ${label}`);
  if (detail) console.log(`        ${detail}`);
  if (fix) console.log(`        fix: ${fix}`);
};
const warn = (label, detail) => console.log(`  WARN  ${label}${detail ? ` — ${detail}` : ''}`);

// Load .env exactly as the app does, so the checks below see what it sees.
try {
  await import('./src/config.js');
} catch {
  /* reported properly in section 5 */
}

console.log('\nRNS Voice Agent — startup diagnostics\n');

// 1. Node version ------------------------------------------------------------
console.log('1. Runtime');
const major = Number(process.versions.node.split('.')[0]);
if (major >= 18) pass(`Node ${process.versions.node}`);
else if (major >= 16) warn(`Node ${process.versions.node}`, 'works, but 18+ is recommended');
else {
  fail(`Node ${process.versions.node} is too old`, 'This app needs Node 16 or newer.',
    'Raise the Node version in hPanel → Node.js, then restart.');
}

// 2. Dependencies ------------------------------------------------------------
console.log('\n2. Dependencies');
if (!existsSync(join(ROOT, 'node_modules'))) {
  fail('node_modules is missing', 'Dependencies have not been installed yet.',
    'Run:  npm install     (on the server: press NPM Install in hPanel)');
} else {
  for (const dep of ['express', 'ws', 'csv-parse']) {
    try {
      await import(dep === 'csv-parse' ? 'csv-parse/sync' : dep);
      pass(dep);
    } catch (err) {
      fail(`${dep} will not load`, err.message, 'Run:  npm install');
    }
  }
}

// 3. Filesystem --------------------------------------------------------------
console.log('\n3. Storage');
let wrote = false;
for (const dir of [join(ROOT, 'data'), join(tmpdir(), 'rns-voice')]) {
  try {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(dir, { recursive: true });
    const probe = join(dir, '.probe');
    writeFileSync(probe, 'ok');
    readFileSync(probe);
    unlinkSync(probe);
    pass(`writable: ${dir}`);
    wrote = true;
    break;
  } catch (err) {
    warn(`not writable: ${dir}`, err.message);
  }
}
if (!wrote) fail('No writable directory', 'Campaigns cannot be saved.', 'Give the app folder write permission (755).');

// 4. Environment -------------------------------------------------------------
console.log('\n4. Environment variables');

/**
 * Values carried over from .env.example. A leftover template value is worse
 * than a blank one: it looks configured, so nothing complains until a call is
 * already in flight.
 */
const PLACEHOLDERS = [/REPLACE_ME/, /your-domain\.com/, /^xai-REPLACE/];

const required = {
  XAI_API_KEY: { why: 'the agent cannot connect without it', secret: true },
  PLIVO_AUTH_ID: { why: 'no calls can be placed', secret: true },
  PLIVO_AUTH_TOKEN: { why: 'no calls can be placed', secret: true },
  PLIVO_PHONE_NUMBER: { why: 'there is no caller ID', secret: false },
  PUBLIC_BASE_URL: { why: 'Plivo cannot reach this server', secret: false },
  DASHBOARD_PASSWORD: { why: 'anyone finding the URL could place calls', secret: true },
};

for (const [name, { why, secret }] of Object.entries(required)) {
  const value = process.env[name];

  if (!value) {
    fail(`${name} is not set`, why, 'Add it to your .env file, or to your host\'s environment variables.');
    continue;
  }
  // One verdict per variable: a placeholder is not "set", it is unedited.
  if (PLACEHOLDERS.some((pattern) => pattern.test(value))) {
    fail(`${name} is still the template value`,
      `It reads "${secret ? value.replace(/[^\W_]/g, '*').slice(0, 24) : value}" — straight from .env.example.`,
      'Open .env and replace the whole value after the = with your real one.');
    continue;
  }
  if (name === 'XAI_API_KEY' && !value.startsWith('xai-')) {
    fail('XAI_API_KEY is missing its "xai-" prefix', 'The key must begin with xai-.',
      'Put xai- in front of it, or re-copy the whole key from console.x.ai.');
    continue;
  }
  if (name === 'PUBLIC_BASE_URL') {
    if (!value.startsWith('https://')) {
      fail('PUBLIC_BASE_URL is not https', 'Plivo refuses to stream audio to an insecure origin.');
      continue;
    }
    if (value.endsWith('/')) {
      warn('PUBLIC_BASE_URL ends with a slash', 'Harmless, but tidier without it.');
    }
  }
  pass(name, secret ? 'set' : value);
}

// 5. Can the app be imported? ------------------------------------------------
console.log('\n5. Application modules');
for (const mod of ['./src/config.js', './src/store.js', './src/api/routes.js', './src/plivo/routes.js']) {
  try {
    await import(mod);
    pass(mod);
  } catch (err) {
    fail(`${mod} failed to load`, err.message,
      'This is the error that stops the app starting. Send this line on.');
  }
}

// 6. Port binding ------------------------------------------------------------
console.log('\n6. Port binding');
const port = Number(process.env.PORT ?? 3000);
await new Promise((resolve) => {
  const probe = createServer((_req, res) => res.end('ok'));
  probe.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      warn(`port ${port} is already in use`, 'Usually means the app is already running.');
    } else {
      fail(`cannot bind port ${port}`, err.message, 'Check the port hPanel assigns via PORT.');
    }
    resolve();
  });
  probe.listen(port, () => {
    pass(`port ${port} is bindable`);
    probe.close(resolve);
  });
});

// Summary --------------------------------------------------------------------
console.log(`\n${'-'.repeat(58)}`);
if (failures === 0) {
  console.log('No blocking problems found. Start with: npm start');
} else {
  console.log(`${failures} blocking problem${failures === 1 ? '' : 's'} found. Fix the FAIL lines above.`);
}
console.log(`${'-'.repeat(58)}\n`);
process.exit(failures ? 1 : 0);
