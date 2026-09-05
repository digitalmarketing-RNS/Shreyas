import { Router } from 'express';
import { config, configWarnings, plivoReady, xaiReady } from '../config.js';
import { log, recentLogs } from '../logger.js';
import { events } from '../util/events.js';
import { toE164 } from '../util/phone.js';
import { isValidTimeZone, parseHHMM } from '../util/windows.js';
import { calls, campaigns, dnc, leads, totals } from '../store.js';
import { importLeadsCsv, importNumberList, importOptOutList } from '../campaign/import.js';
import { reconcile, tick } from '../campaign/dialer.js';
import { activeBridge, activeBridgeCount } from '../plivo/bridge.js';
import { accountInfo, listNumbers, placeCall, hangupCall } from '../plivo/client.js';
import { probeXai } from '../xai/realtime.js';
import { tileInterest } from '../report/interest.js';
import { replyGaps, replyPace } from '../report/pace.js';

export const apiRouter = Router();

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

/**
 * This API can place real, billable phone calls, so it is password-protected
 * whenever DASHBOARD_PASSWORD is set. The check is skipped only when no
 * password is configured, which the dashboard flags as a warning.
 */
apiRouter.use((req, res, next) => {
  if (!config.dashboardPassword) return next();
  const header = req.header('Authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : String(req.query.token ?? '');
  if (supplied !== config.dashboardPassword) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  next();
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const fail = (res, message, detail) => res.status(400).json({ error: message, ...(detail ? { detail } : {}) });

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

apiRouter.get('/status', (_req, res) => {
  res.json({
    brand: config.brand,
    ready: { xai: xaiReady, plivo: plivoReady },
    agentId: config.xaiAgentId || null,
    number: config.plivoNumberDisplay || null,
    publicBaseUrl: config.publicBaseUrl || null,
    warnings: configWarnings(),
    activeCalls: calls.activeCount(),
    activeBridges: activeBridgeCount(),
    maxConcurrentCalls: config.maxConcurrentCalls,
    totals: totals(),
    volume: calls.volumeByDay(7),
  });
});

apiRouter.get('/logs', (_req, res) => res.json(recentLogs.slice(-120).reverse()));

// ---------------------------------------------------------------------------
// Connection tests — the fastest way to find a broken deployment
// ---------------------------------------------------------------------------

apiRouter.post('/test/xai', wrap(async (_req, res) => {
  res.json(await probeXai());
}));

apiRouter.post('/test/plivo', wrap(async (_req, res) => {
  try {
    const account = await accountInfo();
    res.json({ ok: true, ...account });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
}));

/**
 * Reports whether this host actually proxies WebSockets.
 *
 * On shared hosting this is the single most common reason a deployment fails:
 * the dashboard loads, calls connect, and then there is silence, because the
 * audio socket was never allowed through. The browser opens /ws/echo and this
 * endpoint just tells it where to look.
 */
apiRouter.get('/test/websocket-target', (req, res) => {
  const host = req.header('host');
  res.json({
    url: `${req.protocol === 'https' ? 'wss' : 'ws'}://${host}/ws/echo`,
    publicStreamUrl: config.publicBaseUrl
      ? `${config.publicBaseUrl.replace(/^http/, 'ws')}/plivo/stream`
      : null,
  });
});

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

function validateCampaign(body) {
  if (!String(body.name ?? '').trim()) return 'The campaign needs a name.';
  for (const field of ['windowStart', 'windowEnd']) {
    if (body[field] === undefined) continue;
    try {
      parseHHMM(body[field]);
    } catch {
      return `${field} must look like 09:00.`;
    }
  }
  if (body.defaultTimezone && !isValidTimeZone(body.defaultTimezone)) {
    return `"${body.defaultTimezone}" is not a timezone name.`;
  }
  if (body.maxAttempts !== undefined && !(body.maxAttempts >= 1 && body.maxAttempts <= 10)) {
    return 'Max attempts must be between 1 and 10.';
  }
  if (body.concurrency !== undefined && !(body.concurrency >= 1 && body.concurrency <= 50)) {
    return 'Concurrency must be between 1 and 50.';
  }
  return null;
}

apiRouter.get('/campaigns', (_req, res) => {
  res.json(campaigns.all().map((c) => ({ ...c, stats: campaigns.stats(c.id) })));
});

apiRouter.post('/campaigns', (req, res) => {
  const problem = validateCampaign(req.body ?? {});
  if (problem) return fail(res, problem);
  res.status(201).json(campaigns.create(req.body));
});

/**
 * Creates a campaign, loads its numbers and starts dialling — in one request.
 *
 * The wizard collects all three at once, and doing them as three requests
 * meant a failure partway left a half-built campaign behind: named, maybe
 * with numbers, not running, and looking to the operator like it had worked.
 * Here nothing is stored until the numbers parse, and a campaign that cannot
 * start is removed again rather than left as debris.
 */
apiRouter.post('/campaigns/launch', (req, res) => {
  const body = req.body ?? {};
  const problem = validateCampaign(body);
  if (problem) return fail(res, problem);

  const hasNumbers = Array.isArray(body.numbers)
    ? body.numbers.length > 0
    : String(body.numbers ?? '').trim().length > 0;
  if (!hasNumbers) return fail(res, 'Add at least one phone number.');

  // A deployment that cannot dial yet still gets its campaign built and its
  // numbers loaded — it is saved rather than started, and told why. Refusing
  // outright would mean nobody could prepare a campaign before finishing
  // setup, which is the order most people actually work in.
  const blocked = !plivoReady
    ? 'Plivo is not configured, so no calls can be placed yet.'
    : !xaiReady
      ? 'The xAI API key is not set, so the agent cannot answer yet.'
      : null;
  const start = body.start !== false && !blocked;

  const campaign = campaigns.create(body);
  const imported = importNumberList(campaign, body.numbers);

  if (imported.imported === 0) {
    campaigns.remove(campaign.id);
    const reason = imported.rejected[0]?.reason;
    return fail(
      res,
      imported.suppressed || imported.duplicates
        ? 'Every number in that list is already opted out or already in another campaign.'
        : `None of those numbers could be read${reason ? ` — ${reason}` : ''}.`,
    );
  }

  let started = false;
  if (start) {
    campaigns.update(campaign.id, { status: 'running' });
    started = true;
    log.info({ campaignId: campaign.id, leads: imported.imported }, 'campaign launched');
  }

  res.status(201).json({
    campaign: { ...campaigns.get(campaign.id), stats: campaigns.stats(campaign.id) },
    imported,
    started,
    blocked,
  });

  // After responding: the operator does not wait on the first dial.
  if (started) void tick();
});

apiRouter.get('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'No such campaign.' });
  res.json({ ...campaign, stats: campaigns.stats(campaign.id) });
});

apiRouter.patch('/campaigns/:id', (req, res) => {
  const problem = validateCampaign({ name: 'x', ...req.body });
  if (problem) return fail(res, problem);
  const updated = campaigns.update(req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: 'No such campaign.' });
  res.json(updated);
});

apiRouter.delete('/campaigns/:id', (req, res) => {
  res.json({ deleted: campaigns.remove(req.params.id) });
});

apiRouter.post('/campaigns/:id/start', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'No such campaign.' });
  if (!plivoReady) return fail(res, 'Plivo is not configured, so no calls can be placed.');
  if (!xaiReady) return fail(res, 'The xAI API key is not set, so the agent cannot answer.');

  const stats = campaigns.stats(campaign.id);
  if (stats.pending === 0) return fail(res, 'This campaign has no leads waiting to be called.');

  res.json(campaigns.update(campaign.id, { status: 'running' }));
  log.info({ campaignId: campaign.id }, 'campaign started');
  void tick(); // Start dialling now rather than on the next interval.
});

