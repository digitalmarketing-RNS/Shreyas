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

/** Switches page as if the sidebar item had been clicked, so the active
 *  highlight and the page's own refresh both happen. */
function showPage(target) {
  document.querySelector(`.nav-item[data-page="${target}"]`)?.click();
}

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

  // Names the one agent every call reaches, so the wizard is concrete about
  // whose configuration is in charge.
  const agentLabel = $('wizAgentId');
  if (agentLabel) agentLabel.textContent = status.agentId ?? 'set in XAI_AGENT_ID';

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

function statusLabel(status) {
  return status === 'draft' ? 'Not started' : status[0].toUpperCase() + status.slice(1);
}

function whenLabel(iso) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '—';
  return `${at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <div class="sub">${at.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>`;
}

/** Applies the search box and status filter to the cached list. */
function visibleCampaigns() {
  const term = $('campaignSearch').value.trim().toLowerCase();
  const status = $('campaignFilter').value;
  return campaignCache.filter((c) => {
    if (status && c.status !== status) return false;
    if (!term) return true;
    return c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term);
  });
}

function renderCampaignTable() {
  const rows = visibleCampaigns();
  const anyAtAll = campaignCache.length > 0;

  $('campaignRows').innerHTML = rows.length ? rows.map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>
        <span class="idcell">
          <code>${esc(c.id)}</code>
          <button class="copy" data-copy="${esc(c.id)}" title="Copy campaign ID" aria-label="Copy campaign ID">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          </button>
        </span>
      </td>
      <td>${progressBar(c.stats)}</td>
      <td>${c.stats.total}<div class="sub">${c.stats.pending} waiting</div></td>
      <td>${whenLabel(c.createdAt)}</td>
      <td><span class="badge ${c.status}">${statusLabel(c.status)}</span></td>
      <td style="white-space:nowrap">
        ${c.status === 'running'
          ? `<button class="btn sm" data-act="pause" data-id="${c.id}">Pause</button>`
          : `<button class="btn sm primary" data-act="start" data-id="${c.id}">Start</button>`}
        <button class="btn sm" data-act="report" data-id="${c.id}">Report</button>
        <button class="btn sm danger" data-act="delete" data-id="${c.id}">Delete</button>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="7" class="empty">${anyAtAll
        ? 'No campaigns match that search.'
        : 'No campaigns yet. Press “New campaign” to make one.'}</td></tr>`;
}

async function refreshCampaigns() {
  campaignCache = await api('/campaigns');
  $('navCampaignCount').textContent = campaignCache.length;
  renderCampaignTable();

  $('dashCampaigns').innerHTML = campaignCache.length ? campaignCache.slice(0, 6).map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>${progressBar(c.stats)}</td>
      <td>${c.stats.total}</td>
      <td><span class="badge ${c.status}">${statusLabel(c.status)}</span></td>
      <td>${c.status === 'running'
        ? `<button class="btn sm" data-act="pause" data-id="${c.id}">Pause</button>`
        : `<button class="btn sm primary" data-act="start" data-id="${c.id}">Start</button>`}</td>
    </tr>`).join('')
    : '<tr><td colspan="5" class="empty">No campaigns yet.</td></tr>';

  // Leads still need a campaign to belong to. Nothing else picks one, because
  // nothing else varies per campaign any more.
  const options = campaignCache.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const keep = $('leadCampaign').value;
  $('leadCampaign').innerHTML = options || '<option value="">Create a campaign first</option>';
  if (keep) $('leadCampaign').value = keep;
}

$('campaignSearch').addEventListener('input', renderCampaignTable);
$('campaignFilter').addEventListener('change', renderCampaignTable);

