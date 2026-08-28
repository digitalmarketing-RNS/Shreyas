/* RNS Voice Agent — dashboard client. */

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let password = sessionStorage.getItem('rnsPassword') ?? '';
let campaignCache = [];
let statusCache = null;

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (password) headers.Authorization = `Bearer ${password}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    openGate('That password was not accepted.');
    throw new Error('unauthorised');
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(body?.detail ?? body?.error ?? res.statusText);
  return body;
}

let toastTimer;
function toast(message, kind = '') {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4500);
}

// ---------------------------------------------------------------------------
// Password gate
// ---------------------------------------------------------------------------

function openGate(message) {
  $('gate').classList.remove('hidden');
  $('gateError').textContent = message ?? '';
  $('gatePassword').focus();
}

$('gateSubmit').addEventListener('click', async () => {
  password = $('gatePassword').value;
  try {
    await api('/status');
    sessionStorage.setItem('rnsPassword', password);
    $('gate').classList.add('hidden');
    boot();
  } catch {
    $('gateError').textContent = 'That password was not accepted.';
  }
});
$('gatePassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('gateSubmit').click();
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    const target = button.dataset.page;
    document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
    $(`page-${target}`).classList.remove('hidden');
    $('sidebar').classList.remove('open');
    onPageShown(target);
  });
});

$('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));

function onPageShown(page) {
  if (page === 'calls') refreshCalls();
  else if (page === 'optout') refreshOptOut();
  else if (page === 'activity') refreshLogs();
  else if (page === 'settings') renderSettings();
  else if (page === 'leads') refreshLeads();
  else if (page === 'dashboard') refreshDashboard();
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

async function refreshStatus() {
  const status = await api('/status');
  statusCache = status;

  const agent = $('agentStatus');
  agent.className = `status-dot ${status.ready.xai ? '' : 'down'}`;
  agent.innerHTML = `<i></i> ${status.ready.xai ? 'Agent ready' : 'Agent not configured'}`;

  const line = $('lineStatus');
  line.className = `status-dot ${status.ready.plivo ? '' : 'down'}`;
  line.innerHTML = `<i></i> ${status.ready.plivo ? esc(status.number ?? 'Line ready') : 'Line not configured'}`;

  $('statSystem').textContent = status.ready.xai && status.ready.plivo ? 'Ready' : 'Setup needed';
  $('statLeads').textContent = status.totals.leads;
  $('statCalls').textContent = status.totals.calls;
  $('statCampaigns').textContent = status.totals.campaigns;
  $('statLive').textContent = status.activeCalls;
  $('navOptOutCount').textContent = status.totals.optOuts;
  $('testFrom').textContent = status.number ?? 'your Plivo number';

  $('warnings').innerHTML = status.warnings.length
    ? `<div class="note warn"><div><b>Before you can run a campaign:</b><ul style="margin:6px 0 0;padding-left:18px">
       ${status.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div></div>`
    : '';

  drawVolume(status.volume);
  return status;
}

function drawVolume(points) {
  const svg = $('volumeChart');
  const W = 640, H = 190, pad = { l: 34, r: 10, t: 12, b: 26 };
  const max = Math.max(4, ...points.map((p) => p.count));
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const barW = Math.min(46, (innerW / points.length) * 0.55);

  let out = '';
  // Horizontal gridlines with value labels.
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + innerH - (innerH * i) / 4;
    out += `<line class="grid-line" x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}"/>`;
    out += `<text class="axis" x="${pad.l - 8}" y="${y + 3}" text-anchor="end">${Math.round((max * i) / 4)}</text>`;
  }
  points.forEach((point, index) => {
    const cx = pad.l + (innerW / points.length) * (index + 0.5);
    const h = max ? (innerH * point.count) / max : 0;
    out += `<rect class="bar-rect" x="${cx - barW / 2}" y="${pad.t + innerH - h}" width="${barW}" height="${Math.max(h, point.count ? 2 : 0)}"/>`;
    const [, m, d] = point.day.split('-');
    out += `<text class="axis" x="${cx}" y="${H - 8}" text-anchor="middle">${d}/${m}</text>`;
  });
  svg.innerHTML = out;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function renderDayPicker() {
  $('cDays').innerHTML = DAY_NAMES.map((name, index) => `
    <label class="${index >= 1 && index <= 6 ? 'on' : ''}" data-day="${index}">
      <input type="checkbox" value="${index}" ${index >= 1 && index <= 6 ? 'checked' : ''} /> ${name}
    </label>`).join('');

  $('cDays').querySelectorAll('label').forEach((label) => {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      const box = label.querySelector('input');
      box.checked = !box.checked;
      label.classList.toggle('on', box.checked);
    });
  });
}

