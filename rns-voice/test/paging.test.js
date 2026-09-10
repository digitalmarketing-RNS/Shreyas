import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'paging-'));
const { calls } = await import('../src/store.js');

/**
 * Paging the call report.
 *
 * The report showed the newest sixty calls and nothing else — a campaign of
 * two hundred left most of them unreachable, with nothing on screen to say so.
 * The total is the part that makes a page navigable: fifty rows and no total
 * cannot tell you whether fifty is all there is.
 */
const seed = (n, campaignId = null) => {
  for (let i = 0; i < n; i += 1) {
    const rec = calls.create({
      campaignId, leadId: null, direction: 'outbound',
      fromNumber: '+918031705594', toNumber: `+9190000${String(i).padStart(5, '0')}`,
    });
    // startedAt drives the ordering, so make it deterministic and increasing.
    calls.update(rec.id, { startedAt: new Date(Date.UTC(2026, 8, 1, 0, 0, i)).toISOString() });
  }
};

describe('a page of calls', () => {
  seed(120);

  it('reports the total behind the page, not the page size', () => {
    const page = calls.list({ limit: 50, offset: 0 });
    assert.equal(page.items.length, 50);
    assert.equal(page.total, 120, 'the total must count every matching call');
  });

  it('walks forward without repeating or skipping a call', () => {
    const seen = new Set();
    for (let offset = 0; offset < 120; offset += 50) {
      for (const c of calls.list({ limit: 50, offset }).items) {
        assert.ok(!seen.has(c.id), `call ${c.id} appeared on two pages`);
        seen.add(c.id);
      }
    }
    assert.equal(seen.size, 120, 'every call must appear on exactly one page');
  });

  it('gives the newest calls first', () => {
    const first = calls.list({ limit: 5, offset: 0 }).items;
    const starts = first.map((c) => c.startedAt);
    assert.deepEqual(starts, [...starts].sort().reverse(), 'newest first');
  });

  it('returns a short last page rather than padding it', () => {
    const last = calls.list({ limit: 50, offset: 100 });
    assert.equal(last.items.length, 20);
    assert.equal(last.total, 120);
  });

  it('returns an empty page past the end, not the last page again', () => {
    // Showing different calls than were asked for is worse than showing none.
    const beyond = calls.list({ limit: 50, offset: 500 });
    assert.equal(beyond.items.length, 0);
    assert.equal(beyond.total, 120);
  });

  it('survives nonsense paging values', () => {
    for (const bad of [{ offset: -10 }, { offset: NaN }, { limit: 0 }, { limit: -5 }, { limit: NaN }]) {
      const page = calls.list({ limit: 50, offset: 0, ...bad });
      assert.ok(Array.isArray(page.items), `${JSON.stringify(bad)} must still return a page`);
      assert.equal(page.total, 120);
      assert.ok(page.items.length >= 0 && page.items.length <= 50);
    }
  });

  it('counts only the campaign being filtered', () => {
    seed(7, 'camp_a');
    const scoped = calls.list({ campaignId: 'camp_a', limit: 50, offset: 0 });
    assert.equal(scoped.total, 7, 'the total follows the filter, not the whole history');
    assert.equal(scoped.items.length, 7);
    assert.ok(scoped.items.every((c) => c.campaignId === 'camp_a'));
  });
});
