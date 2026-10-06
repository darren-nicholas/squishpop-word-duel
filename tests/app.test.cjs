const { storage, mocks } = require('./load-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
global.__DEV__ = false;

class Value {
  constructor(value) { this.value = value; }
  setValue(value) { this.value = value; }
  interpolate() { return this; }
  stopAnimation() {}
}
const animation = () => ({ start() {}, stop() {} });
const identity = (v) => v;
mocks.set('react-native', {
  Animated: { Value, View: 'AnimatedView', Text: 'AnimatedText', timing: animation, spring: animation, parallel: animation, sequence: animation, loop: animation, delay: animation },
  Easing: { out: identity, inOut: identity, quad: identity, cubic: identity, sin: identity, linear: identity },
  Alert: { alert() {} }, Image: 'Image', Keyboard: { dismiss() {} }, KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal', Platform: { OS: 'ios' }, Pressable: 'Pressable', SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView',
  StyleSheet: { create: identity, absoluteFill: {} }, Text: 'Text', TextInput: 'TextInput', View: 'View',
});
mocks.set('expo-status-bar', { StatusBar: 'StatusBar' });
mocks.set('expo-linear-gradient', { LinearGradient: 'LinearGradient' });
mocks.set('@expo-google-fonts/fredoka', { useFonts: () => [true, null] });
mocks.set('expo-haptics', {
  ImpactFeedbackStyle: {}, NotificationFeedbackType: {},
  impactAsync: async () => {}, notificationAsync: async () => {}, selectionAsync: async () => {},
});
const App = require('../App.tsx').default;
const { createProfile, decodeProfiles } = require('../profiles.ts');
const { SQUISHIES, isBeyondLegendary } = require('../squishies.ts');
const component = (app, name) => app.root.find((n) => typeof n.type === 'function' && n.type.name === name);
let writes;
async function boot(t, profiles, raw) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  writes = [];
  storage.getItem = async (key) => key === 'squishpop.profiles' ? (raw ?? JSON.stringify(profiles)) : profiles[0]?.id;
  storage.setItem = async (key, value) => { if (key === 'squishpop.profiles') writes.push(value); };
  let app;
  await act(async () => { app = create(React.createElement(App)); });
  await act(async () => { t.mock.timers.tick(3800); });
  await act(async () => { t.mock.timers.tick(600); });
  t.after(async () => { await act(async () => app.unmount()); });
  return app;
}
async function duel(app, b, wordA = 'DOG') {
  await act(async () => component(app, 'StartScreen').props.onPlayWithFriend());
  await act(async () => component(app, 'NameEntryScreen').props.onPickOpponent(b));
  await act(async () => component(app, 'WordEntryScreen').props.onLockWord(wordA));
  await act(async () => component(app, 'PlaceholderScreen').props.onPress());
  await act(async () => component(app, 'WordEntryScreen').props.onLockWord('CAT'));
}

