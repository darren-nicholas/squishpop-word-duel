require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

test('release ad stub grants no reward and schedules no simulated ad', async () => {
  global.__DEV__ = false;
  const ads = require('../rewardedAdService.ts');
  assert.equal(ads.ADS_AVAILABLE, false);
  assert.deepEqual(await ads.watchAdForReward('freePull'), { success: false });
  await ads.showInterstitial();
});