function selectedDays() {
  return [...$('cDays').querySelectorAll('input:checked')].map((i) => Number(i.value));
}

function progressBar(stats) {
  const done = stats.completed + stats.exhausted;
  const pct = stats.total ? Math.round((done / stats.total) * 100) : 0;
  return `<div class="bar"><i style="width:${pct}%"></i></div>
          <div class="sub">${done}/${stats.total} done · ${pct}%</div>`;
}

async function refreshCampaigns() {
  campaignCache = await api('/campaigns');
  $('navCampaignCount').textContent = campaignCache.length;

  $('campaignRows').innerHTML = campaignCache.length ? campaignCache.map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b><div class="sub mono">${c.id}</div></td>
      <td>${progressBar(c.stats)}</td>
      <td>${c.stats.total}<div class="sub">${c.stats.pending} waiting</div></td>
      <td>${c.stats.answered}</td>
      <td><span class="badge ${c.status}">${c.status}</span></td>
      <td style="white-space:nowrap">
        ${c.status === 'running'
          ? `<button class="btn sm" data-act="pause" data-id="${c.id}">Pause</button>`
          : `<button class="btn sm primary" data-act="start" data-id="${c.id}">Start</button>`}
        <button class="btn sm danger" data-act="delete" data-id="${c.id}">Delete</button>
      </td>
    </tr>`).join('')
    : '<tr><td colspan="6" class="empty">No campaigns yet. Create one above.</td></tr>';

  $('dashCampaigns').innerHTML = campaignCache.length ? campaignCache.slice(0, 6).map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>${progressBar(c.stats)}</td>
      <td>${c.stats.total}</td>
      <td><span class="badge ${c.status}">${c.status}</span></td>
      <td>${c.status === 'running'
        ? `<button class="btn sm" data-act="pause" data-id="${c.id}">Pause</button>`
        : `<button class="btn sm primary" data-act="start" data-id="${c.id}">Start</button>`}</td>
    </tr>`).join('')
    : '<tr><td colspan="5" class="empty">No campaigns yet.</td></tr>';

  const options = campaignCache.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const keep = $('leadCampaign').value;
  $('leadCampaign').innerHTML = options || '<option value="">Create a campaign first</option>';
  if (keep) $('leadCampaign').value = keep;
  $('testCampaign').innerHTML = `<option value="">Agent defaults</option>${options}`;
  $('consoleCampaign').innerHTML = `<option value="">Agent defaults (as configured in xAI)</option>${options}`;
}

async function campaignAction(event) {
  const button = event.target.closest('button[data-act]');
  if (!button) return;
  const { act, id } = button.dataset;
  button.disabled = true;
  try {
    if (act === 'delete') {
      if (!confirm('Delete this campaign and every lead in it?')) return;
      await api(`/campaigns/${id}`, { method: 'DELETE' });
      toast('Campaign deleted.');
    } else {
      await api(`/campaigns/${id}/${act}`, { method: 'POST' });
      toast(act === 'start' ? 'Campaign started — dialling now.' : 'Campaign paused.', 'ok');
    }
    await refreshCampaigns();
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    button.disabled = false;
  }
}
$('campaignRows').addEventListener('click', campaignAction);
$('dashCampaigns').addEventListener('click', campaignAction);

