import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { PhoneError, forPlivo, isE164, maskPhone, toE164 } from '../src/util/phone.js';

describe('toE164', () => {
  it('keeps a number that is already international', () => {
    assert.equal(toE164('+91 98765 43210'), '+919876543210');
  });

  it('adds the campaign country code to a 10-digit Indian mobile', () => {
    assert.equal(toE164('9876543210', '91'), '+919876543210');
  });

  it('does not double-prefix a 12-digit number that already carries 91', () => {
    // The common CRM export shape. Prefixing again would dial +9191...
    assert.equal(toE164('919876543210', '91'), '+919876543210');
  });

  it('strips a national trunk zero before prefixing', () => {
    assert.equal(toE164('09876543210', '91'), '+919876543210');
  });

  it('converts a 00 international prefix', () => {
    assert.equal(toE164('0044 20 7946 0958'), '+442079460958');
  });

  it('handles the punctuation people actually paste', () => {
    assert.equal(toE164('(987) 654-3210', '91'), '+919876543210');
  });

  it('rejects an Indian number that is not a mobile', () => {
    // Indian mobiles start 6-9; anything else is a landline or a typo.
    assert.throws(() => toE164('1234567890', '91'), PhoneError);
  });

  it('refuses to guess with no country code available', () => {
    assert.throws(() => toE164('9876543210'), PhoneError);
  });

  it('rejects a number too short to dial', () => {
    assert.throws(() => toE164('12', '91'), PhoneError);
  });

  it('rejects an empty value', () => {
    assert.throws(() => toE164('   ', '91'), PhoneError);
  });
});

describe('wire formats', () => {
  it('strips the plus for Plivo', () => {
    assert.equal(forPlivo('+919876543210'), '919876543210');
  });
  it('validates E.164', () => {
    assert.ok(isE164('+919876543210'));
    assert.ok(!isE164('9876543210'));
  });
  it('masks subscriber digits for logs', () => {
    assert.equal(maskPhone('+919876543210'), '+9198***3210');
  });
});
