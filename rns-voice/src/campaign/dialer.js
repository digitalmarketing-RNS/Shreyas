import { config, plivoReady } from '../config.js';
import { log } from '../logger.js';
import { events } from '../util/events.js';
import { maskPhone } from '../util/phone.js';
import { isWithinWindow, nextWindowOpening, windowFor } from '../util/windows.js';
import { placeCall } from '../plivo/client.js';
import { prewarmSession } from '../plivo/bridge.js';
import { calls, campaigns, dnc, leads } from '../store.js';

/** Dispositions that close a lead out. Everything else earns another attempt. */
export const TERMINAL_DISPOSITIONS = new Set(['answered', 'voicemail_left', 'rejected']);

/**
 * Decides what happens to a lead after an attempt.
 *
 * Kept pure so the retry policy is testable without a database or a phone line.
 *
 * @param lead        needs `attempts` (the count *before* this one) and `timezone`
 * @param campaign    needs `maxAttempts` and `retryDelayMinutes`
 */
export function planNextAttempt(lead, campaign, disposition, window, at = new Date()) {
  if (TERMINAL_DISPOSITIONS.has(disposition)) {
    return { status: 'completed', nextAttemptAt: null };
  }

  const attemptsAfter = lead.attempts + 1;
  if (attemptsAfter >= campaign.maxAttempts) {
    return { status: 'exhausted', nextAttemptAt: null };
  }

  const earliest = new Date(at.getTime() + campaign.retryDelayMinutes * 60_000);
  // Never schedule a retry into a closed window; push it to the next opening.
  const scheduled = nextWindowOpening(earliest, lead.timezone, window);
  return { status: 'pending', nextAttemptAt: scheduled.toISOString() };
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

let timer = null;
let ticking = false;

export function startDialer() {
  if (timer) return;
  timer = setInterval(() => void tick(), config.dialerTickMs);
  timer.unref?.();
  log.info({ intervalMs: config.dialerTickMs }, 'dialer started');
}

export function stopDialer() {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function tick() {
  // A slow Plivo API call must not let the next tick double-dial a lead.
  if (ticking || !plivoReady) return;
  ticking = true;
  try {
    let budget = config.maxConcurrentCalls - calls.activeCount();
    if (budget <= 0) return;

    for (const campaign of campaigns.running()) {
      if (budget <= 0) break;
      budget -= await runCampaign(campaign, budget);
    }
  } catch (err) {
    log.error({ err }, 'dialer tick failed');
  } finally {
    ticking = false;
  }
}

async function runCampaign(campaign, globalBudget) {
  const slots = Math.min(campaign.concurrency - calls.activeCount(campaign.id), globalBudget);
  if (slots <= 0) return 0;

  const window = windowFor(campaign);
  // Over-fetch: many due leads will be outside their own local window.
  const candidates = leads.due(campaign.id, slots * 5);
  if (!candidates.length) {
    completeIfDrained(campaign);
    return 0;
  }

  const now = new Date();
  let placed = 0;

  for (const lead of candidates) {
    if (placed >= slots) break;

    if (dnc.has(lead.phone)) {
      leads.setStatus(lead.id, 'suppressed', 'on the opt-out list');
      continue;
    }

    if (!isWithinWindow(now, lead.timezone, window)) {
      // Park it until the window opens locally instead of rechecking every tick.
      leads.defer(lead.id, nextWindowOpening(now, lead.timezone, window).toISOString());
      continue;
    }

    if (!leads.claim(lead.id)) continue; // Another tick already took it.

    try {
      await dial(campaign, lead);
      placed++;
    } catch (err) {
      log.error({ err, leadId: lead.id }, 'could not place call');
      const plan = planNextAttempt(lead, campaign, 'failed', window);
      leads.recordAttempt(lead.id, 'failed', plan.nextAttemptAt, plan.status);
    }
  }

  return placed;
}

async function dial(campaign, lead) {
  // The record is created before origination because Plivo's answer webhook can
  // arrive within milliseconds and must always find something to attach to.
  const record = calls.create({
    campaignId: campaign.id,
    leadId: lead.id,
    direction: 'outbound',
    fromNumber: config.plivoNumberDisplay,
    toNumber: lead.phone,
  });

  try {
    const { requestUuid } = await placeCall({
      to: lead.phone,
      from: config.plivoNumber,
      callId: record.id,
      ringTimeout: config.ringTimeoutSeconds,
      detectMachine: campaign.hangupOnMachine,
    });
    calls.update(record.id, { requestUuid, status: 'ringing' });

    // The phone is now ringing, which buys several seconds of nothing. Use it
    // to open the xAI session and let the agent compose its opening line, so
    // the moment the person says hello the reply is already waiting rather
    // than only then being started. Answering finds this session ready and
    // does not build a second one.
    if (config.prewarmOnDial) prewarmSession(record.id, { record, lead });

    log.info({ callId: record.id, to: maskPhone(lead.phone), campaign: campaign.id }, 'dialling');
    events.emit('call:dialing', {
      callId: record.id,
      campaignId: campaign.id,
      to: lead.phone,
      name: lead.name,
    });
  } catch (err) {
    // No webhook is coming for a call Plivo never accepted, so close it here.
    calls.update(record.id, {
      status: 'failed',
      disposition: 'failed',
      endedAt: new Date().toISOString(),
      error: err.message,
    });
    throw err;
  }
}

/**
 * Called from the Plivo hangup webhook once a call reaches a final state.
 * This is where a lead is either closed out or requeued.
 */
export function onCallFinished(callId, disposition) {
  const record = calls.get(callId);
  if (!record?.leadId || !record.campaignId) return;

  const lead = leads.get(record.leadId);
  const campaign = campaigns.get(record.campaignId);
  if (!lead || !campaign) return;

  const plan = planNextAttempt(lead, campaign, disposition, windowFor(campaign));
  leads.recordAttempt(lead.id, disposition, plan.nextAttemptAt, plan.status);

  log.info(
    { leadId: lead.id, disposition, outcome: plan.status, retryAt: plan.nextAttemptAt },
    'lead outcome recorded',
  );
  events.emit('lead:updated', {
    leadId: lead.id,
    campaignId: campaign.id,
    disposition,
    status: plan.status,
  });

  completeIfDrained(campaign);
}

/** Marks a campaign complete once no lead can ever be dialled again. */
function completeIfDrained(campaign) {
  const stats = campaigns.stats(campaign.id);
  if (stats.total === 0) return;
  if (stats.pending + stats.dialing > 0) return;

  campaigns.update(campaign.id, { status: 'completed' });
  log.info({ campaignId: campaign.id, stats }, 'campaign complete');
  events.emit('campaign:completed', { campaignId: campaign.id, stats });
}

/** Housekeeping for records orphaned by a crash or a webhook that never arrived. */
export function reconcile() {
  const reaped = calls.reapStale(30);
  const released = leads.releaseStale(15);
  if (reaped || released) log.info({ reaped, released }, 'reconciled orphaned records');
}
