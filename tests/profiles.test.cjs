const { storage } = require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../profiles.ts');
const { SQUISHIES } = require('../squishies.ts');
const original = () => p.createProfile(' Player ', 'dad');

test('selling duplicates preserves the final copy even after repeated requests', () => {
  const squishy = SQUISHIES[0];
  let profile = p.awardSquishiesToProfile(original(), [squishy, squishy]);
  profile = p.sellOneDuplicate(profile, squishy.id);
  assert.equal(profile.collection.length, 1);
  assert.equal(profile.coins, 25 + p.coinValueFor(squishy));
  assert.equal(p.sellOneDuplicate(profile, squishy.id), profile);
});
test('invalid currency operations cannot mint coins or spend unavailable funds', () => {
  const profile = original();
  for (const n of [-10, NaN, Infinity, 0, 0.5]) {
    assert.equal(p.spendCoins(profile, n), profile);
    assert.equal(p.addCoins(profile, n), profile);
  }
  assert.equal(p.spendCoins(profile, 26), profile);
  assert.equal(p.spendCoins(profile, 25).coins, 0);
});
test('legacy profiles migrate without wiping collections or stats', () => {
  const profile = { ...original(), collection: [{ ...SQUISHIES[0], image: 999 }], matchesWon: 4 };
  delete profile.coins;
  delete profile.isVip;
  const loaded = p.decodeProfiles(JSON.stringify([profile]))[0];
  assert.equal(loaded.collection[0], SQUISHIES[0]);
  assert.equal(loaded.matchesWon, 4);
  assert.equal(loaded.coins, 25);
  assert.equal(loaded.isVip, false);
});
test('invalid storage fails explicitly instead of returning empty profiles', async () => {
  for (const raw of ['invalid', '{}', '[null]', JSON.stringify([{ ...original(), coins: -1 }]), JSON.stringify([{ ...original(), collection: ['missing-id'] }])]) {
    assert.throws(() => p.decodeProfiles(raw));
  }
  const profile = original();
  assert.throws(() => p.decodeProfiles(JSON.stringify([profile, profile])));
  storage.getItem = async () => '{';
  await assert.rejects(p.loadProfiles());
});
test('storage read failures preserve the error for the recovery screen', async () => {
  storage.getItem = async () => { throw new Error('unavailable'); };
  await assert.rejects(p.loadProfiles(), /unavailable/);
});
test('profile writes are ordered and save canonical IDs with solo progress', async () => {
  const writes = [];
  let release;
  storage.setItem = async (_key, raw) => {
    writes.push(raw);
    if (writes.length === 1) await new Promise((resolve) => { release = resolve; });
  };
  const first = { ...original(), collection: [SQUISHIES[0]], soloWins: 2 };
  const one = p.saveProfiles([first]);
  const two = p.saveProfiles([{ ...first, coins: 75, soloWins: 3 }]);
  await new Promise(setImmediate);
  assert.equal(writes.length, 1);
  release();
  await Promise.all([one, two]);
  const latest = p.decodeProfiles(writes[1])[0];
  assert.equal(latest.coins, 75);
  assert.equal(latest.soloWins, 3);
  assert.deepEqual(JSON.parse(writes[1])[0].collection, [SQUISHIES[0].id]);
});
test('a failed save is reported and does not poison later saves', async () => {
  storage.setItem = async () => { throw new Error('full'); };
  await assert.rejects(p.saveProfiles([original()]), /full/);
  storage.setItem = async () => {};
  await p.saveProfiles([original()]);
});
