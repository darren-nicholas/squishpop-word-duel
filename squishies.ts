import type { ImageSourcePropType } from 'react-native';

export type Rarity =
  | 'common'
  | 'rare'
  | 'legendary'
  // Beyond-Legendary (VIP only)
  | 'chrome'
  | 'crystal'
  | 'shadow'
  | 'mythic';

export const BEYOND_LEGENDARY_RARITIES: Rarity[] = ['chrome', 'crystal', 'shadow', 'mythic'];
export const FREE_RARITIES: Rarity[] = ['common', 'rare', 'legendary'];

export function isBeyondLegendary(r: Rarity): boolean {
  return BEYOND_LEGENDARY_RARITIES.includes(r);
}

export function rarityDisplayName(r: Rarity): string {
  switch (r) {
    case 'common': return 'Common';
    case 'rare': return 'Rare';
    case 'legendary': return 'Legendary';
    case 'chrome': return 'Chrome Edition';
    case 'crystal': return 'Crystal Edition';
    case 'shadow': return 'Shadow Edition';
    case 'mythic': return 'Mythic';
  }
}

export type Shelf =
  | 'rainbow'
  | 'glitter'
  | 'halloween'
  | 'christmas'
  | 'floral'
  | 'dessert'
  | 'creature'
  | 'dogs'
  | 'fruit'
  | 'sea';

export type Favorite = {
  category: string; // e.g. "Favorite food", "Favorite song"
  value: string;    // e.g. "pepper", "Shake It Off"
};

export type Squishy = {
  id: string;
  name: string;        // character name (fixed, Beanie-Boo style)
  species: string;     // descriptive species/type (e.g. "Golden Retriever", "Pumpkin")
  birthday: string;    // "Month Day" format, no year
  favorite: Favorite;
  rarity: Rarity;
  shelf: Shelf;
  image: ImageSourcePropType;
};

export const SHELVES: Record<Shelf, { emoji: string; name: string }> = {
  rainbow: { emoji: '🌈', name: 'Rainbow' },
  glitter: { emoji: '✨', name: 'Glitter' },
  halloween: { emoji: '🎃', name: 'Halloween' },
  christmas: { emoji: '🎄', name: 'Christmas' },
  floral: { emoji: '🌸', name: 'Floral' },
  dessert: { emoji: '🍰', name: 'Dessert' },
  creature: { emoji: '🐾', name: 'Creature' },
  dogs: { emoji: '🐕', name: 'Dogs' },
  fruit: { emoji: '🍎', name: 'Fruit' },
  sea: { emoji: '🐠', name: 'Sea Creatures' },
};

