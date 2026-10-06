require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { isWordSolved, lettersForHint, canTakeTurn, HINT_COSTS } = require('../gameplay.ts');
const { validateWord, normalizeWord } = require('../wordValidation.ts');

test('a revealed last letter completes repeated letters and punctuation', () => {
  const guessed = ['I', 'C', 'E', 'R', 'A'];
  const hint = lettersForHint('letter', 'ICE-CREAM', guessed, () => 0);
  assert.deepEqual(hint, ['M']);
  assert.equal(isWordSolved('ICE-CREAM', [...guessed, ...hint]), true);
  assert.equal(isWordSolved('---', []), false);
});
test('hints cannot consume a purchase when no eligible letters remain', () => {
  assert.deepEqual(lettersForHint('firstLetter', 'CAT', ['C']), []);
  assert.deepEqual(lettersForHint('vowels', 'RHYTHM', []), []);
  assert.deepEqual(lettersForHint('letter', 'CAT', ['C', 'A', 'T']), []);
  assert.deepEqual(lettersForHint('vowels', 'BANANA', []), ['A']);
  assert.equal(HINT_COSTS.firstLetter, 15);
});
test('each player extra life independently determines lockout', () => {
  const misses = ['B', 'D', 'E', 'F', 'G', 'H'];
  assert.equal(canTakeTurn('CAT', misses, 0), false);
  assert.equal(canTakeTurn('CAT', misses, 1), true);
  assert.equal(canTakeTurn('CAT', [...misses, 'I'], 1), false);
});
test('word entry and solve use the same normalized spacing', () => {
  assert.equal(normalizeWord('  ice   cream  '), 'ICE CREAM');
  assert.equal(validateWord(' ice cream ').valid, true);
});
test('validation counts actual letters rather than padding', () => {
  for (const input of ['', 'A--', "A''", 'A A', '123', 'BCDF', 'A'.repeat(26)]) {
    assert.equal(validateWord(input).valid, false, input);
  }
});
test('profanity with separators is rejected without blocking substring matches', () => {
  for (const input of ['FUCK', 'F U C K', "F'U-C K", 'BAD SHIT']) assert.equal(validateWord(input).valid, false);
  assert.equal(validateWord('CLASSROOM').valid, true);
});
test('unknown names retain the explicit local-validation warning', () => {
  const result = validateWord('QWERTYUIOP');
  assert.equal(result.valid, true);
  assert.equal(result.warning, true);
});
