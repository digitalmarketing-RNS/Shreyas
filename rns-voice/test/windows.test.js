import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  isWithinWindow, localParts, nextWindowOpening, parseHHMM, windowFor,
} from '../src/util/windows.js';

const IST = 'Asia/Kolkata';
const BUSINESS = { startMinute: 10 * 60, endMinute: 19 * 60, days: [1, 2, 3, 4, 5, 6] };

describe('parseHHMM', () => {
  it('converts to minutes past midnight', () => {
    assert.equal(parseHHMM('10:00'), 600);
    assert.equal(parseHHMM('19:30'), 1170);
  });
  it('rejects nonsense', () => {
    assert.throws(() => parseHHMM('25:00'));
    assert.throws(() => parseHHMM('10am'));
  });
});

describe('localParts', () => {
  it('reads wall-clock time in the lead timezone, not the server one', () => {
    // 06:30 UTC on Thursday 12 June 2025 is 12:00 in Kolkata (UTC+5:30).
    const parts = localParts(new Date('2025-06-12T06:30:00Z'), IST);
    assert.equal(parts.minuteOfDay, 12 * 60);
    assert.equal(parts.weekday, 4);
  });
});

describe('isWithinWindow', () => {
  it('is open at midday in India', () => {
    assert.ok(isWithinWindow(new Date('2025-06-12T06:30:00Z'), IST, BUSINESS));
  });

  it('is shut at 3am local even though the server may be mid-afternoon', () => {
    // 21:30 UTC is 03:00 next day in Kolkata.
    assert.ok(!isWithinWindow(new Date('2025-06-12T21:30:00Z'), IST, BUSINESS));
  });

  it('respects the day list', () => {
    // Sunday 15 June 2025, midday IST.
    assert.ok(!isWithinWindow(new Date('2025-06-15T06:30:00Z'), IST, BUSINESS));
  });

  it('handles a window that wraps past midnight', () => {
    const overnight = { startMinute: 20 * 60, endMinute: 2 * 60, days: [0, 1, 2, 3, 4, 5, 6] };
    // 22:00 IST is inside; 12:00 IST is not.
    assert.ok(isWithinWindow(new Date('2025-06-12T16:30:00Z'), IST, overnight));
    assert.ok(!isWithinWindow(new Date('2025-06-12T06:30:00Z'), IST, overnight));
  });
});

describe('nextWindowOpening', () => {
  it('returns the same instant when already open', () => {
    const at = new Date('2025-06-12T06:30:00Z');
    assert.equal(nextWindowOpening(at, IST, BUSINESS).getTime(), at.getTime());
  });

  it('rolls a Sunday attempt forward to Monday', () => {
    const sunday = new Date('2025-06-15T06:30:00Z');
    const next = nextWindowOpening(sunday, IST, BUSINESS);
    assert.ok(isWithinWindow(next, IST, BUSINESS));
    assert.ok(next.getTime() - sunday.getTime() < 2 * 86_400_000);
  });

  it('never returns an instant outside the window, in any zone', () => {
    for (const zone of ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Australia/Sydney']) {
      const next = nextWindowOpening(new Date('2025-06-15T02:00:00Z'), zone, BUSINESS);
      assert.ok(isWithinWindow(next, zone, BUSINESS), `${zone} returned a closed instant`);
    }
  });
});

describe('windowFor', () => {
  it('falls back to a safe default when a campaign is misconfigured', () => {
    const window = windowFor({ windowStart: 'nonsense', windowEnd: '19:00', windowDays: [1] });
    assert.equal(window.startMinute, 10 * 60);
  });
});