apiRouter.post('/campaigns/:id/pause', (req, res) => {
  const updated = campaigns.update(req.params.id, { status: 'paused' });
  if (!updated) return res.status(404).json({ error: 'No such campaign.' });
  res.json(updated);
});

apiRouter.get('/campaigns/:id/stats', (req, res) => res.json(campaigns.stats(req.params.id)));

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

apiRouter.get('/campaigns/:id/leads', (req, res) => {
  res.json(
    leads.list(req.params.id, {
      status: req.query.status ? String(req.query.status) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    }),
  );
});

/** Accepts a raw CSV body, or JSON `{ leads: [...] }`. */
apiRouter.post('/campaigns/:id/leads', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'No such campaign.' });

  if (typeof req.body === 'string') {
    try {
      return res.json(importLeadsCsv(campaign, req.body));
    } catch (err) {
      return fail(res, err.message);
    }
  }

  const list = Array.isArray(req.body?.leads) ? req.body.leads : null;
  if (!list?.length) return fail(res, 'Send a CSV body or { leads: [...] }.');

  const result = { imported: 0, duplicates: 0, suppressed: 0, rejected: [] };
  list.forEach((raw, index) => {
    try {
      const created = leads.add(campaign.id, {
        phone: toE164(raw.phone, campaign.defaultCountryCode ?? undefined),
        name: raw.name ?? null,
        timezone:
          raw.timezone && isValidTimeZone(raw.timezone) ? raw.timezone : campaign.defaultTimezone,
        attributes: raw.attributes ?? {},
      });
      if (!created) result.duplicates++;
      else if (created.status === 'suppressed') result.suppressed++;
      else result.imported++;
    } catch (err) {
      result.rejected.push({ row: index + 1, value: raw.phone, reason: err.message });
    }
  });
  res.json(result);
});