async function campaignAction(event) {
  const copyButton = event.target.closest('button[data-copy]');
  if (copyButton) {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy);
      copyButton.classList.add('done');
      setTimeout(() => copyButton.classList.remove('done'), 1200);
    } catch {
      toast('Your browser would not let the page copy that.', 'bad');
    }
    return;
  }

  const button = event.target.closest('button[data-act]');
  if (!button) return;
  const { act, id } = button.dataset;

  if (act === 'report') {
    // Call Reports already lists every call with its transcript; scope it to
    // this campaign rather than building a second, lesser view of the same
    // rows. Navigating triggers the refresh, so none is issued here.
    callsScopedTo = id;
    showPage('calls');
    return;
  }

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

// ---------------------------------------------------------------------------
// Campaign wizard
// ---------------------------------------------------------------------------

let wizStep = 1;

/** Splits the textarea the same way the server does, so counts agree. */
function typedNumbers() {
  return $('cNumbers').value
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

/**
 * Sorts what was typed into what will dial and what will not.
 *
 * A preview, not a verdict — the server normalises to E.164 and has the final
 * say. But the count shown beside the box and the count promised on the last
 * step both come from here, so the two cannot contradict each other, and
 * neither promises to dial something that plainly is not a phone number.
 */
function classifyNumbers() {
  const seen = new Set();
  const usable = [];
  const unusable = [];
  let duplicates = 0;

  for (const value of typedNumbers()) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      unusable.push(value);
    } else if (seen.has(digits)) {
      duplicates++;
    } else {
      seen.add(digits);
      usable.push(value);
    }
  }
  return { usable, unusable, duplicates };
}

function showStep(step) {
  wizStep = step;
  document.querySelectorAll('.wiz-step').forEach((panel) => {
    panel.classList.toggle('hidden', Number(panel.dataset.step) !== step);
  });
  document.querySelectorAll('.stepper .step').forEach((dot) => {
    const n = Number(dot.dataset.step);
    dot.classList.toggle('on', n === step);
    dot.classList.toggle('done', n < step);
  });
  document.querySelectorAll('.stepper > i').forEach((line, index) => {
    line.classList.toggle('on', index < step - 1);
  });

  $('wizBack').classList.toggle('hidden', step === 1);
  $('wizNext').classList.toggle('hidden', step === 3);
  $('wizCreate').classList.toggle('hidden', step !== 3);
  if (step === 3) renderHowTo();

  const focus = document.querySelector(`.wiz-step[data-step="${step}"] input, .wiz-step[data-step="${step}"] textarea`);
  focus?.focus();
}

/** Says what pressing the button will actually do, using the real numbers. */
function renderHowTo() {
  const count = classifyNumbers().usable.length;
  const attempts = Number($('cAttempts').value) || 1;
  $('howtoList').innerHTML = [
    `${count} number${count === 1 ? '' : 's'} will be loaded and the campaign starts straight away.`,
    'One call runs at a time; the rest wait in the queue.',
    'As each call ends, the next number is dialled automatically.',
    `A number that does not answer is retried up to ${attempts} time${attempts === 1 ? '' : 's'}.`,
    `Calls are only placed between ${esc($('cWinStart').value)} and ${esc($('cWinEnd').value)}, on the days you picked.`,
    'Anyone on your opt-out list is skipped and never dialled.',
  ].map((line) => `<li>${line}</li>`).join('');
}

function updateNumberCount() {
  const { usable, unusable, duplicates } = classifyNumbers();
  const box = $('numberCount');

  if (!usable.length && !unusable.length) {
    box.textContent = 'No numbers yet.';
    box.className = 'callout';
    return;
  }

  const asides = [
    duplicates ? `${duplicates} duplicate${duplicates === 1 ? '' : 's'} ignored` : '',
    unusable.length ? `${unusable.length} not a phone number (${esc(unusable.slice(0, 3).join(', '))}${unusable.length > 3 ? '…' : ''})` : '',
  ].filter(Boolean);

  box.textContent = `${usable.length} number${usable.length === 1 ? '' : 's'} will be called`
    + (asides.length ? ` · ${asides.join(' · ')}` : '');
  box.className = unusable.length ? 'callout warn' : 'callout';
}

