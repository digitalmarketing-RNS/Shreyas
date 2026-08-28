import { parse } from 'csv-parse/sync';
import { log } from '../logger.js';
import { isValidTimeZone } from '../util/windows.js';
import { PhoneError, toE164 } from '../util/phone.js';
import { dnc, leads } from '../store.js';

/** Header aliases, so a list exported from any CRM imports without hand-editing. */
const PHONE_KEYS = ['phone', 'phone_number', 'phonenumber', 'number', 'mobile', 'mobile_number', 'contact_number', 'tel', 'telephone', 'to'];
const NAME_KEYS = ['name', 'full_name', 'fullname', 'contact', 'contact_name', 'first_name', 'customer_name'];
const TZ_KEYS = ['timezone', 'time_zone', 'tz'];

function pick(row, keys) {
  for (const key of keys) {
    const match = Object.keys(row).find((k) => k.trim().toLowerCase() === key);
    if (match && String(row[match] ?? '').trim()) return String(row[match]).trim();
  }
  return undefined;
}

/**
 * Imports a CSV lead list.
 *
 * Every row is validated before anything is stored: a number that cannot be
 * normalised is reported back rather than dialled on a guess, and numbers
 * already opted out are stored as suppressed so they show in reporting without
 * ever being called.
 */
export function importLeadsCsv(campaign, csv) {
  let rows;
  try {
    rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new Error(`Could not read that CSV: ${err.message}`);
  }

  const result = { imported: 0, duplicates: 0, suppressed: 0, rejected: [] };
  const seen = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for the header row, +1 for 1-based counting
    const rawPhone = pick(row, PHONE_KEYS);

    if (!rawPhone) {
      if (result.rejected.length < 50) {
        result.rejected.push({ row: rowNumber, value: '', reason: 'no phone column found' });
      }
      return;
    }

    let phone;
    try {
      phone = toE164(rawPhone, campaign.defaultCountryCode ?? undefined);
    } catch (err) {
      if (result.rejected.length < 50) {
        result.rejected.push({
          row: rowNumber,
          value: rawPhone,
          reason: err instanceof PhoneError ? err.message : 'invalid phone number',
        });
      }
      return;
    }

    // Duplicates inside one file never reach storage.
    if (seen.has(phone)) {
      result.duplicates++;
      return;
    }
    seen.add(phone);

    const rawTz = pick(row, TZ_KEYS);
    const timezone = rawTz && isValidTimeZone(rawTz) ? rawTz : campaign.defaultTimezone;

    // Anything unrecognised is kept as a merge field the agent can be given.
    const attributes = {};
    for (const [key, value] of Object.entries(row)) {
      const lower = key.trim().toLowerCase();
      if (PHONE_KEYS.includes(lower) || NAME_KEYS.includes(lower) || TZ_KEYS.includes(lower)) continue;
      if (String(value ?? '').trim()) attributes[key.trim()] = String(value).trim();
    }

    const created = leads.add(campaign.id, {
      phone,
      name: pick(row, NAME_KEYS) ?? null,
      timezone,
      attributes,
    });

    if (!created) result.duplicates++;
    else if (created.status === 'suppressed') result.suppressed++;
    else result.imported++;
  });

  log.info(
    { campaignId: campaign.id, imported: result.imported, rejected: result.rejected.length },
    'lead import finished',
  );
  return result;
}

/** Bulk-loads an opt-out list: one number per line, '#' for comments. */
export function importOptOutList(text, defaultCode, reason = 'bulk import') {
  const rejected = [];
  let added = 0;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    try {
      dnc.add(toE164(value, defaultCode), reason);
      added++;
    } catch {
      rejected.push(value);
    }
  }
  return { added, rejected };
}
