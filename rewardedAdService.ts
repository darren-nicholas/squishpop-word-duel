// Rewarded ad service.
//
// Today: STUBBED — simulates a 3-second "watching ad" delay then returns success.
// Tomorrow: swap the body of `watchAdForReward` with real AdMob (expo-ads-admob)
// or SuperAwesome calls. UI, cap logic, and reward delivery stay unchanged.

export type AdRewardType = 'freePull' | 'coins';

const SIMULATED_AD_MS = 3000;

export async function watchAdForReward(_type: AdRewardType): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, SIMULATED_AD_MS));
  return { success: true };
}

export const COINS_PER_AD = 100;
