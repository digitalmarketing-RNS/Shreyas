import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { importNumberList } from '../src/campaign/import.js';
import { campaigns, leads } from '../src/store.js';

function freshCampaign() {
  return campaigns.create({ name: `t-${Math.random()}`, defaultCountryCode: '91' });
}

describe('importNumberList', () => {
  it('accepts bare 10-digit numbers and adds the country code', () => {
    const c = freshCampaign();
    const result = importNumberList(c, '9876543210\n9123456789');
    assert.equal(result.imported, 2);
    const stored = leads.list(c.id).map((l) => l.phone);
    assert.deepEqual(stored.sort(), ['+919123456789', '+919876543210']);
  });

  it('splits a column pasted out of a spreadsheet', () => {
    // Copying a column of cells yields commas, not newlines. Rejecting that
    // would be pedantry when the intent is unambiguous.
    const c = freshCampaign();
    assert.equal(importNumberList(c, '9876543210, 9123456789; 9988776655').imported, 3);
  });

  it('counts a repeated number once', () => {
    const c = freshCampaign();
    const result = importNumberList(c, '9876543210\n9876543210');
    assert.equal(result.imported, 1);
    assert.equal(result.duplicates, 1);
  });

  it('reports an unreadable line instead of dialling a guess', () => {
    const c = freshCampaign();
    const result = importNumberList(c, '9876543210\nrubbish');
    assert.equal(result.imported, 1);
    assert.equal(result.rejected.length, 1);
    assert.equal(result.rejected[0].value, 'rubbish');
  });

  it('ignores blank lines and comments', () => {
    const c = freshCampaign();
    const result = importNumberList(c, '\n# my list\n9876543210\n\n');
    assert.equal(result.imported, 1);
    assert.equal(result.rejected.length, 0);
  });

  it('takes an array as readily as a block of text', () => {
    const c = freshCampaign();
    assert.equal(importNumberList(c, ['9876543210', '9123456789']).imported, 2);
  });
});
