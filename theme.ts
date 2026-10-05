// Vibrant screen-specific color themes for SquishPop Word Duel.
// Inspired by chunky-kawaii mobile games (Fakeit, Pop Mart apps, etc.)
// Each gradient is top → bottom. All colors chosen for high playfulness.

export const SCREEN_GRADIENTS: Record<string, string[]> = {
  // Start — warm amber/orange welcome
  start: ['#FFC168', '#FF9B48', '#FF7A2E'],

  // Name entry — playful hot pink/coral
  nameEntry: ['#FFADC6', '#FF7FA6', '#F0608C'],

  // Category select (solo) — electric purple (choose your adventure)
  categorySelect: ['#C9A5F0', '#9F7AE0', '#7A5BC8'],

  // Pre-game handoff + turn pass — soft lavender (zAIa's color)
  handoff: ['#C7B4F0', '#A685E0', '#8562CC'],

  // Word entry — deep ocean blue (focus mode)
  wordEntry: ['#7FC1FF', '#4A9EFF', '#2E7DD9'],

  // Playing — soft neutral cream (keep the game legible)
  playing: ['#FFF4E6', '#FFEAC9'],

  // Round end — sunshine gold celebration
  roundEnd: ['#FFE89E', '#FFCF57', '#FFA826'],

  // Solo round end — mint fresh
  soloRoundEnd: ['#A8E6D4', '#78D4B3', '#4FBC8E'],

  // Match winner — royal purple (big moment)
  matchWinner: ['#D8BFEA', '#9972CC', '#5A3498'],

  // Avatar picker — alive charcoal gradient with warm amber bloom
  avatarPicker: ['#5D5760', '#403B46', '#2A262E'],

  // Blind box reveal — themed per shelf (handled separately in reveal)
  reveal: ['#FFECA8', '#FFC168', '#FF9B48'],

  // Shelf-themed reveal backgrounds (each matches its squishy family)
  rainbow: ['#FFB4D1', '#B48FEE', '#4FC3F7'],
  glitter: ['#FFD6EB', '#C9A5F0', '#9F7AE0'],
  halloween: ['#FF9344', '#D06012', '#4A1A00'],
  christmas: ['#F26666', '#C0392B', '#1A5B3F'],
  floral: ['#FFC2DC', '#F5A4C2', '#D580A4'],
  dessert: ['#FFE4C4', '#E0A878', '#8B5E3B'],
  creature: ['#B8E0A5', '#78C878', '#2F7A3F'],
  dogs: ['#F5D4A5', '#D9A878', '#8B5E3B'],
  fruit: ['#FFC9A8', '#FF9B6B', '#D14F2E'],
  sea: ['#A5E3F0', '#5BBED0', '#1F7A94'],
};

// Candy / toy palette for pill buttons
export const BUBBLE_COLORS = {
  // Primary action — warm sunshine
  primary: '#FFB800',
  primaryText: '#2A1A00',
  primaryShadow: '#CC7A00',

  // Secondary action — soft cream with dark text
  secondary: '#FFF8E8',
  secondaryText: '#2A1A00',
  secondaryShadow: '#D4C8A8',

  // Accent — hot coral
  coral: '#FF6B6B',
  coralText: '#FFFFFF',
  coralShadow: '#D94848',

  // Mint — gentle positive
  mint: '#4FBC8E',
  mintText: '#FFFFFF',
  mintShadow: '#2F8A62',

  // Purple — zAIa / magic
  purple: '#9972CC',
  purpleText: '#FFFFFF',
  purpleShadow: '#5A3498',

  // Dark — strong CTA
  dark: '#1a1613',
  darkText: '#FFFFFF',
  darkShadow: '#000000',
};
