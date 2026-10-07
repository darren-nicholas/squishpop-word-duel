export type HintType = 'letter' | 'firstLetter' | 'vowels' | 'extraLife' | 'skip';
export const HINT_COSTS: Record<HintType, number> = {
  letter: 20, firstLetter: 15, vowels: 30, extraLife: 40, skip: 50,
};

export function isWordSolved(word: string, guessed: string[]): boolean {
  const letters = word.match(/[A-Z]/g) ?? [];
  return letters.length > 0 && letters.every((letter) => guessed.includes(letter));
}

export function lettersForHint(type: HintType, word: string, guessed: string[], random = Math.random): string[] {
  const letters = [...new Set(word.match(/[A-Z]/g) ?? [])];
  const missing = letters.filter((l) => !guessed.includes(l));
  if (type === 'letter') return missing.length ? [missing[Math.floor(random() * missing.length)]] : [];
  if (type === 'firstLetter') return letters.length && !guessed.includes(letters[0]) ? [letters[0]] : [];
  if (type === 'vowels') return missing.filter((l) => 'AEIOU'.includes(l));
  return [];
}

export function wrongGuesses(word: string, guessed: string[]): number {
  return guessed.filter((letter) => !word.includes(letter)).length;
}

export function canTakeTurn(word: string, guessed: string[], extraLives: number): boolean {
  return wrongGuesses(word, guessed) < 6 + extraLives;
}
