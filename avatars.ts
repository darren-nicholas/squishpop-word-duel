// Avatar catalog — 25 full-body 3D claymation characters for player profiles.
// Each image is a transparent PNG, head near top / feet near bottom.

export type AvatarCategory = 'people' | 'creatures' | 'costumed';

export type Avatar = {
  id: string;
  name: string;
  category: AvatarCategory;
  image: any; // require(...) image source
};

export const AVATARS: Avatar[] = [
  // People
  { id: 'dad', name: 'Dad', category: 'people', image: require('./assets/images/avatars/dad.png') },
  { id: 'mom', name: 'Mom', category: 'people', image: require('./assets/images/avatars/mom.png') },
  { id: 'pigtails_girl', name: 'Pippa', category: 'people', image: require('./assets/images/avatars/pigtails_girl.png') },
  { id: 'skater_kid', name: 'Rip', category: 'people', image: require('./assets/images/avatars/skater_kid.png') },
  { id: 'soccer_girl', name: 'Zuri', category: 'people', image: require('./assets/images/avatars/soccer_girl.png') },
  { id: 'baseball_boy', name: 'Buddy', category: 'people', image: require('./assets/images/avatars/baseball_boy.png') },
  { id: 'book_boy', name: 'Milo', category: 'people', image: require('./assets/images/avatars/book_boy.png') },
  { id: 'rockstar_kid', name: 'Riff', category: 'people', image: require('./assets/images/avatars/rockstar_kid.png') },
  { id: 'detective_boy', name: 'Dex', category: 'people', image: require('./assets/images/avatars/detective_boy.png') },
  { id: 'boba_girl', name: 'Mika', category: 'people', image: require('./assets/images/avatars/boba_girl.png') },
  { id: 'baller_kid', name: 'Jax', category: 'people', image: require('./assets/images/avatars/baller_kid.png') },
  { id: 'boombox_boy', name: 'Boom', category: 'people', image: require('./assets/images/avatars/boombox_boy.png') },

  // Fantasy creatures
  { id: 'unicorn_kid', name: 'Luna', category: 'creatures', image: require('./assets/images/avatars/unicorn_kid.png') },
  { id: 'cat_kid', name: 'Mochi', category: 'creatures', image: require('./assets/images/avatars/cat_kid.png') },
  { id: 'fox_kid', name: 'Finn', category: 'creatures', image: require('./assets/images/avatars/fox_kid.png') },
  { id: 'dragon_kid', name: 'Spark', category: 'creatures', image: require('./assets/images/avatars/dragon_kid.png') },
  { id: 'bunny_kid', name: 'Hop', category: 'creatures', image: require('./assets/images/avatars/bunny_kid.png') },
  { id: 'mermaid_kid', name: 'Coral', category: 'creatures', image: require('./assets/images/avatars/mermaid_kid.png') },
  { id: 'ghost_kid', name: 'Boo', category: 'creatures', image: require('./assets/images/avatars/ghost_kid.png') },
  { id: 'alien_kid', name: 'Zip', category: 'creatures', image: require('./assets/images/avatars/alien_kid.png') },

  // Costumed
  { id: 'astronaut_kid', name: 'Nova', category: 'costumed', image: require('./assets/images/avatars/astronaut_kid.png') },
  { id: 'pirate_kid', name: 'Patch', category: 'costumed', image: require('./assets/images/avatars/pirate_kid.png') },
  { id: 'superhero_kid', name: 'Bolt', category: 'costumed', image: require('./assets/images/avatars/superhero_kid.png') },
  { id: 'wizard_kid', name: 'Sage', category: 'costumed', image: require('./assets/images/avatars/wizard_kid.png') },
  { id: 'princess_kid', name: 'Rose', category: 'costumed', image: require('./assets/images/avatars/princess_kid.png') },
];

export const AVATARS_BY_ID: Record<string, Avatar> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a])
);

export function getAvatar(id: string): Avatar {
  return AVATARS_BY_ID[id] ?? AVATARS[0];
}

// Group for the picker UI
export const AVATAR_SECTIONS: { title: string; data: Avatar[] }[] = [
  { title: 'People', data: AVATARS.filter((a) => a.category === 'people') },
  { title: 'Creatures', data: AVATARS.filter((a) => a.category === 'creatures') },
  { title: 'Costumed', data: AVATARS.filter((a) => a.category === 'costumed') },
];

// Each avatar has a distinct "team color" that follows the player through the game.
// Used on player picker tiles AND as the background gradient on their secret-word entry screen.
// Colors picked to match the avatar's dominant outfit/body color.
export type AvatarPalette = {
  bg: string;           // soft tile background
  accent: string;       // darker accent for borders / text
  gradient: string[];   // 3-stop full-screen gradient
};

