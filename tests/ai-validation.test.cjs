const { mocks } = require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const keys = { ANTHROPIC_API_KEY: '' };
mocks.set('./apiKeys', keys);
const { aiValidate } = require('../aiValidate.ts');
test('missing playtest key falls back without a network request', async () => {
  const original = global.fetch;
  global.fetch = () => { throw new Error('Unexpected request'); };
  try { assert.equal((await aiValidate('word')).source, 'fallback'); }
  finally { global.fetch = original; }
});
test('zAIa sends the spelling request and returns the correction', async () => {
  keys.ANTHROPIC_API_KEY = 'test-only-placeholder';
  const original = global.fetch;
  global.fetch = async (_url, request) => {
    assert.equal(JSON.parse(request.body).messages[0].content.includes('MINECRAFTT'), true);
    assert.equal(request.headers['x-api-key'], 'test-only-placeholder');
    return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ valid: false, message: 'I think you meant Minecraft!', suggestion: 'Minecraft' }) }] }) };
  };
  try { assert.deepEqual(await aiValidate('MINECRAFTT'), { valid: false, message: 'I think you meant Minecraft!', suggestion: 'Minecraft', source: 'llm' }); }
  finally { global.fetch = original; keys.ANTHROPIC_API_KEY = ''; }
});
test('unavailable service keeps private playtesting playable', async () => {
  keys.ANTHROPIC_API_KEY = 'test-only-placeholder';
  const original = global.fetch;
  global.fetch = async () => { throw new Error('Unavailable'); };
  try { assert.equal((await aiValidate('word')).source, 'fallback'); }
  finally { global.fetch = original; keys.ANTHROPIC_API_KEY = ''; }
});
