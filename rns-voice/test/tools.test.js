import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { buildSessionUpdate } from '../src/xai/session.js';
import { config } from '../src/config.js';

describe('leaving room for the agent’s own tools', () => {
  it('does not offer save_call_details by default', () => {
    // It competes with the agent's connectors. Measured against the live
    // agent: asked to book an appointment with this tool offered, it called
    // this tool; with it withheld, it called search_connected_tools and then
    // call_connected_tool and created the calendar event.
    assert.equal(config.agentDetailsTool, false);
  });

  it('never answers a tool it does not own', () => {
    // Replying "no tool named that is available" to search_connected_tools
    // ends the connector chain at its first step — the agent never reaches
    // call_connected_tool and books nothing, while sounding like it did.
    const bridge = readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8');
    const handler = bridge.slice(
      bridge.indexOf("session.on('function_call'"),
      bridge.indexOf("session.on('error'", bridge.indexOf("session.on('function_call'")),
    );
    assert.ok(handler.length > 0, 'the function_call handler must be found');
    assert.ok(
      !/No tool named/.test(handler),
      'the bridge must not reject tools belonging to the agent',
    );
    // The tools it does own are still answered, or the agent stalls mid-call.
    for (const owned of ['save_call_details', 'end_call', 'transfer_to_human']) {
      assert.ok(handler.includes(owned), `${owned} must still be handled`);
    }
  });

  it('releases the phone leg on the agent\'s own end_call', () => {
    // The agent ends calls with its own end_call, not one of ours, and xAI
    // then takes its time closing the socket — measured on a live booking, the
    // tool fired at 31.4s and the socket closed at 38.8s. Waiting for the
    // close leaves seven seconds of open line after the goodbye, which is what
    // "the call doesn't cut" is. The hangup runs on the tool call itself.
    const bridge = readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8');
    const branch = bridge.slice(bridge.indexOf("if (name === 'end_call')"), bridge.indexOf("if (name === 'transfer_to_human')"));
    assert.ok(branch.includes('this.requestHangup('), 'end_call must release the phone leg');
    // A result is owed only for a tool we offered. Answering the agent's own
    // is replying on xAI's behalf, which is what breaks its connectors.
    assert.match(branch, /config\.agentCallControl\)\s*session\.submitFunctionResult/,
      'the result must be conditional on us having offered the tool');
  });

  it('still offers the tools that do work only this server can do', () => {
    // end_call drains the audio Plivo has buffered before releasing the line,
    // which the agent cannot do for itself.
    const { session } = buildSessionUpdate({ profile: 'telephony', callControl: true });
    assert.deepEqual((session.tools ?? []).map((t) => t.name), ['end_call']);
  });
});
