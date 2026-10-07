// Rewarded ad service.
//
// Today: STUBBED — simulates "watching ad" delays then returns success.
// Tomorrow: swap the bodies of `watchAdForReward` and `showInterstitial` with
// real AdMob (expo-ads-admob) or SuperAwesome calls. UI + cap logic + reward
// delivery stay unchanged.

export type AdRewardType = 'freePull' | 'coins';

// Simulation is only for QA. Never present a fake ad or grant its rewards in release builds.
export const ADS_AVAILABLE = __DEV__;

const SIMULATED_REWARDED_MS = 3000;
const SIMULATED_INTERSTITIAL_MS = 2500;

export async function watchAdForReward(_type: AdRewardType): Promise<{ success: boolean }> {
  if (!ADS_AVAILABLE) return { success: false };
  await new Promise((r) => setTimeout(r, SIMULATED_REWARDED_MS));
  return { success: true };
}

export async function showInterstitial(): Promise<void> {
  if (!ADS_AVAILABLE) return;
  await new Promise((r) => setTimeout(r, SIMULATED_INTERSTITIAL_MS));
}

export const COINS_PER_AD = 100;
