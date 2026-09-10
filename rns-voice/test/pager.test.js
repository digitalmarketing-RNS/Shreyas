import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * What the pager says.
 *
 * The report answers one question — "am I seeing all the calls?" — and the
 * first version answered it only when there were too many to fit, which is the
 * case where the answer was already obvious. With a short list it showed
 * nothing at all, and twelve rows look the same whether that is twelve calls
 * or the first twelve of two hundred.
 *
 * This runs the real function out of the dashboard against a stub of the three
 * elements it touches, so the strings on screen are the strings asserted here.
 */
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const start = source.indexOf('function renderCallPager');
assert.ok(start > 0, 'renderCallPager must exist in the dashboard');
// The function is top-level, so its closing brace is the first one alone at
// the start of a line. Counting braces instead would trip over the template
// literals inside it.
const closing = source.indexOf('\n}', start);
assert.ok(closing > start, 'the end of renderCallPager must be findable');
const body = source.slice(start, closing + 2);

/** Builds the three elements the pager writes to, and a $ that serves them. */
function stubDom() {
  const make = () => ({
    textContent: '', hidden: false, disabled: false,
    classList: {
      _hidden: false,
      toggle(name, on) { if (name === 'hidden') this._hidden = on; },
      contains(name) { return name === 'hidden' ? this._hidden : false; },
    },
  });
  const nodes = { callPager: make(), callRange: make(), callPrev: make(), callNext: make() };
  return { nodes, $: (id) => nodes[id] };
}

function render(page) {
  const { nodes, $ } = stubDom();
  // eslint-disable-next-line no-new-func
  new Function('$', `${body}; return renderCallPager;`)($)(page);
  return {
    hidden: nodes.callPager.classList.contains('hidden'),
    text: nodes.callRange.textContent,
    prevHidden: nodes.callPrev.hidden,
    nextHidden: nodes.callNext.hidden,
    prevDisabled: nodes.callPrev.disabled,
    nextDisabled: nodes.callNext.disabled,
  };
}

describe('the pager tells you how many calls there are', () => {
  it('says so even when they all fit on one page', () => {
    const r = render({ total: 12, limit: 50, offset: 0 });
    assert.equal(r.hidden, false, 'a short list still needs its count shown');
    assert.equal(r.text, '12 calls, all shown');
    assert.equal(r.prevHidden, true, 'no buttons when there is nowhere to page');
    assert.equal(r.nextHidden, true);
  });

  it('counts one call in the singular', () => {
    assert.equal(render({ total: 1, limit: 50, offset: 0 }).text, '1 call, all shown');
  });

  it('shows the range and both buttons across several pages', () => {
    const first = render({ total: 137, limit: 50, offset: 0 });
    assert.equal(first.text, 'Showing 1–50 of 137 calls');
    assert.equal(first.prevHidden, false);
    assert.equal(first.prevDisabled, true, 'nothing before the first page');
    assert.equal(first.nextDisabled, false);

    const middle = render({ total: 137, limit: 50, offset: 50 });
    assert.equal(middle.text, 'Showing 51–100 of 137 calls');
    assert.equal(middle.prevDisabled, false);
    assert.equal(middle.nextDisabled, false);

    const last = render({ total: 137, limit: 50, offset: 100 });
    assert.equal(last.text, 'Showing 101–137 of 137 calls', 'the short last page ends at the total');
    assert.equal(last.nextDisabled, true, 'nothing after the last page');
  });

  it('disappears only when nothing was recorded at all', () => {
    // The empty table already says there are no calls.
    assert.equal(render({ total: 0, limit: 50, offset: 0 }).hidden, true);
  });
});