// 25 maximally distinct hues — spread around the color wheel so any two picks pop apart.
// Color is a "team color" for recognition, not a strict reflection of character outfit.
export const AVATAR_COLORS: Record<string, AvatarPalette> = {
  // People
  dad:           { bg: '#FFF2A8', accent: '#8A5F00', gradient: ['#FFF2A8', '#FFC168', '#FF9B48'] }, // yellow → gold
  mom:           { bg: '#E8D4C0', accent: '#6B3E1A', gradient: ['#F0E0CC', '#C89A68', '#8E5E2E'] }, // warm beige-brown
  pigtails_girl: { bg: '#FFADC6', accent: '#A5305A', gradient: ['#FFC4D4', '#FF6B96', '#D9357F'] }, // HOT PINK (bright, saturated)
  skater_kid:    { bg: '#A5D4FF', accent: '#1F5A8E', gradient: ['#C5E4FF', '#5BA9E8', '#2E7DD9'] }, // sky blue
  soccer_girl:   { bg: '#C8E8B4', accent: '#2E5E35', gradient: ['#D4F0C4', '#8ED178', '#4FA85C'] }, // leaf green
  baseball_boy:  { bg: '#FFB4B4', accent: '#8A1A1A', gradient: ['#FFC9C9', '#FF7A7A', '#D94848'] }, // red
  book_boy:      { bg: '#8ED4B8', accent: '#0D5A3A', gradient: ['#A5E0C8', '#4FBC8E', '#1F7A58'] }, // forest green
  rockstar_kid:  { bg: '#E8A5F0', accent: '#5A1A8E', gradient: ['#F0BCF5', '#C870E8', '#8E3BC4'] }, // electric magenta
  detective_boy: { bg: '#F0A085', accent: '#5A2A0A', gradient: ['#F5BCA5', '#E8743A', '#A54818'] }, // rust / burnt sienna
  boba_girl:     { bg: '#A4E6D4', accent: '#0D5A4D', gradient: ['#BCF0DC', '#5EC4AE', '#1F7A68'] }, // teal
  baller_kid:    { bg: '#FFCB94', accent: '#8A4300', gradient: ['#FFDCB0', '#FFA14A', '#E86F18'] }, // tangerine
  boombox_boy:   { bg: '#B8B8C8', accent: '#2A2A3A', gradient: ['#CCCCDA', '#7878A0', '#3A3A5E'] }, // slate gray

  // Creatures
  unicorn_kid:   { bg: '#D4C4F0', accent: '#4A2E78', gradient: ['#DCCBF0', '#A89AD4', '#6B5BAE'] }, // lavender (not pink!)
  cat_kid:       { bg: '#F0B49E', accent: '#8E3A1A', gradient: ['#F5C4B0', '#E88A68', '#B5582E'] }, // salmon/coral
  fox_kid:       { bg: '#FFBE7A', accent: '#8E4A00', gradient: ['#FFCC94', '#FF8E33', '#C45E00'] }, // bright orange
  dragon_kid:    { bg: '#B4F0C8', accent: '#1A6E35', gradient: ['#C8F5D4', '#5BC878', '#2E8E4A'] }, // mint
  bunny_kid:     { bg: '#B8DAF0', accent: '#1A4A70', gradient: ['#CCE4F5', '#78B4E0', '#2E6EA8'] }, // powder blue
  mermaid_kid:   { bg: '#9DE0E8', accent: '#0D5078', gradient: ['#B4ECF0', '#5EBED0', '#1F8EA8'] }, // aqua / cyan
  ghost_kid:     { bg: '#C8D4F0', accent: '#2E3878', gradient: ['#D4DCF0', '#8E9EDC', '#4A5BAE'] }, // periwinkle
  alien_kid:     { bg: '#D4F08E', accent: '#4A6E0D', gradient: ['#DCF5A5', '#A8D13A', '#6B8E0D'] }, // chartreuse / lime

  // Costumed
  astronaut_kid: { bg: '#A5B8F5', accent: '#1A2A8E', gradient: ['#BCCAF5', '#5B70E0', '#2E3EB0'] }, // indigo blue
  pirate_kid:    { bg: '#C89468', accent: '#4A2A0A', gradient: ['#D4A478', '#8E6038', '#5A3A18'] }, // umber brown
  superhero_kid: { bg: '#8ECAFF', accent: '#1A4A8E', gradient: ['#A8D4F5', '#4A8ED9', '#1F5EAE'] }, // azure blue
  wizard_kid:    { bg: '#A68EE8', accent: '#2E1A6E', gradient: ['#B8A5EC', '#6B50C4', '#3A2E8E'] }, // royal purple
  princess_kid:  { bg: '#F0C4D8', accent: '#8E1A58', gradient: ['#F5D4E4', '#D970A0', '#B5306A'] }, // rose (red-pink, distinct from hot pink)
};

export function getAvatarPalette(avatarId: string): AvatarPalette {
  return AVATAR_COLORS[avatarId] ?? {
    bg: '#F0E4D0',
    accent: '#8B5E3B',
    gradient: ['#FFF8EA', '#D4A574', '#8B5E3B'],
  };
}
