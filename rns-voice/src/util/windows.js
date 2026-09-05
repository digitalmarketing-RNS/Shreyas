/**
 * Calling-window enforcement.
 *
 * Windows are evaluated in the *lead's* local time, not the server's, because
 * that is what telemarketing rules are written against — and a server on
 * Hostinger may well be in a different country from the people being called.
 * Timezone maths goes through Intl so DST is handled by ICU rather than by us.
 */

export const DEFAULT_WINDOW = {
  startMinute: 10 * 60,
  endMinute: 19 * 60,
  days: [1, 2, 3, 4, 5, 6],
};

export function parseHHMM(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) throw new Error(`Invalid time "${value}", expected HH:MM`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid time "${value}"`);
  return hours * 60 + minutes;
}

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock minute-of-day and weekday for an instant in a given IANA zone. */
export function localParts(at, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  let hour = 0;
  let minute = 0;
  let weekday = 0;
  for (const part of formatter.formatToParts(at)) {
    if (part.type === 'hour') hour = Number(part.value) % 24;
    else if (part.type === 'minute') minute = Number(part.value);
    else if (part.type === 'weekday') weekday = WEEKDAY_INDEX[part.value] ?? 0;
  }
  return { minuteOfDay: hour * 60 + minute, weekday };
}

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function isWithinWindow(at, timeZone, window) {
  const { minuteOfDay, weekday } = localParts(at, timeZone);
  if (!window.days.includes(weekday)) return false;
  if (window.startMinute <= window.endMinute) {
    return minuteOfDay >= window.startMinute && minuteOfDay < window.endMinute;
  }
  // An overnight window (20:00–02:00) wraps past midnight.
  return minuteOfDay >= window.startMinute || minuteOfDay < window.endMinute;
}

/**
 * The next instant at which the window is open in `timeZone`, or `at` itself if
 * it already is. Steps forward in 15-minute increments for up to 8 days, which
 * is cheap and cannot skip over a window of any realistic width.
 */
export function nextWindowOpening(at, timeZone, window) {
  if (isWithinWindow(at, timeZone, window)) return at;
  const step = 15 * 60_000;
  const limit = 8 * 24 * 60 * 60_000;
  for (let offset = step; offset <= limit; offset += step) {
    const candidate = new Date(at.getTime() + offset);
    if (isWithinWindow(candidate, timeZone, window)) return candidate;
  }
  // A window configured with no valid days would loop forever; park it a day out.
  return new Date(at.getTime() + 86_400_000);
}

/** Builds a window from a campaign record, falling back if it is misconfigured. */
export function windowFor(campaign) {
  try {
    return {
      startMinute: parseHHMM(campaign.windowStart),
      endMinute: parseHHMM(campaign.windowEnd),
      days: campaign.windowDays?.length ? campaign.windowDays : DEFAULT_WINDOW.days,
    };
  } catch {
    return DEFAULT_WINDOW;
  }
}