test('startup keeps existing collections and match stats', async (t) => {
  const a = { ...createProfile('A', 'dad'), collection: [SQUISHIES[0]], matchesWon: 4 };
  const app = await boot(t, [a]);
  const loaded = component(app, 'StartScreen').props.activeProfile;
  assert.equal(loaded.collection.length, 1);
  assert.equal(loaded.matchesWon, 4);
});
test('bad stored data offers recovery without overwriting storage', async (t) => {
  const app = await boot(t, [], '{');
  assert.equal(writes.length, 0);
  assert.ok(app.root.findAllByType('Text').some((n) => n.children.join('').includes('saved data has been kept')));
});
test('turn feedback blocks rapid input and Player B pays for their own hint', async (t) => {
  const a = createProfile('A', 'dad'), b = createProfile('B', 'mom');
  const app = await boot(t, [a, b]);
  await duel(app, b);
  const press = component(app, 'GameScreen').props.onLetterPress;
  await act(async () => { press('Z'); press('C'); });
  assert.deepEqual(component(app, 'GameScreen').props.guessed, ['Z']);
  assert.equal(component(app, 'GameScreen').props.inputDisabled, true);
  await act(async () => { t.mock.timers.tick(1300); });
  await act(async () => component(app, 'PlaceholderScreen').props.onPress());
  const game = component(app, 'GameScreen');
  assert.equal(game.props.activeProfile.id, b.id);
  await act(async () => game.props.onBuyHint('firstLetter', 0));
  assert.deepEqual(component(app, 'GameScreen').props.guessed, ['D']);
  const saved = decodeProfiles(writes.at(-1));
  assert.equal(saved.find((p) => p.id === a.id).coins, 25);
  assert.equal(saved.find((p) => p.id === b.id).coins, 10);
});
test('a last-letter hint ends the round and rapid purchases award only once', async (t) => {
  const a = createProfile('A', 'dad'), b = createProfile('B', 'mom');
  const app = await boot(t, [a, b]);
  await duel(app, b);
  await act(async () => component(app, 'GameScreen').props.onLetterPress('C'));
  await act(async () => component(app, 'GameScreen').props.onLetterPress('A'));
  const buy = component(app, 'GameScreen').props.onBuyHint;
  await act(async () => { buy('letter', 20); buy('letter', 20); });
  assert.ok(component(app, 'BlindBoxReveal'));
  const saved = decodeProfiles(writes.at(-1)).find((p) => p.id === a.id);
  assert.equal(saved.collection.length, 1);
  assert.equal(saved.coins, 5);
});
test('a non-VIP winner cannot inherit the opponent VIP pull odds', async (t) => {
  const a = { ...createProfile('A', 'dad'), isVip: true }, b = createProfile('B', 'mom');
  const app = await boot(t, [a, b]);
  await duel(app, b);
  await act(async () => component(app, 'GameScreen').props.onLetterPress('Z'));
  await act(async () => { t.mock.timers.tick(1300); });
  await act(async () => component(app, 'PlaceholderScreen').props.onPress());
  await act(async () => component(app, 'GameScreen').props.onSolvePress());
  const random = Math.random;
  Math.random = () => 0.9999;
  try { await act(async () => component(app, 'SolvePuzzleModal').props.onSubmit('DOG')); }
  finally { Math.random = random; }
  assert.equal(isBeyondLegendary(component(app, 'BlindBoxReveal').props.squishy.rarity), false);
  const saved = decodeProfiles(writes.at(-1));
  assert.equal(saved.find((p) => p.id === a.id).collection.length, 0);
  assert.equal(saved.find((p) => p.id === b.id).collection.length, 1);
});
test('a three-letter streak skips an already locked-out opponent', async (t) => {
  const a = createProfile('A', 'dad'), b = createProfile('B', 'mom');
  const app = await boot(t, [a, b]);
  await duel(app, b, 'HOUSE');
  async function miss(letter) {
    await act(async () => component(app, 'GameScreen').props.onLetterPress(letter));
    await act(async () => { t.mock.timers.tick(1300); });
    await act(async () => component(app, 'PlaceholderScreen').props.onPress());
  }
  for (let i = 0; i < 5; i++) {
    await miss(['E', 'F', 'H', 'I', 'J'][i]);
    await miss(['Z', 'X', 'C', 'V', 'B'][i]);
  }
  await miss('K'); // A is now out; B has five misses.
  for (const letter of ['H', 'O', 'U']) await act(async () => component(app, 'GameScreen').props.onLetterPress(letter));
  await act(async () => { t.mock.timers.tick(1300); });
  await act(async () => component(app, 'PlaceholderScreen').props.onPress());
  assert.equal(component(app, 'GameScreen').props.currentPlayer, 'B');
});
test('solo rewards resume saved progress and do not carry into another profile', async (t) => {
  const a = { ...createProfile('A', 'dad'), soloWins: 2 }, b = createProfile('B', 'mom');
  const app = await boot(t, [a, b]);
  await act(async () => component(app, 'StartScreen').props.onPlaySolo());
  await act(async () => component(app, 'CategorySelectScreen').props.onPick({ id: 'test', name: 'Test', emoji: '', words: ['CAT'] }));
  for (const letter of ['C', 'A', 'T']) await act(async () => component(app, 'GameScreen').props.onLetterPress(letter));
  assert.ok(component(app, 'BlindBoxReveal'));
  const saved = decodeProfiles(writes.at(-1)).find((p) => p.id === a.id);
  assert.equal(saved.soloWins, 3);
  assert.equal(saved.collection.length, 1);
  assert.equal(saved.puzzlesPlayed, 1);
  await act(async () => component(app, 'BlindBoxReveal').props.onContinue());
  await act(async () => component(app, 'SoloRoundEndScreen').props.onHome());
  await act(async () => component(app, 'StartScreen').props.onSwitchProfile());
  await act(async () => component(app, 'WhosPlayingScreen').props.onPickProfile(b));
  const start = component(app, 'StartScreen');
  assert.equal(start.props.soloWinStreak, 0);
  assert.equal(start.props.soloShelfCount, 0);
});