$('createCampaign').addEventListener('click', async () => {
  const body = {
    name: $('cName').value.trim(),
    opener: $('cOpener').value.trim() || null,
    instructions: $('cInstructions').value.trim() || null,
    windowStart: $('cWinStart').value.trim(),
    windowEnd: $('cWinEnd').value.trim(),
    windowDays: selectedDays(),
    defaultTimezone: $('cTz').value.trim(),
    defaultCountryCode: $('cCountry').value.trim() || null,
    maxAttempts: Number($('cAttempts').value),
    retryDelayMinutes: Number($('cRetry').value),
    concurrency: Number($('cConc').value),
    hangupOnMachine: $('cMachine').value === 'true',
  };
  if (!body.name) return toast('Give the campaign a name.', 'bad');
  if (!body.windowDays.length) return toast('Pick at least one calling day.', 'bad');

  try {
    await api('/campaigns', { method: 'POST', body: JSON.stringify(body) });
    $('cName').value = '';
    $('cOpener').value = '';
    $('cInstructions').value = '';
    await refreshCampaigns();
    toast('Campaign created. Add leads next.', 'ok');
  } catch (err) {
    toast(err.message, 'bad');
  }
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

$('leadFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    $('leadCsv').value = await file.text();
    toast(`Loaded ${file.name}. Press Import leads.`);
  }
});

$('uploadLeads').addEventListener('click', async () => {
  const campaignId = $('leadCampaign').value;
  const csv = $('leadCsv').value.trim();
  if (!campaignId) return toast('Pick a campaign first.', 'bad');
  if (!csv) return toast('Choose a CSV file or paste some rows.', 'bad');

  try {
    const result = await api(`/campaigns/${campaignId}/leads`, {
      method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv,
    });
    const parts = [`${result.imported} imported`];
    if (result.duplicates) parts.push(`${result.duplicates} already there`);
    if (result.suppressed) parts.push(`${result.suppressed} opted out`);
    if (result.rejected.length) {
      const first = result.rejected[0];
      parts.push(`${result.rejected.length} rejected (row ${first.row}: ${first.reason})`);
    }
    $('importResult').textContent = parts.join(' · ');
    toast(`${result.imported} leads imported.`, 'ok');
    await refreshCampaigns();
    await refreshLeads();
  } catch (err) {
    $('importResult').textContent = err.message;
    toast(err.message, 'bad');
  }
});

async function refreshLeads() {
  const campaignId = $('leadCampaign').value;
  if (!campaignId) return;
  const status = $('leadFilter').value;
  const query = status ? `?status=${status}` : '';
  const list = await api(`/campaigns/${campaignId}/leads${query}`);

  $('leadRows').innerHTML = list.length ? list.map((l) => `
    <tr>
      <td class="mono">${esc(l.phone)}</td>
      <td>${esc(l.name ?? '—')}</td>
      <td><span class="badge ${l.status}">${l.status}</span></td>
      <td>${l.attempts}</td>
      <td>${esc(l.lastDisposition ?? '—')}</td>
      <td class="sub">${l.nextAttemptAt ? new Date(l.nextAttemptAt).toLocaleString() : '—'}</td>
      <td><button class="btn sm danger" data-lead="${l.id}">Remove</button></td>
    </tr>`).join('')
    : '<tr><td colspan="7" class="empty">No leads match.</td></tr>';
}
$('leadCampaign').addEventListener('change', refreshLeads);
$('leadFilter').addEventListener('change', refreshLeads);
$('leadRows').addEventListener('click', async (e) => {
  const id = e.target.closest('button')?.dataset.lead;
  if (!id) return;
  await api(`/leads/${id}`, { method: 'DELETE' });
  await refreshLeads();
  await refreshCampaigns();
});

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

function renderCallRows(list, target, compact) {
  const rows = list.map((c) => compact
    ? `<tr><td class="mono">${esc(c.toNumber)}</td><td>${c.durationSeconds ?? '—'}</td>
         <td><span class="badge ${c.disposition ?? c.status}">${esc(c.disposition ?? c.status)}</span></td></tr>`
    : `<tr>
         <td class="mono">${esc(c.toNumber)}</td>
         <td class="sub">${new Date(c.startedAt).toLocaleString()}</td>
         <td>${c.durationSeconds ?? '—'}</td>
         <td><span class="badge ${c.status}">${esc(c.status)}</span></td>
         <td><span class="badge ${c.disposition ?? ''}">${esc(c.disposition ?? '—')}</span>
             ${c.details?.outcome ? `<div class="sub">${esc(c.details.outcome)}</div>` : ''}</td>
         <td style="white-space:nowrap">
           ${c.transcript?.length ? `<button class="btn sm" data-transcript="${c.id}">Transcript</button>` : ''}
           ${!c.endedAt ? `<button class="btn sm danger" data-hangup="${c.id}">End</button>` : ''}
         </td>
       </tr>`).join('');
  $(target).innerHTML = rows || `<tr><td colspan="${compact ? 3 : 6}" class="empty">No calls yet.</td></tr>`;
}

