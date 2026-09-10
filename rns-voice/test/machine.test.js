import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { campaigns } from '../src/store.js';

describe('answering-machine detection', () => {
  it('is off unless a campaign explicitly asks for it', () => {
    // The bug this fixes: campaign calls connected and were cut six seconds
    // later with "Machine Detected", HangupSource "API Request" — Plivo hung
    // up because this asked it to. Test calls survived only because that path
    // passed false. Same agent, same dialler, opposite outcome.
    assert.equal(campaigns.create({ name: 'default' }).hangupOnMachine, false);
    assert.equal(campaigns.create({ name: 'off', hangupOnMachine: false }).hangupOnMachine, false);
    assert.equal(campaigns.create({ name: 'on', hangupOnMachine: true }).hangupOnMachine, true);
  });

  it('asks Plivo for detection only when it is on', () => {
    const client = readFileSync(new URL('../src/plivo/client.js', import.meta.url), 'utf8');
    const guard = client.slice(client.indexOf('if (detectMachine)'), client.indexOf('const result ='));
    assert.match(guard, /machine_detection/, 'detection belongs inside the guard');
    // Outside the guard, nothing may set it.
    const before = client.slice(client.indexOf('const body = {'), client.indexOf('if (detectMachine)'));
    assert.ok(!before.includes('machine_detection'), 'detection must never be unconditional');
  });

  it('leaves the test-call and campaign paths agreeing on the default', () => {
    // They disagreed, and that disagreement was the whole bug.
    const routes = readFileSync(new URL('../src/api/routes.js', import.meta.url), 'utf8');
    const dialer = readFileSync(new URL('../src/campaign/dialer.js', import.meta.url), 'utf8');
    assert.match(routes, /detectMachine: campaign\?\.hangupOnMachine \?\? false/);
    assert.match(dialer, /detectMachine: campaign\.hangupOnMachine/);
    // With the store defaulting to false, both now resolve to false.
    assert.equal(campaigns.create({ name: 'agree' }).hangupOnMachine, false);
  });
});
