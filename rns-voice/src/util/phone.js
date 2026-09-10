/**
 * E.164 handling for Indian and international numbers.
 *
 * Deliberately strict rather than clever: a number that cannot be normalised
 * with confidence is reported back to the user instead of being guessed at,
 * because a wrong guess means calling a stranger.
 */

export class PhoneError extends Error {}

/**
 * @param {string} raw          number as it appeared in the uploaded list
 * @param {string} [defaultCode] country calling code without '+', e.g. '91'
 * @returns {string} E.164 with a leading '+'
 */
export function toE164(raw, defaultCode) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) throw new PhoneError('empty phone number');

  let digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;

  if (!digits.startsWith('+')) {
    const bare = digits.replace(/^0+/, '');

    // A 12-digit Indian mobile pasted without '+' (919876543210) already
    // carries its country code; prefixing another would produce +9191...
    if (defaultCode && bare.startsWith(defaultCode) && bare.length > 10) {
      digits = `+${bare}`;
    } else if (defaultCode) {
      digits = `+${defaultCode}${bare}`;
    } else {
      throw new PhoneError(`"${raw}" has no country code and the campaign sets no default`);
    }
  }

  const body = digits.slice(1);
  if (!/^\d+$/.test(body)) throw new PhoneError(`"${raw}" contains characters that are not digits`);
  if (body.length < 8 || body.length > 15) {
    throw new PhoneError(`"${raw}" became ${digits}, which is not a valid length for a phone number`);
  }

  // Indian mobiles are 10 digits starting 6-9. Anything else under +91 is a
  // landline or a typo, and cold-call lists are overwhelmingly mobiles.
  if (body.startsWith('91') && body.length === 12 && !/^[6-9]/.test(body.slice(2))) {
    throw new PhoneError(`"${raw}" is not a valid Indian mobile number`);
  }

  return `+${body}`;
}

export function isE164(value) {
  return /^\+[1-9]\d{7,14}$/.test(String(value ?? ''));
}

/** Plivo wants bare digits, no '+'. */
export function forPlivo(e164) {
  return String(e164 ?? '').replace(/[^\d]/g, '');
}

/** Restores the '+' on a number Plivo handed back. */
export function fromPlivo(digits) {
  const clean = String(digits ?? '').replace(/[^\d]/g, '');
  return clean ? `+${clean}` : '';
}

/** Masks subscriber digits for logs: +919876543210 -> +9198***3210 */
export function maskPhone(e164) {
  const value = String(e164 ?? '');
  return value.length < 8 ? '***' : `${value.slice(0, 5)}***${value.slice(-4)}`;
}