apiRouter.delete('/leads/:id', (req, res) => res.json({ deleted: leads.remove(req.params.id) }));

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

/**
 * Adds the tile-requirement answer read back out of the transcript.
 *
 * Derived on the way out rather than stored on the call, so it covers calls
 * that were made before this existed and so improving how the answer is read
 * never needs old records rewritten. The stored record is not touched.
 */
function withInterest(record) {
  return {
    ...record,
    tileInterest: tileInterest(record.transcript),
    replyPace: replyPace(record.transcript),
    replyGaps: replyGaps(record.transcript),
  };
}

apiRouter.get('/calls', (req, res) => {
  res.json(
    calls.list({
      campaignId: req.query.campaignId ? String(req.query.campaignId) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }).map(withInterest),
  );
});

apiRouter.get('/calls/:id', (req, res) => {
  const record = calls.get(req.params.id);
  if (!record) return res.status(404).json({ error: 'No such call.' });
  res.json(withInterest(record));
});

/** Places one call immediately — the quickest end-to-end check of a deployment. */
apiRouter.post('/calls', wrap(async (req, res) => {
  if (!plivoReady) return fail(res, 'Plivo is not configured.');

  let to;
  try {
    to = toE164(req.body?.to, config.defaultCountryCode);
  } catch (err) {
    return fail(res, err.message);
  }
  if (dnc.has(to)) return fail(res, 'That number is on the opt-out list.');

  const campaign = req.body?.campaignId ? campaigns.get(req.body.campaignId) : null;
  const record = calls.create({
    campaignId: campaign?.id ?? null,
    leadId: null,
    direction: 'outbound',
    fromNumber: config.plivoNumberDisplay,
    toNumber: to,
  });

  try {
    const { requestUuid } = await placeCall({
      to,
      from: config.plivoNumber,
      callId: record.id,
      ringTimeout: config.ringTimeoutSeconds,
      detectMachine: campaign?.hangupOnMachine ?? false,
    });
    calls.update(record.id, { requestUuid, status: 'ringing' });
    events.emit('call:dialing', { callId: record.id, to });
    res.status(201).json(calls.get(record.id));
  } catch (err) {
    calls.update(record.id, {
      status: 'failed',
      disposition: 'failed',
      endedAt: new Date().toISOString(),
      error: err.message,
    });
    res.status(502).json({ error: 'Plivo refused the call.', detail: err.message });
  }
}));

apiRouter.post('/calls/:id/hangup', wrap(async (req, res) => {
  const record = calls.get(req.params.id);
  if (!record) return res.status(404).json({ error: 'No such call.' });
  activeBridge(record.id)?.hangup();
  if (record.callUuid) await hangupCall(record.callUuid);
  calls.update(record.id, { endedAt: record.endedAt ?? new Date().toISOString(), status: 'completed' });
  res.json({ ok: true });
}));

// ---------------------------------------------------------------------------
// Opt-out list
// ---------------------------------------------------------------------------

apiRouter.get('/optout', (_req, res) => res.json(dnc.list()));

apiRouter.post('/optout', (req, res) => {
  if (typeof req.body === 'string') {
    return res.json(importOptOutList(req.body, config.defaultCountryCode, 'bulk import'));
  }
  try {
    const phone = toE164(req.body?.phone, config.defaultCountryCode);
    dnc.add(phone, req.body?.reason ?? 'added from the dashboard');
    res.status(201).json({ phone });
  } catch (err) {
    fail(res, err.message);
  }
});

apiRouter.delete('/optout/:phone', (req, res) => {
  res.json({ removed: dnc.remove(decodeURIComponent(req.params.phone)) });
});

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

apiRouter.get('/numbers', wrap(async (_req, res) => {
  if (!plivoReady) return fail(res, 'Plivo is not configured.');
  try {
    res.json(await listNumbers());
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}));

// ---------------------------------------------------------------------------
// Live activity
// ---------------------------------------------------------------------------

apiRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const names = [
    'call:dialing', 'call:started', 'call:transcript', 'call:ended',
    'call:bridge-ended', 'call:dtmf', 'call:error', 'lead:updated', 'campaign:completed',
  ];
  const handlers = names.map((name) => {
    const handler = (payload) => res.write(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`);
    events.on(name, handler);
    return [name, handler];
  });

  // Shared hosting proxies drop idle connections; a comment frame keeps it warm.
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 20_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    for (const [name, handler] of handlers) events.off(name, handler);
  });
});

apiRouter.post('/reconcile', (_req, res) => {
  reconcile();
  res.json({ ok: true });
});
