import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { readRejection } from '../src/xai/realtime.js';

/**
 * A booking you cannot see is a booking you cannot trust.
 *
 * The agent books through its own calendar connector, which xAI runs
 * server-side. It tells the caller "your appointment is confirmed" whether the
 * connector created the event or not, and sends this service no result either
 * way — so "is it actually in the calendar?" had no answer anywhere in the
 * dashboard, the logs, or the call record. The connector calls were logged at
 * debug and discarded.
 *
 * Recording the attempt cannot make it succeed. It does mean a booking that
 * never arrives can be told apart from one the agent never attempted.
 */
const source = readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8');
/** Comments stripped, so prose about the behaviour does not read as it. */
const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('what the agent booked is recorded', () => {
  it('writes connector calls onto the call record', () => {
    assert.match(code, /call_connected_tool/, 'the bridge must notice connector calls');
    assert.match(code, /connectorCalls/, 'connector calls must be saved on the call record');
  });

  it('still never answers a connector call', () => {
    // The recording branch must return without submitting a result: replying
    // to search_connected_tools is what used to end the chain at step one.
    const branch = code.slice(code.indexOf("name === 'call_connected_tool'"));
    const untilReturn = branch.slice(0, branch.indexOf('return;'));
    assert.ok(
      !untilReturn.includes('submitFunctionResult'),
      'the bridge must not answer a tool that belongs to the agent',
    );
  });
});

describe('a refused xAI connection says why', () => {
  /** Stands in for the HTTP response xAI sends when it refuses the upgrade. */
  function rejection(statusCode, body) {
    const res = new EventEmitter();
    res.statusCode = statusCode;
    queueMicrotask(() => {
      if (body) res.emit('data', body);
      res.emit('end');
    });
    return res;
  }

  it('reports the status and the reason xAI gave', async () => {
    const err = await readRejection(rejection(403, JSON.stringify({
      code: 'permission-denied',
      error: 'Your team has either used all available credits or reached its monthly spending limit.',
    })));
    assert.match(err.message, /403/);
    assert.match(err.message, /credits/);
    assert.equal(err.status, 403);
  });

  it('still reports a rejection that is not JSON', async () => {
    const err = await readRejection(rejection(502, 'Bad Gateway'));
    assert.match(err.message, /502/);
    assert.match(err.message, /Bad Gateway/);
  });

  it('reports a rejection with no body at all', async () => {
    const err = await readRejection(rejection(401, ''));
    assert.match(err.message, /401/);
    assert.equal(err.status, 401);
  });

  it('does not buffer an unbounded body', async () => {
    const err = await readRejection(rejection(500, 'x'.repeat(100_000)));
    assert.ok(err.message.length < 4096, 'the reported reason must stay bounded');
  });
});
