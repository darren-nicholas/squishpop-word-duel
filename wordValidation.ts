import englishWords from 'an-array-of-english-words';
const DICTIONARY = new Set(englishWords);

export function normalizeWord(word: string): string {
  return word.trim().toUpperCase().replace(/\s+/g, ' ');
}

function wordIsInDictionary(word: string): boolean {
  const lower = word.toLowerCase();
  if (DICTIONARY.has(lower)) return true;

  if (lower.includes("'") && DICTIONARY.has(lower.replace(/'/g, ''))) {
    return true;
  }

  if (lower.includes('-')) {
    if (DICTIONARY.has(lower.replace(/-/g, ''))) return true;
    const parts = lower.split('-').filter((p) => p.length > 0);
    if (parts.length > 0 && parts.every((p) => DICTIONARY.has(p))) return true;
  }

  return false;
}

function allWordsInDictionary(phrase: string): boolean {
  const words = phrase.split(/\s+/).filter((w) => w.length > 0);
  return words.every((w) => wordIsInDictionary(w));
}

const PROFANITY_BLOCKLIST = new Set([
  'FUCK', 'FUCKER', 'FUCKED', 'FUCKING',
  'SHIT', 'SHITTY', 'SHITTED',
  'BITCH', 'BITCHES', 'BITCHY',
  'ASSHOLE', 'ASS', 'ASSES',
  'DICK', 'DICKS', 'DICKED',
  'PUSSY', 'PUSSIES',
  'COCK', 'COCKS',
  'BASTARD', 'BASTARDS',
  'DAMN', 'DAMNED',
  'PISS', 'PISSED', 'PISSING',
  'WHORE', 'WHORES',
  'SLUT', 'SLUTS', 'SLUTTY',
  'FAG', 'FAGS', 'FAGGOT',
  'CUNT', 'CUNTS',
  'PRICK', 'PRICKS',
  'WANKER',
  'ANAL', 'ANUS',
  'BOOB', 'BOOBS', 'BOOBIES',
  'BREAST', 'BREASTS',
  'NIPPLE', 'NIPPLES',
  'PENIS', 'PENIES', 'PENI',
  'VAGINA', 'VAG',
  'TIT', 'TITS', 'TITTY',
  'SCROTUM',
  'JIZZ', 'CUM', 'CUMS',
  'DILDO',
  'HORNY',
  'ERECTION',
  'TURD', 'TURDS',
  'HELL', 'HELLS',
]);

function containsProfanity(phrase: string): boolean {
  const words = phrase.toUpperCase().split(/[\s'\-]+/);
  return words.some((w) => PROFANITY_BLOCKLIST.has(w)) || PROFANITY_BLOCKLIST.has(phrase.toUpperCase().replace(/[^A-Z]/g, ''));
}

type Validation = {
  valid: boolean;
  warning: boolean;
  message: string;
  suggestions?: string[];
};

export function validateWord(input: string): Validation {
  const word = normalizeWord(input);
  if (word.length === 0) {
    return {
      valid: false,
      warning: false,
      message: 'Type a word or phrase to begin.',
    };
  }
  if (word.replace(/[^A-Z]/g, '').length < 3) {
    return {
      valid: false,
      warning: false,
      message: 'Too short — needs at least 3 letters.',
    };
  }
  if (word.length > 25) {
    return {
      valid: false,
      warning: false,
      message: 'Too long — max 25 characters.',
    };
  }
  if (!/^[A-Z\s'\-]+$/.test(word)) {
    return {
      valid: false,
      warning: false,
      message: 'Only letters, spaces, apostrophes, and hyphens.',
    };
  }
  if (!/[AEIOUY]/.test(word)) {
    return {
      valid: false,
      warning: false,
      message: 'Needs at least one vowel.',
    };
  }

  if (containsProfanity(word)) {
    return {
      valid: false,
      warning: false,
      message: 'Please choose a different word.',
    };
  }

  if (!allWordsInDictionary(word)) {
    return {
      valid: true,
      warning: true,
      message: "⚠ Can't verify this is a real word. Lock in if you're sure.",
    };
  }

  return {
    valid: true,
    warning: false,
    message: '✓ Great word — ready to lock in.',
  };
}