function openWizard() {
  showStep(1);
  $('wizard').classList.remove('hidden');
  updateNumberCount();
  $('cNameCount').textContent = $('cName').value.length;
  $('cName').focus();
}

function closeWizard() {
  $('wizard').classList.add('hidden');
}

function resetWizard() {
  for (const id of ['cName', 'cNumbers']) $(id).value = '';
  $('cNameCount').textContent = '0';
  updateNumberCount();
  showStep(1);
}

$('openWizard').addEventListener('click', openWizard);
$('wizClose').addEventListener('click', closeWizard);
$('wizCancel').addEventListener('click', closeWizard);
$('wizBack').addEventListener('click', () => showStep(wizStep - 1));

$('wizNext').addEventListener('click', () => {
  if (wizStep === 1 && !$('cName').value.trim()) return toast('Give the campaign a name.', 'bad');
  if (wizStep === 2 && !classifyNumbers().usable.length) {
    return toast('Add at least one number that looks like a phone number.', 'bad');
  }
  showStep(wizStep + 1);
});

// Clicking the backdrop closes; clicking inside the box must not.
$('wizard').addEventListener('click', (e) => { if (e.target === $('wizard')) closeWizard(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('wizard').classList.contains('hidden')) closeWizard();
});

$('cName').addEventListener('input', () => { $('cNameCount').textContent = $('cName').value.length; });
$('cNumbers').addEventListener('input', updateNumberCount);
$('cCountry').addEventListener('input', () => {
  $('cCountryEcho').textContent = `+${$('cCountry').value.trim() || '91'}`;
});

