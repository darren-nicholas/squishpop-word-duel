// Profile system for SquishPop Word Duel.
// Each person who plays on this device has their own profile with its own
// squishy collection, stats, and avatar.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Squishy } from './squishies';
import { SQUISHIES } from './squishies';

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
  puzzlesPlayed?: number; // lifetime completed rounds, used for interstitial grace period
  soloWins?: number; // reward progress belongs to this profile and survives restarts
};

// First N completed rounds (lifetime) are ad-free. After that, interstitials
// show on a cadence instead of every round, to keep the kid-game feel.
export const INTERSTITIAL_GRACE_PUZZLES = 10;
// Show an interstitial every Nth puzzle after the grace period
// (so with grace=10 and every=3: ads on puzzles 11, 14, 17, 20, ...).
export const INTERSTITIAL_EVERY_N_PUZZLES = 3;
// Skip the interstitial if the just-finished round took less than this many ms.
export const INTERSTITIAL_MIN_ROUND_MS = 60_000;

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
  const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILES);
  if (!raw) return [];
  return decodeProfiles(raw);
}

const catalog = new Map(SQUISHIES.map((s) => [s.id, s]));
function counter(value: unknown, fallback = 0): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error('Invalid profile counter');
  return value as number;
}

// Validate before hydration. Corrupt storage must never become an empty array
// that the persistence effect then writes over the player's original data.
export function decodeProfiles(raw: string): Profile[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Invalid profile storage');
  const ids = new Set<string>();
  return data.map((p) => {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) ||
        typeof p.name !== 'string' || !p.name.trim() ||
        typeof p.avatarId !== 'string' || !Array.isArray(p.collection)) {
      throw new Error('Invalid profile storage');
    }
    ids.add(p.id);
    const collection = p.collection.map((entry: unknown) => {
      const id = typeof entry === 'string' ? entry : (entry as { id?: unknown } | null)?.id;
      const squishy = typeof id === 'string' ? catalog.get(id) : undefined;
      if (!squishy) throw new Error('Unknown saved squishy');
      // Native image handles are process-local; always restore current catalog data.
      return squishy;
    });
    return {
      id: p.id, name: p.name, avatarId: p.avatarId,
      createdAt: counter(p.createdAt), collection,
      matchesWon: counter(p.matchesWon), matchesPlayed: counter(p.matchesPlayed),
      legendariesPulled: counter(p.legendariesPulled),
      coins: counter(p.coins, 25), isVip: p.isVip === true,
      puzzlesPlayed: counter(p.puzzlesPlayed), soloWins: counter(p.soloWins),
      ...(p.adWatches && typeof p.adWatches.date === 'string' ? {
        adWatches: { date: p.adWatches.date, freePull: counter(p.adWatches.freePull), coins: counter(p.adWatches.coins) },
      } : {}),
    };
  });
}

let profileWrites: Promise<void> = Promise.resolve();
export async function saveProfiles(profiles: Profile[]): Promise<void> {
  const snapshot = JSON.stringify(profiles.map((p) => ({ ...p, collection: p.collection.map((s) => s.id) })));
  const write = profileWrites.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY_PROFILES, snapshot));
  profileWrites = write;
  await write;
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

// Sell an extra copy only. Keep the last collected copy, even under rapid taps.
export function sellOneDuplicate(profile: Profile, squishyId: string): Profile {
  if (duplicateCount(profile, squishyId) < 2) return profile;
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
  if (!Number.isSafeInteger(amount) || amount <= 0 || profile.coins < amount) return profile;
  return {
    ...profile,
    coins: Math.max(0, profile.coins - amount),
  };
}

export function addCoins(profile: Profile, amount: number): Profile {
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(profile.coins + amount)) return profile;
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
