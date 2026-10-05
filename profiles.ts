// Profile system for SquishPop Word Duel.
// Each person who plays on this device has their own profile with its own
// squishy collection, stats, and avatar.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Squishy } from './squishies';

export type Profile = {
  id: string;
  name: string;
  avatarId: string; // key into AVATARS catalog
  createdAt: number;
  collection: Squishy[]; // all squishies ever won by this profile
  matchesWon: number;
  matchesPlayed: number;
  legendariesPulled: number;
  isVip: boolean; // unlocks Beyond-Legendary Vault + weekly drops
  coins: number; // currency earned by selling duplicates, spent on hints
  adWatches?: { date: string; freePull: number; coins: number }; // rewarded-ad daily counters
};

export type AdRewardType = 'freePull' | 'coins';
export const AD_DAILY_LIMIT = 3;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getAdWatchesToday(profile: Profile): { freePull: number; coins: number } {
  const today = todayStr();
  if (!profile.adWatches || profile.adWatches.date !== today) {
    return { freePull: 0, coins: 0 };
  }
  return { freePull: profile.adWatches.freePull, coins: profile.adWatches.coins };
}

export function canWatchAd(profile: Profile, type: AdRewardType): boolean {
  return getAdWatchesToday(profile)[type] < AD_DAILY_LIMIT;
}

export function recordAdWatch(profile: Profile, type: AdRewardType): Profile {
  const today = todayStr();
  const current = getAdWatchesToday(profile);
  return {
    ...profile,
    adWatches: {
      date: today,
      freePull: type === 'freePull' ? current.freePull + 1 : current.freePull,
      coins: type === 'coins' ? current.coins + 1 : current.coins,
    },
  };
}

// Coin values per rarity when selling a duplicate
export const COIN_VALUES: Record<string, number> = {
  common: 5,
  rare: 25,
  legendary: 100,
  chrome: 300,
  crystal: 300,
  shadow: 300,
  mythic: 500,
};

export function coinValueFor(squishy: Squishy): number {
  return COIN_VALUES[squishy.rarity] ?? 5;
}

const STORAGE_KEY_PROFILES = 'squishpop.profiles';
const STORAGE_KEY_ACTIVE = 'squishpop.activeProfileId';

export async function loadProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('loadProfiles failed:', e);
    return [];
  }
}

export async function saveProfiles(profiles: Profile[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
}

export async function loadActiveProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_ACTIVE);
}

export async function saveActiveProfileId(id: string | null): Promise<void> {
  if (id === null) {
    await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE);
  } else {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE, id);
  }
}

export function createProfile(name: string, avatarId: string): Profile {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    avatarId,
    createdAt: Date.now(),
    collection: [],
    matchesWon: 0,
    matchesPlayed: 0,
    legendariesPulled: 0,
    isVip: false,
    coins: 25, // starter bonus — enough to try a hint on round 1
  };
}

// Sell one duplicate of a squishy. Only call when duplicateCount(profile, id) >= 1.
// Removes ONE copy and credits coins. If called when count is 1, the squishy
// disappears from the collection entirely (silhouette in trophy room again).
export function sellOneDuplicate(profile: Profile, squishyId: string): Profile {
  const idx = profile.collection.findIndex((s) => s.id === squishyId);
  if (idx === -1) return profile;
  const squishy = profile.collection[idx];
  const value = coinValueFor(squishy);
  return {
    ...profile,
    collection: profile.collection.filter((_, i) => i !== idx),
    coins: profile.coins + value,
  };
}

export function spendCoins(profile: Profile, amount: number): Profile {
  return {
    ...profile,
    coins: Math.max(0, profile.coins - amount),
  };
}

export function addCoins(profile: Profile, amount: number): Profile {
  return {
    ...profile,
    coins: profile.coins + amount,
  };
}

export function awardSquishiesToProfile(
  profile: Profile,
  squishies: Squishy[]
): Profile {
  const legendaryCount = squishies.filter((s) => s.rarity === 'legendary').length;
  return {
    ...profile,
    collection: [...profile.collection, ...squishies],
    legendariesPulled: profile.legendariesPulled + legendaryCount,
  };
}

export function recordMatchForProfile(profile: Profile, won: boolean): Profile {
  return {
    ...profile,
    matchesPlayed: profile.matchesPlayed + 1,
    matchesWon: profile.matchesWon + (won ? 1 : 0),
  };
}

// Collection helpers
export function uniqueSquishyIds(profile: Profile): Set<string> {
  return new Set(profile.collection.map((s) => s.id));
}

export function duplicateCount(profile: Profile, squishyId: string): number {
  return profile.collection.filter((s) => s.id === squishyId).length;
}
