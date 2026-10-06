require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { aiValidate } = require('../aiValidate.ts');

test('local validation fallback sends no child input or credentials over the network', async () => {
  const fetch = global.fetch;
  global.fetch = () => { throw new Error('Unexpected network call'); };
  try {
    const result = await aiValidate('private input');
    assert.equal(result.source, 'fallback');
  } finally { global.fetch = fetch; }
});
test('release ad stub grants no reward and schedules no simulated ad', async () => {
  global.__DEV__ = false;
  const ads = require('../rewardedAdService.ts');
  assert.equal(ads.ADS_AVAILABLE, false);
  assert.deepEqual(await ads.watchAdForReward('freePull'), { success: false });
  await ads.showInterstitial();
});
