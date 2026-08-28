import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { log } from './logger.js';

/**
 * Storage.
 *
 * Deliberately a plain JSON file rather than SQLite: shared hosting frequently
 * cannot compile native modules, and a failed `npm install` on the server is a
 * far worse outcome than the modest scale limit this imposes. Everything is
 * held in memory and flushed atomically (write to .tmp, then rename) so a
 * crash mid-write cannot corrupt the file.
 *
 * Comfortable up to roughly 50k leads. Past that, move to a real database.
 */

/**
 * Resolves a writable data directory.
 *
 * Shared hosting does not always allow the application root to be written to.
 * This used to throw during module import, which killed the process before it
 * could listen and surfaced only as a bare 503 from the host's proxy. Now it
 * degrades: app directory, then the system temp directory, then memory only.
 */
function resolveDataDir() {
  for (const candidate of [config.dataDir, join(tmpdir(), 'rns-voice')]) {
    try {
      mkdirSync(candidate, { recursive: true });
      // Prove it is actually writable rather than merely present.
      const probe = join(candidate, '.write-probe');
      writeFileSync(probe, 'ok');
      renameSync(probe, join(candidate, '.write-probe-ok'));
      if (candidate !== config.dataDir) {
        log.warn(
          { configured: config.dataDir, using: candidate },
          'data directory is not writable; falling back to temporary storage (campaigns will not survive a restart)',
        );
      }
      return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  log.error('no writable data directory; running in memory only, nothing will be saved');
  return null;
}

const DATA_DIR = resolveDataDir();
export const storageWritable = DATA_DIR !== null;
const FILE = DATA_DIR ? join(DATA_DIR, 'db.json') : null;
const TMP = FILE ? `${FILE}.tmp` : null;

const empty = () => ({ campaigns: [], leads: [], calls: [], dnc: [] });

function load() {
  if (!FILE || !existsSync(FILE)) return empty();
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8'));
    return { ...empty(), ...parsed };
  } catch (err) {
    // Never start with a blank database over a file we failed to parse — that
    // silently discards a customer's lead list.
    const backup = `${FILE}.corrupt-${Date.now()}`;
    renameSync(FILE, backup);
    log.error({ err, backup }, 'database file was unreadable; kept a copy and started empty');
    return empty();
  }
}

const data = load();

let dirty = false;
let flushing = false;

/** Writes are debounced: a busy campaign changes state far faster than a disk needs it. */
export function persist() {
  dirty = true;
}

function flush() {
  if (!dirty || flushing || !FILE) return;
  flushing = true;
  dirty = false;
  try {
    writeFileSync(TMP, JSON.stringify(data));
    renameSync(TMP, FILE);
  } catch (err) {
    dirty = true;
    log.error({ err }, 'failed to write database');
  } finally {
    flushing = false;
  }
}

const flushTimer = setInterval(flush, 1500);
flushTimer.unref?.();

/** Flushed synchronously on the way out so nothing in flight is lost. */
export function closeStore() {
  clearInterval(flushTimer);
  dirty = true;
  flush();
}

const id = (prefix) => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const campaigns = {
  all: () => data.campaigns.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  get: (campaignId) => data.campaigns.find((c) => c.id === campaignId) ?? null,

  running: () => data.campaigns.filter((c) => c.status === 'running'),

  create(input) {
    const campaign = {
      id: id('cmp'),
      name: input.name,
      status: 'draft',
      // Left null so the agent's own console configuration is used. Only set
      // these when a campaign genuinely needs to differ from the agent.
      instructions: input.instructions ?? null,
      opener: input.opener ?? null,
      voice: input.voice ?? null,
      agentId: input.agentId ?? null,
      maxAttempts: input.maxAttempts ?? 3,
      retryDelayMinutes: input.retryDelayMinutes ?? 60,
      concurrency: input.concurrency ?? 2,
      windowStart: input.windowStart ?? '10:00',
      windowEnd: input.windowEnd ?? '19:00',
      windowDays: input.windowDays ?? [1, 2, 3, 4, 5, 6],
      defaultTimezone: input.defaultTimezone ?? config.defaultTimezone,
      defaultCountryCode: input.defaultCountryCode ?? config.defaultCountryCode,
      hangupOnMachine: input.hangupOnMachine !== false,
      createdAt: now(),
      updatedAt: now(),
    };
    data.campaigns.push(campaign);
    persist();
    return campaign;
  },

  update(campaignId, patch) {
    const campaign = campaigns.get(campaignId);
    if (!campaign) return null;
    const editable = [
      'name', 'status', 'instructions', 'opener', 'voice', 'agentId',
      'maxAttempts', 'retryDelayMinutes', 'concurrency', 'windowStart',
      'windowEnd', 'windowDays', 'defaultTimezone', 'defaultCountryCode', 'hangupOnMachine',
    ];
    for (const key of editable) {
      if (patch[key] !== undefined) campaign[key] = patch[key];
    }
    campaign.updatedAt = now();
    persist();
    return campaign;
  },

  remove(campaignId) {
    const before = data.campaigns.length;
    data.campaigns = data.campaigns.filter((c) => c.id !== campaignId);
    data.leads = data.leads.filter((l) => l.campaignId !== campaignId);
    persist();
    return data.campaigns.length < before;
  },

  stats(campaignId) {
    const out = { total: 0, pending: 0, dialing: 0, completed: 0, exhausted: 0, suppressed: 0, answered: 0 };
    for (const lead of data.leads) {
      if (lead.campaignId !== campaignId) continue;
      out.total++;
      out[lead.status] = (out[lead.status] ?? 0) + 1;
    }
    for (const call of data.calls) {
      if (call.campaignId === campaignId && call.disposition === 'answered') out.answered++;
    }
    return out;
  },
};

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const leads = {
  get: (leadId) => data.leads.find((l) => l.id === leadId) ?? null,

  list(campaignId, { status, limit = 200, offset = 0 } = {}) {
    return data.leads
      .filter((l) => l.campaignId === campaignId && (!status || l.status === status))
      .slice(offset, offset + limit);
  },

  exists: (campaignId, phone) =>
    data.leads.some((l) => l.campaignId === campaignId && l.phone === phone),

  add(campaignId, lead) {
    if (leads.exists(campaignId, lead.phone)) return null;
    const suppressed = dnc.has(lead.phone);
    const record = {
      id: id('led'),
      campaignId,
      phone: lead.phone,
      name: lead.name ?? null,
      timezone: lead.timezone,
      attributes: lead.attributes ?? {},
      status: suppressed ? 'suppressed' : 'pending',
      attempts: 0,
      nextAttemptAt: suppressed ? null : now(),
      lastDisposition: null,
      note: suppressed ? 'on the opt-out list at import' : null,
      createdAt: now(),
    };
    data.leads.push(record);
    persist();
    return record;
  },

  /** Pending leads whose retry time has arrived. Calling-window filtering is the dialer's job. */
  due(campaignId, limit) {
    const cutoff = now();
    return data.leads
      .filter(
        (l) =>
          l.campaignId === campaignId &&
          l.status === 'pending' &&
          (!l.nextAttemptAt || l.nextAttemptAt <= cutoff),
      )
      .sort((a, b) => (a.nextAttemptAt ?? '').localeCompare(b.nextAttemptAt ?? ''))
      .slice(0, limit);
  },

  /** Claims a lead for dialling. Returns false if it was already taken. */
  claim(leadId) {
    const lead = leads.get(leadId);
    if (!lead || lead.status !== 'pending') return false;
    lead.status = 'dialing';
    persist();
    return true;
  },

  setStatus(leadId, status, note) {
    const lead = leads.get(leadId);
    if (!lead) return;
    lead.status = status;
    if (note) lead.note = note;
    persist();
  },

  /** Defers without spending an attempt — used when the local window is shut. */
  defer(leadId, nextAttemptAt) {
    const lead = leads.get(leadId);
    if (!lead || lead.status !== 'pending') return;
    lead.nextAttemptAt = nextAttemptAt;
    persist();
  },

  recordAttempt(leadId, disposition, nextAttemptAt, status) {
    const lead = leads.get(leadId);
    if (!lead) return;
    lead.attempts += 1;
    lead.lastDisposition = disposition;
    lead.nextAttemptAt = nextAttemptAt;
    lead.status = status;
    persist();
  },

  remove(leadId) {
    const before = data.leads.length;
    data.leads = data.leads.filter((l) => l.id !== leadId);
    persist();
    return data.leads.length < before;
  },

  /** Frees leads left mid-dial by a crash or a webhook that never arrived. */
  releaseStale(olderThanMinutes = 15) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
    let freed = 0;
    for (const lead of data.leads) {
      if (lead.status !== 'dialing') continue;
      const live = data.calls.some((c) => c.leadId === lead.id && !c.endedAt);
      if (live) continue;
      const last = data.calls
        .filter((c) => c.leadId === lead.id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      if (last && last.startedAt > cutoff) continue;
      lead.status = 'pending';
      freed++;
    }
    if (freed) persist();
    return freed;
  },
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export const calls = {
  get: (callId) => data.calls.find((c) => c.id === callId) ?? null,

  byProviderId(providerId) {
    if (!providerId) return null;
    return (
      data.calls.find((c) => c.callUuid === providerId || c.requestUuid === providerId) ?? null
    );
  },

  create(input) {
    const record = {
      id: id('cal'),
      campaignId: input.campaignId ?? null,
      leadId: input.leadId ?? null,
      direction: input.direction ?? 'outbound',
      requestUuid: null,
      callUuid: null,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      status: 'initiated',
      disposition: null,
      startedAt: now(),
      answeredAt: null,
      endedAt: null,
      durationSeconds: null,
      transcript: [],
      error: null,
    };
    data.calls.push(record);
    // Keep the file from growing without bound on a long-running deployment.
    if (data.calls.length > 5000) data.calls.splice(0, data.calls.length - 5000);
    persist();
    return record;
  },

  update(callId, patch) {
    const call = calls.get(callId);
    if (!call) return null;
    Object.assign(call, patch);
    persist();
    return call;
  },

  /**
   * Appends a transcript turn. The caller's transcript arrives cumulative
   * (each event restates the whole utterance), while the agent's arrives as
   * deltas, so the two are merged differently.
   */
  appendTranscript(callId, turn, cumulative = false) {
    const call = calls.get(callId);
    if (!call) return;
    const last = call.transcript[call.transcript.length - 1];
    if (last && last.role === turn.role) {
      if (cumulative) last.text = turn.text;
      else last.text += turn.text;
    } else {
      call.transcript.push({ ...turn });
    }
    persist();
  },

  list({ campaignId, limit = 50 } = {}) {
    return data.calls
      .filter((c) => !campaignId || c.campaignId === campaignId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  },

  activeCount(campaignId) {
    return data.calls.filter(
      (c) => !c.endedAt && c.status !== 'failed' && (!campaignId || c.campaignId === campaignId),
    ).length;
  },

  /** Closes out calls Plivo never sent a final status for. */
  reapStale(olderThanMinutes = 30) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
    let reaped = 0;
    for (const call of data.calls) {
      if (call.endedAt || call.startedAt > cutoff) continue;
      call.endedAt = now();
      call.status = 'failed';
      call.error ??= 'no final status received from Plivo';
      reaped++;
    }
    if (reaped) persist();
    return reaped;
  },

  /** Daily totals for the dashboard chart. */
  volumeByDay(days = 7) {
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      buckets.set(day, 0);
    }
    for (const call of data.calls) {
      const day = call.startedAt.slice(0, 10);
      if (buckets.has(day)) buckets.set(day, buckets.get(day) + 1);
    }
    return [...buckets].map(([day, count]) => ({ day, count }));
  },
};

// ---------------------------------------------------------------------------
// Opt-out list
// ---------------------------------------------------------------------------

export const dnc = {
  has: (phone) => data.dnc.some((d) => d.phone === phone),

  add(phone, reason) {
    if (!dnc.has(phone)) {
      data.dnc.push({ phone, reason: reason ?? null, createdAt: now() });
    }
    // Retire the number from every queue it is sitting in.
    for (const lead of data.leads) {
      if (lead.phone === phone && (lead.status === 'pending' || lead.status === 'dialing')) {
        lead.status = 'suppressed';
        lead.note = 'added to the opt-out list';
      }
    }
    persist();
  },

  remove(phone) {
    const before = data.dnc.length;
    data.dnc = data.dnc.filter((d) => d.phone !== phone);
    persist();
    return data.dnc.length < before;
  },

  list: (limit = 500) =>
    data.dnc.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),

  count: () => data.dnc.length,
};

export const totals = () => ({
  campaigns: data.campaigns.length,
  leads: data.leads.length,
  calls: data.calls.length,
  optOuts: data.dnc.length,
});