async function refreshCalls() {
  const list = await api('/calls?limit=60');
  renderCallRows(list, 'callRows', false);
  renderCallRows(list.slice(0, 8), 'dashCalls', true);
}

$('callRows').addEventListener('click', async (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.hangup) {
    await api(`/calls/${button.dataset.hangup}/hangup`, { method: 'POST' });
    toast('Call ended.');
    await refreshCalls();
  } else if (button.dataset.transcript) {
    const call = await api(`/calls/${button.dataset.transcript}`);
    $('transcriptCard').classList.remove('hidden');

    // Anything the agent reported through save_call_details, shown above the
    // transcript because it is the part worth acting on.
    const d = call.details;
    $('callDetails').innerHTML = d
      ? `<div class="note ok"><div><b>Recorded by the agent</b><br>${
          [
            d.outcome && `Outcome: ${esc(d.outcome)}`,
            d.appointment_time && `Appointment: ${esc(d.appointment_time)}`,
            d.contact_name && `Name: ${esc(d.contact_name)}`,
            d.callback_number && `Callback number: ${esc(d.callback_number)}`,
            d.notes && `Notes: ${esc(d.notes)}`,
          ].filter(Boolean).join('<br>')
        }</div></div>`
      : '<p class="muted">The agent did not record any structured details on this call.</p>';

    $('transcriptFeed').innerHTML = call.transcript.map((t) =>
      `<div class="line"><span class="at">${new Date(t.at).toLocaleTimeString()}</span>
       <span class="${t.role}">${t.role === 'agent' ? 'Agent' : 'Person'}: ${esc(t.text)}</span></div>`).join('')
      || '<div class="line muted">Nothing was transcribed on this call.</div>';
    $('transcriptCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
$('closeTranscript').addEventListener('click', () => $('transcriptCard').classList.add('hidden'));

$('placeCall').addEventListener('click', async () => {
  const to = $('testNumber').value.trim();
  if (!to) return toast('Enter a number to call.', 'bad');
  const button = $('placeCall');
  button.disabled = true;
  try {
    await api('/calls', {
      method: 'POST',
      body: JSON.stringify({ to, campaignId: $('testCampaign').value || undefined }),
    });
    toast('Calling now — your phone should ring shortly.', 'ok');
    await refreshCalls();
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    button.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Opt-out
// ---------------------------------------------------------------------------

async function refreshOptOut() {
  const list = await api('/optout');
  $('optoutRows').innerHTML = list.length ? list.map((d) => `
    <tr><td class="mono">${esc(d.phone)}</td><td>${esc(d.reason ?? '—')}</td>
        <td class="sub">${new Date(d.createdAt).toLocaleDateString()}</td>
        <td><button class="btn sm" data-remove="${esc(d.phone)}">Remove</button></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Nothing suppressed yet.</td></tr>';
}

$('addOptOut').addEventListener('click', async () => {
  const phone = $('optoutNumber').value.trim();
  if (!phone) return;
  try {
    await api('/optout', {
      method: 'POST',
      body: JSON.stringify({ phone, reason: $('optoutReason').value.trim() || undefined }),
    });
    $('optoutNumber').value = '';
    $('optoutReason').value = '';
    await refreshOptOut();
    await refreshStatus();
    toast('Number suppressed.', 'ok');
  } catch (err) {
    toast(err.message, 'bad');
  }
});

$('bulkOptOut').addEventListener('click', async () => {
  const text = $('optoutBulk').value.trim();
  if (!text) return;
  const result = await api('/optout', {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: text,
  });
  $('optoutResult').textContent = `${result.added} added${result.rejected.length ? `, ${result.rejected.length} unreadable` : ''}`;
  $('optoutBulk').value = '';
  await refreshOptOut();
  await refreshStatus();
});

$('optoutRows').addEventListener('click', async (e) => {
  const phone = e.target.closest('button')?.dataset.remove;
  if (!phone) return;
  await api(`/optout/${encodeURIComponent(phone)}`, { method: 'DELETE' });
  await refreshOptOut();
  await refreshStatus();
});

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

async function refreshLogs() {
  const lines = await api('/logs');
  $('logFeed').innerHTML = lines.map((l) => `
    <div class="line"><span class="at">${new Date(l.at).toLocaleTimeString()}</span>
    <span class="${l.level === 'error' ? 'err' : ''}">${esc(l.level.toUpperCase())} ${esc(l.message)}
    ${l.detail ? `<span class="muted">${esc(JSON.stringify(l.detail))}</span>` : ''}</span></div>`).join('')
    || '<div class="line muted">Nothing logged yet.</div>';
}
$('refreshLogs').addEventListener('click', refreshLogs);
$('runReconcile').addEventListener('click', async () => {
  await api('/reconcile', { method: 'POST' });
  toast('Stuck calls cleared.', 'ok');
  await refreshCalls();
  await refreshCampaigns();
});

// ---------------------------------------------------------------------------
// Settings and health checks
// ---------------------------------------------------------------------------

function renderSettings() {
  if (!statusCache) return;
  const base = statusCache.publicBaseUrl;

  $('settingRows').innerHTML = [
    ['Brand', statusCache.brand],
    ['xAI agent', statusCache.agentId ?? 'not set'],
    ['Plivo number', statusCache.number ?? 'not set'],
    ['Public URL', base ?? 'not set'],
    ['Max simultaneous calls', statusCache.maxConcurrentCalls],
    ['Live bridges', statusCache.activeBridges],
  ].map(([k, v]) => `<tr><td style="width:220px"><b>${esc(k)}</b></td><td class="mono">${esc(v)}</td></tr>`).join('');

  const rows = base ? [
    ['Answer URL', `${base}/plivo/answer`],
    ['Hangup URL', `${base}/plivo/hangup`],
    ['Inbound (optional)', `${base}/plivo/inbound`],
    ['Audio stream', `${base.replace(/^http/, 'ws')}/plivo/stream`],
  ] : [['Not available', 'Set PUBLIC_BASE_URL first.']];

  $('webhookRows').innerHTML = rows.map(([k, v]) =>
    `<tr><td style="width:220px"><b>${esc(k)}</b></td><td class="mono">${esc(v)}</td></tr>`).join('');
}

function setTest(id, kind, title, message) {
  $(id).className = `note ${kind}`;
  $(id).innerHTML = `<div><b>${title}</b><br><span>${esc(message)}</span></div>`;
}

async function testXai() {
  setTest('testXai', 'info', '1. xAI agent', 'Connecting…');
  try {
    const result = await api('/test/xai', { method: 'POST' });
    if (result.ok) {
      setTest('testXai', 'ok', '1. xAI agent',
        `Connected${result.agentId ? ` to ${result.agentId}` : ''}. Your key and agent are good.`);
    } else {
      setTest('testXai', 'bad', '1. xAI agent', result.error);
    }
  } catch (err) {
    setTest('testXai', 'bad', '1. xAI agent', err.message);
  }
}

async function testPlivo() {
  setTest('testPlivo', 'info', '2. Plivo account', 'Checking…');
  try {
    const result = await api('/test/plivo', { method: 'POST' });
    if (result.ok) {
      const balance = result.balance ? ` Balance: ${result.balance} ${result.currency ?? ''}.` : '';
      setTest('testPlivo', 'ok', '2. Plivo account', `Connected as ${result.name ?? 'your account'}.${balance}`);
      $('statBalance').textContent = result.balance ? `${Number(result.balance).toFixed(2)}` : '—';
    } else {
      setTest('testPlivo', 'bad', '2. Plivo account', result.error);
    }
  } catch (err) {
    setTest('testPlivo', 'bad', '2. Plivo account', err.message);
  }
}

/**
 * Opens a real WebSocket against this host and waits for the echo.
 *
 * On shared hosting this is the check that matters most: if the host does not
 * proxy WebSockets, the dashboard still loads and calls still connect, but
 * there is silence on the line and nothing in the logs explains why.
 */
async function testSocket() {
  setTest('testSocket', 'info', '3. WebSocket support', 'Opening a test socket…');
  let target;
  try {
    target = await api('/test/websocket-target');
  } catch (err) {
    return setTest('testSocket', 'bad', '3. WebSocket support', err.message);
  }

  await new Promise((resolve) => {
    let settled = false;
    const finish = (kind, message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch { /* already closed */ }
      setTest('testSocket', kind, '3. WebSocket support', message);
      resolve();
    };

    const socket = new WebSocket(target.url);
    const timer = setTimeout(() => finish('bad',
      'No response within 8 seconds. This host is not passing WebSocket traffic through, so live call audio will not work. A Hostinger VPS plan does support it.'), 8000);

    socket.onopen = () => socket.send('ping');
    socket.onmessage = (event) => {
      if (String(event.data).includes('ping')) {
        finish('ok', 'WebSockets work on this host. Live call audio can flow.');
      }
    };
    socket.onerror = () => finish('bad',
      'The WebSocket connection was refused. Live call audio will not work on this plan — you need a host that proxies WebSockets, such as a Hostinger VPS.');
  });
}

$('runAllTests').addEventListener('click', async () => {
  $('runAllTests').disabled = true;
  await testXai();
  await testPlivo();
  await testSocket();
  $('runAllTests').disabled = false;
});

// ---------------------------------------------------------------------------
// Live event stream
// ---------------------------------------------------------------------------

function feedLine(target, text, cls = '') {
  const el = $(target);
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  const line = document.createElement('div');
  line.className = 'line';
  line.innerHTML = `<span class="at">${new Date().toLocaleTimeString()}</span><span class="${cls}"></span>`;
  line.lastChild.textContent = text;
  el.appendChild(line);
  while (el.children.length > 300) el.removeChild(el.firstChild);
  if (atBottom) el.scrollTop = el.scrollHeight;
}

let stream;
function connectEvents() {
  stream?.close();
  const url = password ? `/api/events?token=${encodeURIComponent(password)}` : '/api/events';
  stream = new EventSource(url);

  const on = (name, format, cls = '') =>
    stream.addEventListener(name, (e) => feedLine('dashFeed', format(JSON.parse(e.data)), cls));

  on('call:dialing', (d) => `Dialling ${d.to ?? d.callId}${d.name ? ` (${d.name})` : ''}`);
  on('call:started', () => 'Call connected — agent is live');
  on('call:ended', (d) => `Call ended — ${d.disposition}${d.durationSeconds ? `, ${d.durationSeconds}s` : ''}`);
  on('call:error', (d) => `Error: ${d.message}`, 'err');
  on('call:dtmf', (d) => `Keypress ${d.digit}`);
  on('lead:updated', (d) => `Lead ${d.disposition} → ${d.status}`);
  on('campaign:completed', () => 'Campaign finished');

  stream.addEventListener('call:transcript', (e) => {
    const d = JSON.parse(e.data);
    feedLine('dashFeed', `${d.role === 'agent' ? 'Agent' : 'Person'}: ${d.text}`, d.role);
  });

  // EventSource retries by itself, but not after an auth failure.
  stream.onerror = () => { stream.close(); setTimeout(connectEvents, 6000); };
}

// ---------------------------------------------------------------------------
// Browser voice console
//
// Mic -> AudioWorklet -> PCM16 @ 24 kHz -> this server -> xAI, and back.
// 24 kHz is what the browser profile negotiates, so nothing is resampled.
// ---------------------------------------------------------------------------

const SAMPLE_RATE = 24000;
const WORKLET = `
class Tap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch) this.port.postMessage(new Float32Array(ch));
    return true;
  }
}
registerProcessor('tap', Tap);
`;

let socket = null, audioCtx = null, micStream = null, node = null, playHead = 0;

function toPcm16Base64(samples) {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function playPcm16(base64) {
  if (!audioCtx) return;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);

  const buffer = audioCtx.createBuffer(1, pcm.length, SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  // Schedule chunks back to back so playback is gapless; if the queue has
  // drained, restart from now rather than from a time already in the past.
  playHead = Math.max(playHead, audioCtx.currentTime + 0.05);
  source.start(playHead);
  playHead += buffer.duration;
}

async function startMic() {
  $('micStart').disabled = true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
  } catch (err) {
    feedLine('convoFeed', `Microphone blocked: ${err.message}`, 'err');
    $('micStart').disabled = false;
    return;
  }

  audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  await audioCtx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })));

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const query = password ? `?token=${encodeURIComponent(password)}` : '';
  socket = new WebSocket(`${proto}://${location.host}/ws/console${query}`);

  socket.onopen = () => socket.send(JSON.stringify({
    type: 'start', campaignId: $('consoleCampaign').value || undefined,
  }));

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'audio') playPcm16(message.audio);
    else if (message.type === 'transcript') {
      feedLine('convoFeed', `${message.role === 'agent' ? 'Agent' : 'You'}: ${message.text}`, message.role);
    } else if (message.type === 'ready') {
      feedLine('convoFeed', `Connected${message.campaign ? ` using ${message.campaign}` : ''}. Start talking.`);
    } else if (message.type === 'speech_started') {
      playHead = 0; // Drop queued agent audio so it stops talking over you.
    } else if (message.type === 'error') {
      feedLine('convoFeed', message.message, 'err');
    }
  };

  socket.onclose = () => { feedLine('convoFeed', 'Disconnected.'); stopMic(); };
  socket.onerror = () => feedLine('convoFeed',
    'Could not open the voice socket. If this is shared hosting, run the WebSocket check in Settings.', 'err');

  const source = audioCtx.createMediaStreamSource(micStream);
  node = new AudioWorkletNode(audioCtx, 'tap');
  node.port.onmessage = (event) => {
    const samples = event.data;
    let peak = 0;
    for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
    $('micLevel').style.width = `${Math.min(100, peak * 170)}%`;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'audio', audio: toPcm16Base64(samples) }));
    }
  };
  source.connect(node);
  // Keep the worklet in the graph without echoing the mic back to the speakers.
  node.connect(audioCtx.createGain()).connect(audioCtx.destination);

  $('micStop').disabled = false;
  feedLine('convoFeed', 'Microphone is live.');
}

