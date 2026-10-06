// Haptic feedback helpers — semantic wrappers around expo-haptics so game
// code says "haptics.correctGuess()" instead of calling the API directly.
// Fire-and-forget; the Promise is deliberately not awaited at call sites
// (haptic latency should never block gameplay).
//
// Note: the rare / legendary / beyond-legendary FANFARE components in App.tsx
// fire their own additional celebration haptics on top of boxReveal(). That's
// intentional — boxReveal is the baseline "the box opened" buzz, the fanfare
// adds the "look at THIS one" celebration layer.

import * as Haptics from 'expo-haptics';

export const haptics = {
  // --- Guess feedback (letter taps during gameplay) ---
  correctGuess() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  wrongGuess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  streak() {
    // 3-in-a-row turn pass — small celebratory tick + light pulse
    Haptics.selectionAsync().catch(() => {});
    setTimeout(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
      60
    );
  },
  letterLockout() {
    // 6 wrong — you can't guess anymore
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },

  // --- Turn + round transitions ---
  turnPass() {
    // "Pay attention, your turn" — matters most for pass-the-phone 2P
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  roundWin() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  matchWin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
      150
    );
  },

  // --- zAIa ---
  zaiaAttention() {
    // Gentle "look at me" when the AI buddy pops up
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  // --- Blind box reveal sequence (baseline — fanfare components layer on top for rare+) ---
  boxAppear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  boxShake() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  boxReveal() {
    // The "box opens" moment — baseline heavy impact for every rarity.
    // Rare+ fanfare components fire additional haptics on top of this.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
};