export const SQUISHIES: Squishy[] = [
  // 🌈 Rainbow
  { id: 'rainbow-01', name: 'Ziggy', species: 'Striped Rainbow', birthday: 'June 7', favorite: { category: 'Favorite game', value: 'dodgeball' }, rarity: 'common', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-01-striped.png') },
  { id: 'rainbow-02', name: 'Taffy', species: 'Pastel Swirl', birthday: 'April 11', favorite: { category: 'Favorite ice cream', value: 'bubblegum' }, rarity: 'common', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-02-pastel-swirl.png') },
  { id: 'rainbow-03', name: 'Sparkle', species: 'Glitter Rainbow', birthday: 'October 2', favorite: { category: 'Favorite movie', value: 'Barbie' }, rarity: 'common', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-03-glitter.png') },
  { id: 'rainbow-04', name: 'Prism', species: 'Holographic Prism', birthday: 'August 23', favorite: { category: 'Favorite song', value: 'Shake It Off' }, rarity: 'common', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-04-holographic.png') },
  { id: 'rainbow-05', name: 'Groovy', species: 'Tie-Dye Rainbow', birthday: 'July 6', favorite: { category: 'Favorite dance', value: 'the moonwalk' }, rarity: 'common', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-05-tiedye.png') },
  { id: 'rainbow-06', name: 'Volt', species: 'Neon Glow', birthday: 'February 29', favorite: { category: 'Favorite color', value: 'electric green' }, rarity: 'rare', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-06-neon.png') },
  { id: 'rainbow-07', name: 'Chrome', species: 'Chrome Rainbow', birthday: 'November 11', favorite: { category: 'Favorite activity', value: 'skateboarding' }, rarity: 'rare', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-07-chrome.png') },
  { id: 'rainbow-08', name: 'Nova', species: 'Galaxy Rainbow', birthday: 'July 20', favorite: { category: 'Favorite activity', value: 'stargazing' }, rarity: 'legendary', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-08-galaxy-legendary.png') },

  // ✨ Glitter
  { id: 'glitter-01', name: 'Blush', species: 'Pink Sparkle', birthday: 'February 14', favorite: { category: 'Favorite color', value: 'bubblegum pink' }, rarity: 'common', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-01-pink.png') },
  { id: 'glitter-02', name: 'Glimmer', species: 'Silver Shimmer', birthday: 'December 31', favorite: { category: 'Favorite movie', value: 'Encanto' }, rarity: 'common', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-02-silver.png') },
  { id: 'glitter-03', name: 'Goldie', species: 'Gold Glitter', birthday: 'November 24', favorite: { category: 'Favorite song', value: 'Levitating' }, rarity: 'common', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-03-gold.png') },
  { id: 'glitter-04', name: 'Mystic', species: 'Purple Cosmic', birthday: 'October 10', favorite: { category: 'Favorite game', value: 'Among Us' }, rarity: 'common', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-04-purple.png') },
  { id: 'glitter-05', name: 'Shelly', species: 'Teal Mermaid', birthday: 'August 8', favorite: { category: 'Favorite movie', value: 'The Little Mermaid' }, rarity: 'common', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-05-teal.png') },
  { id: 'glitter-06', name: 'Opal', species: 'Opal Shimmer', birthday: 'September 14', favorite: { category: 'Favorite ice cream', value: 'rainbow sherbet' }, rarity: 'rare', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-06-opal.png') },
  { id: 'glitter-07', name: 'Rosie', species: 'Rose Gold', birthday: 'May 1', favorite: { category: 'Favorite drink', value: 'strawberry smoothie' }, rarity: 'rare', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-07-rosegold.png') },
  { id: 'glitter-08', name: 'Dazzle', species: 'Diamond Glitter', birthday: 'April 4', favorite: { category: 'Favorite activity', value: 'sparkling in sunlight' }, rarity: 'legendary', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-08-diamond-legendary.png') },

  // 🎃 Halloween
  { id: 'halloween-01', name: 'Jack', species: 'Pumpkin', birthday: 'October 31', favorite: { category: 'Favorite snack', value: 'pumpkin seeds' }, rarity: 'common', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-01-pumpkin.png') },
  { id: 'halloween-02', name: 'Echo', species: 'Little Bat', birthday: 'October 13', favorite: { category: 'Favorite song', value: 'Thriller' }, rarity: 'common', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-02-bat.png') },
  { id: 'halloween-03', name: 'Boo', species: 'Little Ghost', birthday: 'February 2', favorite: { category: 'Favorite game', value: 'hide and seek' }, rarity: 'common', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-03-ghost.png') },
  { id: 'halloween-04', name: 'Hex', species: 'Purple Witch', birthday: 'October 29', favorite: { category: 'Favorite movie', value: 'Hocus Pocus' }, rarity: 'rare', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-04-witch.png') },
  { id: 'halloween-05', name: 'Blink', species: 'One-Eyed Monster', birthday: 'September 9', favorite: { category: 'Favorite snack', value: 'gummy worms' }, rarity: 'common', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-05-monster.png') },
  { id: 'halloween-06', name: 'Corny', species: 'Candy Corn', birthday: 'October 30', favorite: { category: 'Favorite ice cream', value: 'candy corn' }, rarity: 'common', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-06-candycorn.png') },
  { id: 'halloween-07', name: 'Wraps', species: 'Mummy', birthday: 'July 23', favorite: { category: 'Favorite dance', value: 'the Mummy shuffle' }, rarity: 'rare', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-07-mummy.png') },
  { id: 'halloween-08', name: 'Specter', species: 'Spooky Spirit', birthday: 'October 15', favorite: { category: 'Favorite activity', value: 'haunting cozy attics' }, rarity: 'legendary', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-08-spirit-legendary.png') },

  // 🎄 Christmas
  { id: 'christmas-01', name: 'Nick', species: 'Santa', birthday: 'December 25', favorite: { category: 'Favorite snack', value: 'milk and cookies' }, rarity: 'common', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-01-santa.png') },
  { id: 'christmas-02', name: 'Jingles', species: 'Little Elf', birthday: 'December 24', favorite: { category: 'Favorite game', value: 'wrapping races' }, rarity: 'common', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-02-elf.png') },
  { id: 'christmas-03', name: 'Frost', species: 'Snowman', birthday: 'January 6', favorite: { category: 'Favorite activity', value: 'sledding' }, rarity: 'common', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-03-snowman.png') },
  { id: 'christmas-04', name: 'Mint', species: 'Candy Cane', birthday: 'December 12', favorite: { category: 'Favorite ice cream', value: 'peppermint' }, rarity: 'common', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-04-candycane.png') },
  { id: 'christmas-05', name: 'Ginger', species: 'Gingerbread', birthday: 'November 29', favorite: { category: 'Favorite movie', value: 'Elf' }, rarity: 'common', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-05-gingerbread.png') },
  { id: 'christmas-06', name: 'Belle', species: 'Gold Ornament', birthday: 'December 18', favorite: { category: 'Favorite song', value: 'All I Want for Christmas is You' }, rarity: 'rare', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-06-ornament.png') },
  { id: 'christmas-07', name: 'Tinsel', species: 'Silver Tinsel', birthday: 'December 15', favorite: { category: 'Favorite dance', value: 'the sleigh shuffle' }, rarity: 'rare', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-07-tinsel.png') },
  { id: 'christmas-08', name: 'Twinkle', species: 'Christmas Lights', birthday: 'December 26', favorite: { category: 'Favorite activity', value: 'lighting up the night' }, rarity: 'legendary', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-08-lights-legendary.png') },

  // 🌸 Floral
  { id: 'floral-01', name: 'Sakura', species: 'Cherry Blossom', birthday: 'April 15', favorite: { category: 'Favorite activity', value: 'picnicking under trees' }, rarity: 'common', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-01-cherryblossom.png') },
  { id: 'floral-02', name: 'Sunny', species: 'Sunflower', birthday: 'July 1', favorite: { category: 'Favorite song', value: 'Here Comes the Sun' }, rarity: 'common', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-02-sunflower.png') },
  { id: 'floral-03', name: 'Thorn', species: 'Rose', birthday: 'June 11', favorite: { category: 'Favorite movie', value: 'Beauty and the Beast' }, rarity: 'rare', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-03-rose.png') },
  { id: 'floral-04', name: 'Daisy', species: 'Daisy', birthday: 'April 29', favorite: { category: 'Favorite game', value: 'making flower crowns' }, rarity: 'common', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-04-daisy.png') },
  { id: 'floral-05', name: 'Lily', species: 'Lily', birthday: 'May 30', favorite: { category: 'Favorite color', value: 'lavender' }, rarity: 'common', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-05-lily.png') },
  { id: 'floral-06', name: 'Dutch', species: 'Tulip', birthday: 'April 7', favorite: { category: 'Favorite dance', value: 'the tulip twirl' }, rarity: 'rare', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-06-tulip.png') },
  { id: 'floral-07', name: 'Poppy', species: 'Poppy', birthday: 'August 2', favorite: { category: 'Favorite movie', value: 'Trolls' }, rarity: 'common', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-07-poppy.png') },
  { id: 'floral-08', name: 'Harmony', species: 'Golden Lotus', birthday: 'October 11', favorite: { category: 'Favorite activity', value: 'floating in sunlight' }, rarity: 'legendary', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-08-lotus-legendary.png') },

  // 🍰 Dessert
  { id: 'dessert-01', name: 'Scoops', species: 'Vanilla Ice Cream', birthday: 'July 7', favorite: { category: 'Favorite song', value: 'Watermelon Sugar' }, rarity: 'common', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-01-vanilla.png') },
  { id: 'dessert-02', name: 'Shortcake', species: 'Strawberry Sundae', birthday: 'June 14', favorite: { category: 'Favorite game', value: 'baking cupcakes' }, rarity: 'common', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-02-strawberry.png') },
  { id: 'dessert-03', name: 'Mintie', species: 'Mint Chip', birthday: 'March 17', favorite: { category: 'Favorite activity', value: 'leap-frogging' }, rarity: 'common', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-03-mintchip.png') },
  { id: 'dessert-04', name: 'Cocoa', species: 'Chocolate Fudge', birthday: 'February 7', favorite: { category: 'Favorite ice cream', value: 'double chocolate' }, rarity: 'common', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-04-chocolate.png') },
  { id: 'dessert-05', name: 'Floss', species: 'Cotton Candy', birthday: 'June 24', favorite: { category: 'Favorite dance', value: 'the sugar rush' }, rarity: 'common', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-05-cottoncandy.png') },
  { id: 'dessert-06', name: 'Pop', species: 'Bubblegum', birthday: 'August 5', favorite: { category: 'Favorite drink', value: 'strawberry milkshake' }, rarity: 'rare', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-06-bubblegum.png') },
  { id: 'dessert-07', name: 'Nibbles', species: 'Cheesecake', birthday: 'July 30', favorite: { category: 'Favorite movie', value: 'Ratatouille' }, rarity: 'rare', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-07-cheesecake.png') },
  { id: 'dessert-08', name: 'Marshmallow', species: "S'mores", birthday: 'June 10', favorite: { category: 'Favorite activity', value: 'campfire singalongs' }, rarity: 'legendary', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-08-smores-legendary.png') },

  // 🐾 Creature
  { id: 'creature-01', name: 'Hoppy', species: 'Bunny', birthday: 'March 20', favorite: { category: 'Favorite snack', value: 'baby carrots' }, rarity: 'common', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-01-bunny.png') },
  { id: 'creature-02', name: 'Chelan', species: 'Kitty', birthday: 'August 11', favorite: { category: 'Favorite activity', value: 'naps on the couch' }, rarity: 'common', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-02-cat.png') },
  { id: 'creature-03', name: 'Buttons', species: 'Teddy Bear', birthday: 'February 27', favorite: { category: 'Favorite song', value: 'Bear Necessities' }, rarity: 'common', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-03-bear.png') },
  { id: 'creature-04', name: 'Finn', species: 'Fox', birthday: 'September 22', favorite: { category: 'Favorite movie', value: 'Zootopia' }, rarity: 'common', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-04-fox.png') },
  { id: 'creature-05', name: 'Boba', species: 'Panda', birthday: 'August 24', favorite: { category: 'Favorite food', value: 'bamboo' }, rarity: 'rare', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-05-panda.png') },
  { id: 'creature-06', name: 'Hop', species: 'Frog', birthday: 'April 20', favorite: { category: 'Favorite game', value: 'hop-skip-jump' }, rarity: 'common', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-06-frog.png') },
  { id: 'creature-07', name: 'Rex', species: 'Dino', birthday: 'January 2', favorite: { category: 'Favorite movie', value: 'Jurassic Park' }, rarity: 'rare', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-07-dinosaur.png') },
  { id: 'creature-08', name: 'Ember', species: 'Golden Dragon', birthday: 'January 11', favorite: { category: 'Favorite food', value: 'pepper 🌶️' }, rarity: 'legendary', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-08-dragon-legendary.png') },

  // 🐕 Dogs
  { id: 'dogs-01', name: 'Blizzard', species: 'Husky', birthday: 'February 11', favorite: { category: 'Favorite activity', value: 'pulling sleds' }, rarity: 'common', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-01-husky.png') },
  { id: 'dogs-02', name: 'Chubs', species: 'Pug', birthday: 'July 29', favorite: { category: 'Favorite nap spot', value: 'sunny window' }, rarity: 'common', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-02-pug.png') },
  { id: 'dogs-03', name: 'Dot', species: 'Dalmatian', birthday: 'May 17', favorite: { category: 'Favorite movie', value: '101 Dalmatians' }, rarity: 'common', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-03-dalmatian.png') },
  { id: 'dogs-04', name: 'Barkley', species: 'St. Bernard', birthday: 'January 7', favorite: { category: 'Favorite snack', value: 'cheese chunks' }, rarity: 'common', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-04-stbernard.png') },
  { id: 'dogs-05', name: 'Mars', species: 'Toy Poodle', birthday: 'August 20', favorite: { category: 'Favorite game', value: 'zoomies' }, rarity: 'common', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-05-poodle.png') },
  { id: 'dogs-06', name: 'Winnie', species: 'Golden Retriever', birthday: 'December 20', favorite: { category: 'Favorite game', value: 'fetch the stick' }, rarity: 'rare', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-06-golden.png') },
  { id: 'dogs-07', name: 'Griffey', species: 'Border Collie', birthday: 'January 13', favorite: { category: 'Favorite activity', value: 'herding squirrels' }, rarity: 'rare', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-07-collie.png') },
  { id: 'dogs-08', name: 'Duke', species: 'Boxer', birthday: 'January 20', favorite: { category: 'Favorite thing', value: 'being a very good boy' }, rarity: 'legendary', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-08-boxer-legendary.png') },

  // 🍎 Fruit
  { id: 'fruit-01', name: 'Berry', species: 'Strawberry', birthday: 'June 2', favorite: { category: 'Favorite movie', value: 'Strawberry Shortcake' }, rarity: 'common', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-01-strawberry.png') },
  { id: 'fruit-02', name: 'Red', species: 'Apple', birthday: 'September 15', favorite: { category: 'Favorite game', value: 'apple-bobbing' }, rarity: 'common', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-02-apple.png') },
  { id: 'fruit-03', name: 'Chip', species: 'Banana', birthday: 'August 27', favorite: { category: 'Favorite dance', value: 'the banana split' }, rarity: 'common', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-03-banana.png') },
  { id: 'fruit-04', name: 'Tangie', species: 'Orange', birthday: 'November 2', favorite: { category: 'Favorite song', value: 'Watermelon Sugar' }, rarity: 'common', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-04-orange.png') },
  { id: 'fruit-05', name: 'Vine', species: 'Grape', birthday: 'September 8', favorite: { category: 'Favorite activity', value: 'swinging on vines' }, rarity: 'common', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-05-grape.png') },
  { id: 'fruit-06', name: 'Juicy', species: 'Watermelon', birthday: 'July 4', favorite: { category: 'Favorite ice cream', value: 'watermelon sorbet' }, rarity: 'rare', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-06-watermelon.png') },
  { id: 'fruit-07', name: 'Spike', species: 'Pineapple', birthday: 'August 15', favorite: { category: 'Favorite movie', value: 'SpongeBob' }, rarity: 'rare', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-07-pineapple.png') },
  { id: 'fruit-08', name: 'Scales', species: 'Dragon Fruit', birthday: 'May 5', favorite: { category: 'Favorite activity', value: 'breathing fruit-fire' }, rarity: 'legendary', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-08-dragonfruit-legendary.png') },

  // 🐠 Sea Creatures
  { id: 'sea-01', name: 'Bubbles', species: 'Goldfish', birthday: 'April 5', favorite: { category: 'Favorite song', value: 'Baby Shark' }, rarity: 'common', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-01-goldfish.png') },
  { id: 'sea-02', name: 'Puffy', species: 'Pufferfish', birthday: 'September 28', favorite: { category: 'Favorite activity', value: 'puffing up when scared' }, rarity: 'common', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-02-pufferfish.png') },
  { id: 'sea-03', name: 'Inky', species: 'Octopus', birthday: 'October 8', favorite: { category: 'Favorite game', value: '8-arm patty-cake' }, rarity: 'common', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-03-octopus.png') },
  { id: 'sea-04', name: 'Pinch', species: 'Crab', birthday: 'June 21', favorite: { category: 'Favorite dance', value: 'the sideways shuffle' }, rarity: 'common', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-04-crab.png') },
  { id: 'sea-05', name: 'Patrick', species: 'Starfish', birthday: 'July 18', favorite: { category: 'Favorite movie', value: 'SpongeBob' }, rarity: 'common', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-05-starfish.png') },
  { id: 'sea-06', name: 'Chomps', species: 'Shark', birthday: 'August 7', favorite: { category: 'Favorite movie', value: 'Jaws' }, rarity: 'rare', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-06-shark.png') },
  { id: 'sea-07', name: 'Cotton Candy', species: 'Seahorse', birthday: 'March 3', favorite: { category: 'Favorite ice cream', value: 'cotton candy' }, rarity: 'rare', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-07-seahorse.png') },
  { id: 'sea-08', name: 'Pearl', species: 'Narwhal', birthday: 'January 17', favorite: { category: 'Favorite activity', value: 'spinning her magic horn' }, rarity: 'legendary', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-08-narwhal-legendary.png') },

  // ═══════════════════════════════════════════
  // 💎 BEYOND-LEGENDARY VAULT (VIP ONLY) — 40 exclusives
  // Chrome/Crystal/Shadow = variants of each shelf's legendary
  // Mythic = unique new "shelf lord" character
  // ═══════════════════════════════════════════

  // 🌈 Rainbow Vault
  { id: 'rainbow-09', name: 'Mirror', species: 'Chrome Galaxy Rainbow', birthday: 'March 15', favorite: { category: 'Favorite activity', value: 'catching reflections' }, rarity: 'chrome', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-09-chrome-mirror.png') },
  { id: 'rainbow-10', name: 'Prisma', species: 'Crystal Galaxy Rainbow', birthday: 'November 7', favorite: { category: 'Favorite movie', value: 'Into the Spider-Verse' }, rarity: 'crystal', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-10-crystal-prisma.png') },
  { id: 'rainbow-11', name: 'Eclipse', species: 'Shadow Galaxy Rainbow', birthday: 'August 21', favorite: { category: 'Favorite song', value: 'Bad Guy' }, rarity: 'shadow', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-11-shadow-eclipse.png') },
  { id: 'rainbow-12', name: 'Aurora', species: 'Rainbow Phoenix', birthday: 'December 1', favorite: { category: 'Favorite activity', value: 'painting the sky' }, rarity: 'mythic', shelf: 'rainbow', image: require('./assets/images/squishies/rainbow/rainbow-12-mythic-aurora.png') },

  // ✨ Glitter Vault
  { id: 'glitter-09', name: 'Platinum', species: 'Chrome Diamond', birthday: 'January 29', favorite: { category: 'Favorite drink', value: 'liquid gold' }, rarity: 'chrome', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-09-chrome-platinum.png') },
  { id: 'glitter-10', name: 'Quartz', species: 'Crystal Diamond', birthday: 'April 22', favorite: { category: 'Favorite game', value: 'Minecraft' }, rarity: 'crystal', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-10-crystal-quartz.png') },
  { id: 'glitter-11', name: 'Onyx', species: 'Shadow Diamond', birthday: 'October 20', favorite: { category: 'Favorite movie', value: 'The Nightmare Before Christmas' }, rarity: 'shadow', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-11-shadow-onyx.png') },
  { id: 'glitter-12', name: 'Stardust', species: 'Comet', birthday: 'August 12', favorite: { category: 'Favorite activity', value: 'wishing on herself' }, rarity: 'mythic', shelf: 'glitter', image: require('./assets/images/squishies/glitter/glitter-12-mythic-stardust.png') },

  // 🎃 Halloween Vault
  { id: 'halloween-09', name: 'Silver', species: 'Chrome Spirit', birthday: 'November 1', favorite: { category: 'Favorite dance', value: 'the moonwalk' }, rarity: 'chrome', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-09-chrome-silver.png') },
  { id: 'halloween-10', name: 'Phantom', species: 'Crystal Spirit', birthday: 'October 23', favorite: { category: 'Favorite game', value: 'hide and seek' }, rarity: 'crystal', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-10-crystal-phantom.png') },
  { id: 'halloween-11', name: 'Midnight', species: 'Shadow Spirit', birthday: 'October 1', favorite: { category: 'Favorite song', value: 'Thriller' }, rarity: 'shadow', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-11-shadow-midnight.png') },
  { id: 'halloween-12', name: 'Grimm', species: 'Reaper Pup', birthday: 'October 25', favorite: { category: 'Favorite snack', value: 'candy corn soup' }, rarity: 'mythic', shelf: 'halloween', image: require('./assets/images/squishies/halloween/halloween-12-mythic-grimm.png') },

  // 🎄 Christmas Vault
  { id: 'christmas-09', name: 'Stellar', species: 'Chrome Lights', birthday: 'December 11', favorite: { category: 'Favorite song', value: 'Let It Snow' }, rarity: 'chrome', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-09-chrome-tinsel.png') },
  { id: 'christmas-10', name: 'Icicle', species: 'Crystal Lights', birthday: 'December 1', favorite: { category: 'Favorite activity', value: 'making snow angels' }, rarity: 'crystal', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-10-crystal-icicle.png') },
  { id: 'christmas-11', name: 'Krampus', species: 'Shadow Lights', birthday: 'December 6', favorite: { category: 'Favorite movie', value: 'The Grinch' }, rarity: 'shadow', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-11-shadow-krampus.png') },
  { id: 'christmas-12', name: 'Yeti', species: 'Snow Guardian', birthday: 'December 22', favorite: { category: 'Favorite activity', value: 'avalanche surfing' }, rarity: 'mythic', shelf: 'christmas', image: require('./assets/images/squishies/christmas/christmas-12-mythic-yeti.png') },

  // 🌸 Floral Vault
  { id: 'floral-09', name: 'Platinum Petal', species: 'Chrome Lotus', birthday: 'April 1', favorite: { category: 'Favorite activity', value: 'catching sunbeams' }, rarity: 'chrome', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-09-chrome-platinum-petal.png') },
  { id: 'floral-10', name: 'Prism Bloom', species: 'Crystal Lotus', birthday: 'June 25', favorite: { category: 'Favorite song', value: 'Flowers' }, rarity: 'crystal', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-10-crystal-prism-bloom.png') },
  { id: 'floral-11', name: 'Nightshade', species: 'Shadow Lotus', birthday: 'September 30', favorite: { category: 'Favorite movie', value: 'Alice in Wonderland' }, rarity: 'shadow', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-11-shadow-nightshade.png') },
  { id: 'floral-12', name: 'Verdana', species: 'Garden Queen', birthday: 'May 1', favorite: { category: 'Favorite activity', value: 'growing wild gardens' }, rarity: 'mythic', shelf: 'floral', image: require('./assets/images/squishies/floral/floral-12-mythic-verdana.png') },

  // 🍰 Dessert Vault
  { id: 'dessert-09', name: 'Foil', species: "Chrome S'mores", birthday: 'July 11', favorite: { category: 'Favorite game', value: 'baking show' }, rarity: 'chrome', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-09-chrome-foil.png') },
  { id: 'dessert-10', name: 'Sugar Glass', species: "Crystal S'mores", birthday: 'April 18', favorite: { category: 'Favorite ice cream', value: 'cotton candy' }, rarity: 'crystal', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-10-crystal-sugar-glass.png') },
  { id: 'dessert-11', name: 'Burnt', species: "Shadow S'mores", birthday: 'October 6', favorite: { category: 'Favorite movie', value: 'Charlie and the Chocolate Factory' }, rarity: 'shadow', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-11-shadow-burnt.png') },
  { id: 'dessert-12', name: 'Confection', species: 'Dessert Queen', birthday: 'June 1', favorite: { category: 'Favorite activity', value: 'inventing new flavors' }, rarity: 'mythic', shelf: 'dessert', image: require('./assets/images/squishies/dessert/dessert-12-mythic-confection.png') },

  // 🐾 Creature Vault
  { id: 'creature-09', name: 'Chromedrake', species: 'Chrome Dragon', birthday: 'March 30', favorite: { category: 'Favorite food', value: 'silver chili' }, rarity: 'chrome', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-09-chrome-chromedrake.png') },
  { id: 'creature-10', name: 'Prismascale', species: 'Crystal Dragon', birthday: 'September 11', favorite: { category: 'Favorite song', value: 'Dragon Ball Z theme' }, rarity: 'crystal', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-10-crystal-prismascale.png') },
  { id: 'creature-11', name: 'Nightwing', species: 'Shadow Dragon', birthday: 'November 13', favorite: { category: 'Favorite movie', value: 'How to Train Your Dragon' }, rarity: 'shadow', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-11-shadow-nightwing.png') },
  { id: 'creature-12', name: 'Nessie', species: 'Lake Mystery', birthday: 'August 1', favorite: { category: 'Favorite activity', value: 'hiding in deep lakes' }, rarity: 'mythic', shelf: 'creature', image: require('./assets/images/squishies/creature/creature-12-mythic-nessie.png') },

  // 🐕 Dogs Vault
  { id: 'dogs-09', name: 'Steel', species: 'Chrome Boxer', birthday: 'June 6', favorite: { category: 'Favorite game', value: 'fetch the hammer' }, rarity: 'chrome', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-09-chrome-steel.png') },
  { id: 'dogs-10', name: 'Sparkle Duke', species: 'Crystal Boxer', birthday: 'February 20', favorite: { category: 'Favorite song', value: 'Who Let the Dogs Out' }, rarity: 'crystal', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-10-crystal-sparkle-duke.png') },
  { id: 'dogs-11', name: 'Noir', species: 'Shadow Boxer', birthday: 'November 20', favorite: { category: 'Favorite movie', value: 'Zootopia' }, rarity: 'shadow', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-11-shadow-noir.png') },
  { id: 'dogs-12', name: 'Alpha', species: 'Dire Wolf', birthday: 'January 1', favorite: { category: 'Favorite activity', value: 'howling at the moon' }, rarity: 'mythic', shelf: 'dogs', image: require('./assets/images/squishies/dogs/dogs-12-mythic-alpha.png') },

  // 🍎 Fruit Vault
  { id: 'fruit-09', name: 'Chrome Scales', species: 'Chrome Dragon Fruit', birthday: 'July 14', favorite: { category: 'Favorite drink', value: 'liquid magnesium' }, rarity: 'chrome', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-09-chrome-scales.png') },
  { id: 'fruit-10', name: 'Diamond Berry', species: 'Crystal Dragon Fruit', birthday: 'August 30', favorite: { category: 'Favorite movie', value: 'Alice in Wonderland' }, rarity: 'crystal', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-10-crystal-diamond-berry.png') },
  { id: 'fruit-11', name: 'Nightfruit', species: 'Shadow Dragon Fruit', birthday: 'October 19', favorite: { category: 'Favorite song', value: 'Blinding Lights' }, rarity: 'shadow', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-11-shadow-nightfruit.png') },
  { id: 'fruit-12', name: 'Forbidden', species: 'Golden Apple', birthday: 'September 21', favorite: { category: 'Favorite activity', value: 'tempting adventurers' }, rarity: 'mythic', shelf: 'fruit', image: require('./assets/images/squishies/fruit/fruit-12-mythic-forbidden.png') },

  // 🐠 Sea Vault
  { id: 'sea-09', name: 'Silver Horn', species: 'Chrome Narwhal', birthday: 'March 11', favorite: { category: 'Favorite activity', value: 'polishing her horn' }, rarity: 'chrome', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-09-chrome-silver-horn.png') },
  { id: 'sea-10', name: 'Prism Pearl', species: 'Crystal Narwhal', birthday: 'July 2', favorite: { category: 'Favorite song', value: 'Watermelon Sugar' }, rarity: 'crystal', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-10-crystal-prism-pearl.png') },
  { id: 'sea-11', name: 'Abyss', species: 'Shadow Narwhal', birthday: 'November 30', favorite: { category: 'Favorite movie', value: 'Finding Nemo' }, rarity: 'shadow', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-11-shadow-abyss.png') },
  { id: 'sea-12', name: 'Kraken', species: 'Deep Sea Beast', birthday: 'April 13', favorite: { category: 'Favorite activity', value: 'swallowing ships whole' }, rarity: 'mythic', shelf: 'sea', image: require('./assets/images/squishies/sea/sea-12-mythic-kraken.png') },
];

export const BOX_IMAGES: Record<Shelf | 'plain' | 'vip', { closed: ImageSourcePropType; open: ImageSourcePropType }> = {
  plain: {
    closed: require('./assets/images/boxes/box-plain-brown-closed.png'),
    open: require('./assets/images/boxes/box-plain-brown-open.png'),
  },
  vip: {
    closed: require('./assets/images/boxes/box-vip-closed.png'),
    open: require('./assets/images/boxes/box-vip-open.png'),
  },
  rainbow: {
    closed: require('./assets/images/boxes/box-rainbow-closed.png'),
    open: require('./assets/images/boxes/box-rainbow-open.png'),
  },
  glitter: {
    closed: require('./assets/images/boxes/box-glitter-closed.png'),
    open: require('./assets/images/boxes/box-glitter-open.png'),
  },
  halloween: {
    closed: require('./assets/images/boxes/box-halloween-closed.png'),
    open: require('./assets/images/boxes/box-halloween-open.png'),
  },
  christmas: {
    closed: require('./assets/images/boxes/box-christmas-closed.png'),
    open: require('./assets/images/boxes/box-christmas-open.png'),
  },
  floral: {
    closed: require('./assets/images/boxes/box-floral-closed.png'),
    open: require('./assets/images/boxes/box-floral-open.png'),
  },
  dessert: {
    closed: require('./assets/images/boxes/box-dessert-closed.png'),
    open: require('./assets/images/boxes/box-dessert-open.png'),
  },
  creature: {
    closed: require('./assets/images/boxes/box-creature-closed.png'),
    open: require('./assets/images/boxes/box-creature-open.png'),
  },
  dogs: {
    closed: require('./assets/images/boxes/box-dogs-closed.png'),
    open: require('./assets/images/boxes/box-dogs-open.png'),
  },
  fruit: {
    closed: require('./assets/images/boxes/box-fruit-closed.png'),
    open: require('./assets/images/boxes/box-fruit-open.png'),
  },
  sea: {
    closed: require('./assets/images/boxes/box-sea-closed.png'),
    open: require('./assets/images/boxes/box-sea-open.png'),
  },
};

// Picks the right box for a squishy — VIP box for Beyond-Legendary pulls,
// shelf-themed box otherwise.
export function boxForSquishy(squishy: Squishy): { closed: ImageSourcePropType; open: ImageSourcePropType } {
  if (isBeyondLegendary(squishy.rarity)) {
    return BOX_IMAGES.vip;
  }
  return BOX_IMAGES[squishy.shelf];
}