function stopMic() {
  try { socket?.send(JSON.stringify({ type: 'stop' })); } catch { /* closing */ }
  socket?.close(); socket = null;
  micStream?.getTracks().forEach((t) => t.stop()); micStream = null;
  node?.disconnect(); node = null;
  audioCtx?.close(); audioCtx = null;
  playHead = 0;
  $('micLevel').style.width = '0';
  $('micStart').disabled = false;
  $('micStop').disabled = true;
}

$('micStart').addEventListener('click', startMic);
$('micStop').addEventListener('click', stopMic);
$('typed').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const text = e.target.value.trim();
  if (!text || socket?.readyState !== WebSocket.OPEN) {
    return toast('Start the microphone first to open a session.', 'bad');
  }
  socket.send(JSON.stringify({ type: 'text', text }));
  feedLine('convoFeed', `You: ${text}`, 'caller');
  e.target.value = '';
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function refreshDashboard() {
  await Promise.all([refreshStatus(), refreshCampaigns(), refreshCalls()]);
}

async function boot() {
  renderDayPicker();
  try {
    await refreshDashboard();
    await refreshOptOut();
    connectEvents();
    setInterval(() => { refreshStatus().catch(() => {}); }, 6000);
    setInterval(() => { refreshCalls().catch(() => {}); }, 8000);
  } catch (err) {
    if (err.message !== 'unauthorised') toast(err.message, 'bad');
  }
}

// A saved password is tried first; the gate only appears if it is rejected.
api('/status').then(boot).catch(() => openGate());