$('wizCreate').addEventListener('click', async () => {
  const numbers = classifyNumbers().usable;
  const body = {
    name: $('cName').value.trim(),
    numbers,
    windowStart: $('cWinStart').value.trim(),
    windowEnd: $('cWinEnd').value.trim(),
    windowDays: selectedDays(),
    defaultTimezone: $('cTz').value.trim(),
    defaultCountryCode: $('cCountry').value.trim() || null,
    maxAttempts: Number($('cAttempts').value),
    retryDelayMinutes: Number($('cRetry').value),
    // One call at a time, always. Dialling several at once means several live
    // conversations nobody is listening to, and the operator cannot follow
    // what the agent is doing on any of them.
    concurrency: 1,
    hangupOnMachine: $('cMachine').value === 'true',
  };
  if (!body.name) return toast('Give the campaign a name.', 'bad');
  if (!numbers.length) return toast('Add at least one phone number.', 'bad');
  if (!body.windowDays.length) return toast('Pick at least one calling day.', 'bad');

  const button = $('wizCreate');
  button.disabled = true;
  try {
    const result = await api('/campaigns/launch', { method: 'POST', body: JSON.stringify(body) });
    closeWizard();
    resetWizard();
    await refreshCampaigns();

    const { imported } = result;
    // Say what was dropped rather than only what worked: a silently skipped
    // number looks like a call that never happened.
    const skipped = [
      imported.duplicates ? `${imported.duplicates} duplicate` : '',
      imported.suppressed ? `${imported.suppressed} opted out` : '',
      imported.rejected.length ? `${imported.rejected.length} unreadable` : '',
    ].filter(Boolean).join(', ');
    const loaded = `${imported.imported} number${imported.imported === 1 ? '' : 's'} loaded`
      + (skipped ? ` (${skipped})` : '');
    if (result.started) {
      toast(`${loaded} — dialling now.`, 'ok');
    } else {
      // Saved but not running. Say why, or the campaign looks broken rather
      // than waiting on a setting the operator still has to fill in.
      toast(`${loaded}. Saved but not dialling: ${result.blocked ?? 'start it when you are ready.'}`, 'bad');
    }
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    button.disabled = false;
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
         <td><span class="badge ${c.disposition ?? c.status}"${c.error ? ` title="${esc(c.error)}"` : ''}>${esc(c.disposition ?? c.status)}</span></td></tr>`
    : `<tr>
         <td class="mono">${esc(c.toNumber)}</td>
         <td class="sub">${new Date(c.startedAt).toLocaleString()}</td>
         <td>${c.durationSeconds ?? '—'}</td>
         <td><span class="badge ${c.status}">${esc(c.status)}</span></td>
         ${/* What the person said when asked whether they have a tile
              requirement, read back out of their own transcript. The sentence
              it was read from is on the cell, so a Yes or No can be checked
              without opening the call; a call that never gave a clear answer
              shows a dash rather than a guess. */''}
         <td>${c.tileInterest?.answer
             ? `<span class="badge want-${c.tileInterest.answer}" title="Caller said: ${esc(c.tileInterest.quote)}">${c.tileInterest.answer === 'yes' ? 'Yes' : 'No'}</span>
                <div class="sub quote">“${esc(c.tileInterest.quote)}”</div>`
             : '<span class="muted">—</span>'}</td>
         <td><span class="badge ${c.disposition ?? ''}">${esc(c.disposition ?? '—')}</span>
             ${c.details?.outcome ? `<div class="sub">${esc(c.details.outcome)}</div>` : ''}
             ${/* A bare "failed" badge tells the operator nothing they can act
                  on. The reason the carrier gave is already on the record —
                  show it, or the only way to find it is the server log. */''}
             ${c.error ? `<div class="sub err-reason">${esc(c.error)}</div>` : ''}</td>
         <td style="white-space:nowrap">
           ${c.transcript?.length ? `<button class="btn sm" data-transcript="${c.id}">Transcript</button>` : ''}
           ${!c.endedAt ? `<button class="btn sm danger" data-hangup="${c.id}">End</button>` : ''}
         </td>
       </tr>`).join('');
  $(target).innerHTML = rows || `<tr><td colspan="${compact ? 3 : 7}" class="empty">No calls yet.</td></tr>`;
}

/** Set when the operator opened this page from one campaign's Report button. */
let callsScopedTo = null;

async function refreshCalls() {
  const scope = callsScopedTo ? `&campaignId=${encodeURIComponent(callsScopedTo)}` : '';
  const list = await api(`/calls?limit=60${scope}`);
  renderCallRows(list, 'callRows', false);

  // The dashboard's recent-calls list is never scoped — it is the whole system
  // at a glance, and quietly filtering it would misreport how much is running.
  const unscoped = callsScopedTo ? await api('/calls?limit=8') : list.slice(0, 8);
  renderCallRows(unscoped.slice(0, 8), 'dashCalls', true);

  const note = $('callFilterNote');
  if (callsScopedTo) {
    const campaign = campaignCache.find((c) => c.id === callsScopedTo);
    $('callFilterText').textContent = `Showing calls from “${campaign?.name ?? callsScopedTo}” only.`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
}

$('callFilterClear').addEventListener('click', async () => {
  callsScopedTo = null;
  await refreshCalls();
});

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

    // The line the tile-requirement column was read from is marked here, so
    // the column can be checked against the transcript rather than believed.
    const answeredAt = call.tileInterest?.index ?? -1;
    $('transcriptFeed').innerHTML = call.transcript.map((t, i) =>
      `<div class="line${i === answeredAt ? ' answer' : ''}"><span class="at">${new Date(t.at).toLocaleTimeString()}</span>
       <span class="${t.role}">${t.role === 'agent' ? 'Agent' : 'Person'}: ${esc(t.text)}</span>${
         i === answeredAt ? `<span class="tag">tile requirement: ${call.tileInterest.answer}</span>` : ''
       }</div>`).join('')
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
      body: JSON.stringify({ to }),
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
    type: 'start',
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
