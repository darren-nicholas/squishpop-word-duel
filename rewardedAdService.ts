// Rewarded ad service.
//
// Today: STUBBED — simulates "watching ad" delays then returns success.
// Tomorrow: swap the bodies of `watchAdForReward` and `showInterstitial` with
// real AdMob (expo-ads-admob) or SuperAwesome calls. UI + cap logic + reward
// delivery stay unchanged.

export type AdRewardType = 'freePull' | 'coins';

const SIMULATED_REWARDED_MS = 3000;
const SIMULATED_INTERSTITIAL_MS = 2500;

export async function watchAdForReward(_type: AdRewardType): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, SIMULATED_REWARDED_MS));
  return { success: true };
}

export async function showInterstitial(): Promise<void> {
  await new Promise((r) => setTimeout(r, SIMULATED_INTERSTITIAL_MS));
}

export const COINS_PER_AD = 100;
