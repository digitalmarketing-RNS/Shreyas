import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readAnswer, tileInterest } from '../src/report/interest.js';

/**
 * The tile-requirement column.
 *
 * It reports what the caller said, from the transcript, and shows the sentence
 * it read. So the bar is not "usually right" — it is that a Yes or a No can be
 * checked against the transcript and found there, and that anything it cannot
 * read comes back blank rather than guessed.
 */

/** Builds a transcript with the agent's real opening and qualifying question. */
function call(...callerAndAgentTurns) {
  return [
    { role: 'agent', text: 'Hello, this is Shreya calling from Naveen Tile.' },
    { role: 'caller', text: 'Hello?' },
    { role: 'agent', text: 'Do you have any tile requirements for your project?' },
    ...callerAndAgentTurns,
  ];
}
const answerTo = (reply) => tileInterest(call({ role: 'caller', text: reply }));

describe('reading a yes or a no from one sentence', () => {
  for (const text of [
    'Yes', 'yes.', 'Yeah, we do', 'Yep', 'Sure', 'Of course', 'Absolutely',
    'Yes please, we are building a house', 'I do', 'We do, for the bathroom',
  ]) {
    it(`reads "${text}" as yes`, () => assert.equal(readAnswer(text), 'yes'));
  }

  for (const text of [
    'No', 'no.', 'Nope', 'Not interested', 'No need', 'No thanks',
    'Not right now', 'Not at the moment', 'No, we finished that last month',
  ]) {
    it(`reads "${text}" as no`, () => assert.equal(readAnswer(text), 'no'));
  }

  it('reads a soft answer as yes, because it is not a refusal', () => {
    // The exact reply a real caller gave; the agent went on to book them.
    assert.equal(readAnswer('I might have.'), 'yes');
    assert.equal(readAnswer('Maybe, we are still planning'), 'yes');
    assert.equal(readAnswer('I am looking for floor tiles'), 'yes');
  });

  it('says nothing when the sentence answers nothing', () => {
    for (const text of ['Hello?', 'Who is this?', 'Can you hear me', 'One second', '', null]) {
      assert.equal(readAnswer(text), null, `"${text}" must not be read as an answer`);
    }
  });
});

describe('a negated sentence is a no, not a yes', () => {
  // Each of these contains a word from the leaning-yes list, and every one of
  // them is a refusal. Reading the word alone would get all of them wrong.
  for (const text of [
    'I am not looking for tiles',
    "I don't need any",
    'We have no requirement',
    'No requirements at the moment',
    "I don't want tiles",
    'Never needed any',
  ]) {
    it(`reads "${text}" as no`, () => assert.equal(readAnswer(text), 'no'));
  }
});

describe('when a caller says both, the first one is the answer', () => {
  it('"No, but yes to a callback" is a no', () => {
    assert.equal(readAnswer('No, but yes if you can call back next year'), 'no');
  });
  it('"Yes, no problem" is a yes', () => {
    assert.equal(readAnswer('Yes, no problem at all'), 'yes');
  });
});

describe('the languages this agent actually takes calls in', () => {
  const cases = [
    ['Kannada', 'ಹೌದು', 'yes'], ['Kannada', 'haudu', 'yes'], ['Kannada', 'ಇಲ್ಲ', 'no'],
    ['Kannada', 'illa', 'no'], ['Kannada', 'ಬೇಡ', 'no'],
    ['Hindi', 'हाँ', 'yes'], ['Hindi', 'haan', 'yes'], ['Hindi', 'बिल्कुल', 'yes'],
    ['Hindi', 'नहीं', 'no'], ['Hindi', 'nahi', 'no'],
    ['Telugu', 'అవును', 'yes'], ['Telugu', 'avunu', 'yes'], ['Telugu', 'లేదు', 'no'],
    ['Tamil', 'ஆமாம்', 'yes'], ['Tamil', 'இல்லை', 'no'],
    ['Marathi', 'होय', 'yes'], ['Marathi', 'नाही', 'no'],
  ];
  for (const [language, text, expected] of cases) {
    it(`${language}: "${text}" is ${expected}`, () => assert.equal(readAnswer(text), expected));
  }
});

describe('reading the answer out of a whole call', () => {
  it('answers from the turn after the question, not the opening hello', () => {
    // "Yes, hello?" before the question must not become the answer.
    const transcript = [
      { role: 'agent', text: 'Hello, this is Shreya calling from Naveen Tile.' },
      { role: 'caller', text: 'Yes, hello?' },
      { role: 'agent', text: 'Do you have any tile requirements for your project?' },
      { role: 'caller', text: 'No, not right now.' },
    ];
    const result = tileInterest(transcript);
    assert.equal(result.answer, 'no');
    assert.equal(result.quote, 'No, not right now.');
  });

  it('ignores a later yes about the appointment time', () => {
    const result = tileInterest(call(
      { role: 'caller', text: 'No, we are not building anything.' },
      { role: 'agent', text: 'Could I call you next year?' },
      { role: 'caller', text: 'Yes, that is fine.' },
    ));
    assert.equal(result.answer, 'no', 'the first answer given is the answer to the question');
  });

  it('carries the caller sentence it read, so the report can show its evidence', () => {
    const result = tileInterest(call({ role: 'caller', text: 'I might have.' }));
    assert.equal(result.answer, 'yes');
    assert.equal(result.quote, 'I might have.');
    assert.equal(result.index, 3);
  });

  it('skips over caller turns that say nothing either way', () => {
    const result = tileInterest(call(
      { role: 'caller', text: 'Sorry, one second.' },
      { role: 'caller', text: 'Hmm.' },
      { role: 'caller', text: 'Yes we do, for the kitchen.' },
    ));
    assert.equal(result.answer, 'yes');
    assert.equal(result.quote, 'Yes we do, for the kitchen.');
  });

  it('finds the answer when the question was asked in another language', () => {
    // Nothing matches the English question text, so it falls back to the
    // agent's first question — which is the same turn.
    const result = tileInterest([
      { role: 'agent', text: 'ನಮಸ್ಕಾರ, ನಾನು ನವೀನ್ ಟೈಲ್‌ನಿಂದ ಶ್ರೇಯಾ.' },
      { role: 'agent', text: 'ನಿಮಗೆ ಟೈಲ್ಸ್ ಬೇಕಾ?' },
      { role: 'caller', text: 'ಹೌದು' },
    ]);
    assert.equal(result.answer, 'yes');
  });

  it('reports nothing rather than guessing', () => {
    assert.equal(tileInterest([]).answer, null);
    assert.equal(tileInterest(null).answer, null);
    // Nobody ever answered.
    assert.equal(tileInterest(call({ role: 'caller', text: 'Hello? Hello?' })).answer, null);
    // The agent never got to ask.
    assert.equal(tileInterest([
      { role: 'agent', text: 'Hello, this is Shreya calling from Naveen Tile.' },
      { role: 'caller', text: 'Yes?' },
    ]).answer, null);
  });

  it('accepts the roles the transcript actually stores', () => {
    const withUser = [
      { role: 'assistant', text: 'Do you have any tile requirements?' },
      { role: 'user', text: 'Yes.' },
    ];
    assert.equal(tileInterest(withUser).answer, 'yes');
  });
});
