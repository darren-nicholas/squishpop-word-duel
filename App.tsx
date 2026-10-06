import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard as RNKeyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useFonts,
  Fredoka_400Regular,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import englishWords from 'an-array-of-english-words';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { aiValidate, AiValidation } from './aiValidate';
import {
  SQUISHIES,
  SHELVES,
  BOX_IMAGES,
  boxForSquishy,
  isBeyondLegendary,
  type Squishy,
  type Rarity,
  type Shelf,
} from './squishies';
import { SCREEN_GRADIENTS, BUBBLE_COLORS } from './theme';
import {
  AVATARS,
  AVATAR_SECTIONS,
  getAvatar,
  getAvatarPalette,
  type Avatar,
} from './avatars';
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  createProfile,
  awardSquishiesToProfile,
  recordMatchForProfile,
  uniqueSquishyIds,
  duplicateCount,
  sellOneDuplicate,
  spendCoins,
  addCoins,
  coinValueFor,
  getAdWatchesToday,
  canWatchAd,
  recordAdWatch,
  AD_DAILY_LIMIT,
  INTERSTITIAL_GRACE_PUZZLES,
  INTERSTITIAL_EVERY_N_PUZZLES,
  INTERSTITIAL_MIN_ROUND_MS,
  type Profile,
} from './profiles';
import { watchAdForReward, showInterstitial, COINS_PER_AD } from './rewardedAdService';
import { haptics } from './haptics';

const FONT_REGULAR = 'Fredoka_400Regular';
const FONT_SEMIBOLD = 'Fredoka_600SemiBold';
const FONT_BOLD = 'Fredoka_700Bold';

const BRAND = {
  cardboard: '#B9865F',
  cardboardDark: '#8B5E3B',
  auraYellow: '#F5C842',
  auraYellowSoft: '#FFECA8',
  outlineDark: '#1a1613',
  cream: '#FFF8EA',
  pink: '#F8B4C4',
  mint: '#B4E8D0',
  lavender: '#D4C4F0',
};

const MAX_WRONG = 6;
const MAX_CONSECUTIVE = 3;
const ROUNDS_TO_WIN_MATCH = 5;
const SOLO_WINS_PER_SQUISHY = 3;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const DICTIONARY = new Set(englishWords);

// Squishy types + SQUISHIES array + BOX_IMAGES now imported from ./squishies

function pickFromRarity(tier: Rarity): Squishy {
  const pool = SQUISHIES.filter((s) => s.rarity === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

function weightedRandomSquishy(weights: {
  common: number;
  rare: number;
  legendary: number;
  chrome?: number;
  crystal?: number;
  shadow?: number;
  mythic?: number;
}): Squishy {
  const w = {
    common: weights.common,
    rare: weights.rare,
    legendary: weights.legendary,
    chrome: weights.chrome ?? 0,
    crystal: weights.crystal ?? 0,
    shadow: weights.shadow ?? 0,
    mythic: weights.mythic ?? 0,
  };
  const total = w.common + w.rare + w.legendary + w.chrome + w.crystal + w.shadow + w.mythic;
  const roll = Math.random() * total;
  let acc = 0;
  acc += w.common;    if (roll < acc) return pickFromRarity('common');
  acc += w.rare;      if (roll < acc) return pickFromRarity('rare');
  acc += w.legendary; if (roll < acc) return pickFromRarity('legendary');
  acc += w.chrome;    if (roll < acc) return pickFromRarity('chrome');
  acc += w.crystal;   if (roll < acc) return pickFromRarity('crystal');
  acc += w.shadow;    if (roll < acc) return pickFromRarity('shadow');
  return pickFromRarity('mythic');
}

function randomSquishy(isVip: boolean = false): Squishy {
  if (isVip) {
    // VIP round-win odds: BL tiers tiny but present (Mythic half-rate)
    return weightedRandomSquishy({
      common: 78, rare: 15, legendary: 5,
      chrome: 0.6, crystal: 0.6, shadow: 0.6, mythic: 0.3,
    });
  }
  // Free round-win odds: 85 / 13 / 2
  return weightedRandomSquishy({ common: 85, rare: 13, legendary: 2 });
}

function bonusSquishy(isVip: boolean = false): Squishy {
  if (isVip) {
    // VIP match-win bonus: better odds for legendaries, small BL chance
    return weightedRandomSquishy({
      common: 35, rare: 48, legendary: 13,
      chrome: 1.2, crystal: 1.2, shadow: 1.2, mythic: 0.4,
    });
  }
  // Free: 40 / 50 / 10
  return weightedRandomSquishy({ common: 40, rare: 50, legendary: 10 });
}

function rarityBadge(rarity: Rarity): string {
  if (rarity === 'legendary') return '🏆 LEGENDARY';
  if (rarity === 'rare') return '🥈 RARE';
  return 'COMMON';
}

function rarityColor(rarity: Rarity): string {
  if (rarity === 'legendary') return '#B8863D';
  if (rarity === 'rare') return '#8A4A9C';
  return '#B5B5B5';
}

type Category = {
  id: string;
  emoji: string;
  name: string;
  words: string[];
};

const WORD_BANK: Category[] = [
  {
    id: 'animals',
    emoji: '🐾',
    name: 'Animals',
    words: [
      // original 50
      'PANDA','GIRAFFE','PENGUIN','OCTOPUS','DOLPHIN','KANGAROO','BUMBLEBEE','FLAMINGO','HAMSTER','ELEPHANT',
      'GOLDFISH','PEACOCK','CHIPMUNK','HEDGEHOG','ZEBRA','TIGER','LION','MONKEY','GORILLA','RABBIT',
      'SQUIRREL','RACCOON','SLOTH','KOALA','CHEETAH','LEOPARD','HIPPO','CROCODILE','ALLIGATOR','TURTLE',
      'LIZARD','SNAKE','FROG','BUTTERFLY','LADYBUG','DRAGONFLY','CATERPILLAR','SPIDER','OWL','EAGLE',
      'PARROT','SEAHORSE','STARFISH','JELLYFISH','WHALE','SHARK','WALRUS','OTTER','BEAVER','MOOSE',
      // +100 new
      'HORSE','COW','PIG','SHEEP','GOAT','DUCK','CHICKEN','TURKEY','GOOSE','SWAN',
      'HAWK','FALCON','CROW','RAVEN','PIGEON','SPARROW','ROBIN','CARDINAL','BLUEBIRD','HUMMINGBIRD',
      'WOODPECKER','TOUCAN','OSTRICH','EMU','KIWI','BAT','MOUSE','RAT','FERRET','CHINCHILLA',
      'SKUNK','OPOSSUM','BADGER','ANTEATER','ARMADILLO','PORCUPINE','HYENA','MEERKAT','LEMUR','BABOON',
      'ORANGUTAN','CHIMPANZEE','BISON','BUFFALO','YAK','RHINO','GAZELLE','ANTELOPE','DEER','ELK',
      'REINDEER','LLAMA','ALPACA','CAMEL','DONKEY','FOX','WOLF','COYOTE','LYNX','BOBCAT',
      'PANTHER','JAGUAR','PUMA','CRAB','LOBSTER','SHRIMP','SNAIL','EEL','STINGRAY','SWORDFISH',
      'TUNA','SALMON','PUFFERFISH','SQUID','URCHIN','SEAL','SEA LION','ORCA','NARWHAL','BELUGA',
      'HUMPBACK','GRASSHOPPER','CRICKET','BEETLE','FIREFLY','SCORPION','TARANTULA','CENTIPEDE','MILLIPEDE','WORM',
      'PLATYPUS','WOMBAT','DINGO','QUOKKA','MANATEE','OCELOT','MONGOOSE','CAPYBARA','RED PANDA','AXOLOTL',
    ],
  },
  {
    id: 'food',
    emoji: '🍕',
    name: 'Food & Drinks',
    words: [
      // original 50
      'PIZZA','SUSHI','SPAGHETTI','HAMBURGER','PANCAKES','STRAWBERRY','WATERMELON','ICE CREAM','CHOCOLATE CAKE','GRILLED CHEESE',
      'MACARONI','DUMPLINGS','TACOS','SMOOTHIE','CUPCAKE','HOT DOG','BURRITO','QUESADILLA','CHICKEN NUGGETS','FRENCH FRIES',
      'ONION RINGS','MEATBALLS','LASAGNA','RAVIOLI','BAGEL','DONUT','MUFFIN','CROISSANT','WAFFLES','CEREAL',
      'OATMEAL','YOGURT','MILKSHAKE','LEMONADE','ORANGE JUICE','HOT CHOCOLATE','BUBBLE TEA','POPSICLE','COOKIES','BROWNIE',
      'CHEESECAKE','APPLE PIE','BANANA','PINEAPPLE','BLUEBERRIES','RASPBERRY','MANGO','AVOCADO','PRETZEL','POPCORN',
      // +100 new
      'APPLE JUICE','GRAPE JUICE','MILK','CHOCOLATE MILK','SODA','ICED TEA','SMOOTHIE BOWL','FRUIT SALAD','GARDEN SALAD','CAESAR SALAD',
      'POTATO SALAD','PBJ','CLUB SANDWICH','TURKEY SANDWICH','BLT','CORN DOG','FISH AND CHIPS','LOBSTER ROLL','FRIED CHICKEN','BUFFALO WINGS',
      'RIBS','STEAK','MEATLOAF','POT PIE','SPRING ROLLS','EGG ROLLS','FRIED RICE','LO MEIN','MISO SOUP','RAMEN',
      'PHO','CHICKEN SOUP','TOMATO SOUP','CORN ON THE COB','MASHED POTATOES','BAKED POTATO','SWEET POTATO','TATER TOTS','HASH BROWNS','SCRAMBLED EGGS',
      'OMELETTE','FRENCH TOAST','BREAKFAST BURRITO','GRANOLA','TRAIL MIX','GOLDFISH CRACKERS','CHIPS','SALSA','GUACAMOLE','NACHOS',
      'HUMMUS','GARLIC BREAD','MOZZARELLA STICKS','CARROTS','BROCCOLI','GREEN BEANS','PEAS','LETTUCE','SPINACH','TOMATO',
      'CUCUMBER','BELL PEPPER','MUSHROOMS','CHOCOLATE CHIP COOKIE','SUGAR COOKIE','CINNAMON ROLL','ECLAIR','TIRAMISU','MACARON','CANNOLI',
      'FROYO','SORBET','GELATO','SUNDAE','BANANA SPLIT','ROOT BEER FLOAT','ICED COFFEE','HOT TEA','APPLE','ORANGE',
      'PEACH','PEAR','PLUM','CHERRY','GRAPES','KIWI FRUIT','PAPAYA','COCONUT','FIG','LIME',
      'LEMON','POMEGRANATE','DRAGON FRUIT','RANCH','KETCHUP','MUSTARD','MAYO','BBQ SAUCE','SRIRACHA','SOY SAUCE',
    ],
  },
  {
    id: 'shows',
    emoji: '🎬',
    name: 'Movies & Shows',
    words: [
      // original 50
      'MINECRAFT','SPONGEBOB','DOGMAN','FROZEN','MOANA','ENCANTO','TOY STORY','BLUEY','ROBLOX','TAYLOR SWIFT',
      'MARIO KART','STITCH','RATATOUILLE','CARS','PETER PAN','FINDING NEMO','INSIDE OUT','LION KING','ALADDIN','TANGLED',
      'BRAVE','BAMBI','DUMBO','CINDERELLA','BEAUTY AND THE BEAST','LITTLE MERMAID','SNOW WHITE','MULAN','POCAHONTAS','ZOOTOPIA',
      'UP','COCO','SOUL','LUCA','TURNING RED','ELEMENTAL','KUNG FU PANDA','MADAGASCAR','SHREK','HOW TO TRAIN YOUR DRAGON',
      'DESPICABLE ME','MINIONS','SING','TROLLS','PAW PATROL','OCTONAUTS','SESAME STREET','POKEMON','SONIC','HARRY POTTER',
      // +100 new
      'STAR WARS','AVENGERS','SPIDERMAN','BATMAN','SUPERMAN','WONDER WOMAN','BLACK PANTHER','IRON MAN','THOR','CAPTAIN AMERICA',
      'HULK','BARBIE','WICKED','HAMILTON','MARY POPPINS','WIZARD OF OZ','MATILDA','CHARLIE AND THE CHOCOLATE FACTORY','PRINCESS BRIDE','GOONIES',
      'HOME ALONE','ELF','POLAR EXPRESS','GRINCH','CHARLIE BROWN','RUDOLPH','MIRACLE ON 34TH STREET','NIGHTMARE BEFORE CHRISTMAS','HOCUS POCUS','ADDAMS FAMILY',
      'MONSTERS INC','WALL E','RATATOUILLE','INCREDIBLES','FINDING DORY','ONWARD','LIGHTYEAR','BUZZ LIGHTYEAR','WOODY','MIKE WAZOWSKI',
      'MR BEAST','RYANS WORLD','PEPPA PIG','PJ MASKS','DANIEL TIGER','DORA','CURIOUS GEORGE','WILD KRATTS','MAGIC SCHOOL BUS','BERENSTAIN BEARS',
      'ARTHUR','WILD THORNBERRYS','RUGRATS','HEY ARNOLD','RUBBLE AND CREW','GABBYS DOLLHOUSE','MIRACULOUS LADYBUG','MY LITTLE PONY','SHOPKINS','LOL SURPRISE',
      'MONSTER HIGH','AMERICAN GIRL','HELLO KITTY','KUROMI','CINNAMOROLL','PUSHEEN','SQUISHMALLOWS','MULTIVERSUS','FORTNITE','AMONG US',
      'FALL GUYS','ANIMAL CROSSING','ZELDA','LINK','PRINCESS PEACH','MARIO','LUIGI','YOSHI','BOWSER','KIRBY',
      'KIRBYS DREAM LAND','PACMAN','DONKEY KONG','SPLATOON','STAR FOX','METROID','SMASH BROS','RING FIT','STRANGER THINGS','WEDNESDAY',
      'HARRY STYLES','OLIVIA RODRIGO','ARIANA GRANDE','BILLIE EILISH','DUA LIPA','BTS','TWICE','BLACKPINK','ED SHEERAN','BRUNO MARS',
    ],
  },
  {
    id: 'sports',
    emoji: '🏀',
    name: 'Sports',
    words: [
      // original 50
      'SOCCER','BASKETBALL','GYMNASTICS','SKATEBOARD','SWIMMING','VOLLEYBALL','FOOTBALL','BASEBALL','HOCKEY','TENNIS',
      'DANCING','CYCLING','SKIING','SURFING','KARATE','TAEKWONDO','JUDO','WRESTLING','BOXING','GOLF',
      'BOWLING','PING PONG','BADMINTON','SOFTBALL','CRICKET','RUGBY','LACROSSE','ROWING','SAILING','KAYAKING',
      'CANOEING','SNOWBOARDING','ICE SKATING','ROLLER SKATING','SKIPPING ROPE','HOPSCOTCH','KICKBALL','DODGEBALL','TRACK AND FIELD','MARATHON',
      'HURDLES','HIGH JUMP','LONG JUMP','POLE VAULT','ARCHERY','FENCING','HORSEBACK RIDING','CHEERLEADING','TRAMPOLINE','ROCK CLIMBING',
      // +100 new
      'BALLET','TAP DANCE','HIP HOP DANCE','JAZZ DANCE','CONTEMPORARY DANCE','CROSSFIT','YOGA','PILATES','ZUMBA','AEROBICS',
      'WEIGHTLIFTING','PARKOUR','MOUNTAIN BIKING','BMX','UNICYCLING','RIP STICK','SKATE PARK','SKATE RAMP','HALF PIPE','SKATEBOARDING TRICKS',
      'OLLIE','KICKFLIP','FRONTSIDE','BACKSIDE','SNOWBOARDING','SLALOM','DOWNHILL SKIING','CROSS COUNTRY','SLEDDING','TOBOGGAN',
      'FOUR SQUARE','TETHERBALL','JUMP ROPE','DOUBLE DUTCH','TAG','FREEZE TAG','MANHUNT','CAPTURE THE FLAG','SIMON SAYS','DUCK DUCK GOOSE',
      'MUSICAL CHAIRS','RED LIGHT GREEN LIGHT','LIMBO','TUG OF WAY','OBSTACLE COURSE','RELAY RACE','SPRINT','DISCUS','SHOT PUT','JAVELIN',
      'PICKLEBALL','RACQUETBALL','SQUASH','HANDBALL','WATER POLO','DIVING','SYNCHRONIZED SWIMMING','WATERSKIING','WAKEBOARDING','PADDLEBOARDING',
      'KITESURFING','WINDSURFING','SCUBA DIVING','SNORKELING','FISHING','ICE FISHING','HUNTING','BIATHLON','TRIATHLON','PENTATHLON',
      'DECATHLON','FIGURE SKATING','SPEED SKATING','LUGE','BOBSLED','SKELETON','CURLING','TABLE TENNIS','FOOSBALL','AIR HOCKEY',
      'POOL','BILLIARDS','DARTS','CORNHOLE','HORSESHOES','FRISBEE','ULTIMATE FRISBEE','DISC GOLF','MINI GOLF','GO KARTING',
      'DRAG RACING','MONSTER TRUCKS','NASCAR','FORMULA ONE','AUTO RACING','MOTOCROSS','SURFBOARDING','DIRT BIKING','ATV RIDING','SNOWMOBILING',
    ],
  },
  {
    id: 'places',
    emoji: '🏖️',
    name: 'Places',
    words: [
      // original 50
      'CALIFORNIA','DISNEYLAND','GRAND CANYON','PARIS','NEW YORK','HAWAII','ANTARCTICA','MOUNTAIN','BEACH','LIBRARY',
      'AQUARIUM','PLAYGROUND','FARM','LAKE','JUNGLE','DESERT','FOREST','ISLAND','VOLCANO','WATERFALL',
      'RAINFOREST','SAVANNA','CORAL REEF','GLACIER','CANYON','CAVE','TUNDRA','SEATTLE','CHICAGO','BOSTON',
      'LOS ANGELES','MIAMI','ORLANDO','LAS VEGAS','DENVER','LONDON','ROME','TOKYO','SYDNEY','EGYPT',
      'CHINA','INDIA','BRAZIL','MEXICO','CANADA','ZOO','MUSEUM','CAMPGROUND','CARNIVAL','SKATE PARK',
      // +100 new
      'DISNEY WORLD','UNIVERSAL STUDIOS','SIX FLAGS','LEGOLAND','SEA WORLD','BUSCH GARDENS','YELLOWSTONE','YOSEMITE','NIAGARA FALLS','MOUNT RUSHMORE',
      'STATUE OF LIBERTY','GOLDEN GATE BRIDGE','WHITE HOUSE','CAPITOL BUILDING','TIMES SQUARE','CENTRAL PARK','BROADWAY','WRIGLEY FIELD','FENWAY PARK','HOLLYWOOD',
      'MALIBU','VENICE BEACH','SANTA MONICA','MIAMI BEACH','KEY WEST','MARTHAS VINEYARD','CAPE COD','NEW ORLEANS','NASHVILLE','AUSTIN',
      'PHILADELPHIA','ATLANTA','PHOENIX','PORTLAND','MINNEAPOLIS','HOUSTON','DALLAS','SAN DIEGO','SAN FRANCISCO','ANCHORAGE',
      'PARIS','EIFFEL TOWER','LOUVRE','VERSAILLES','AMSTERDAM','BARCELONA','MADRID','VENICE','FLORENCE','MILAN',
      'VATICAN','ATHENS','DUBAI','ISTANBUL','MOSCOW','ST PETERSBURG','BERLIN','MUNICH','VIENNA','PRAGUE',
      'EDINBURGH','DUBLIN','BRUSSELS','LISBON','REYKJAVIK','HELSINKI','STOCKHOLM','OSLO','COPENHAGEN','ZURICH',
      'TORONTO','MONTREAL','VANCOUVER','MEXICO CITY','RIO DE JANEIRO','BUENOS AIRES','LIMA','MACHU PICCHU','CUBA','JAMAICA',
      'BAHAMAS','ARUBA','PUERTO RICO','BALI','PHUKET','SINGAPORE','SEOUL','KYOTO','BEIJING','HONG KONG',
      'ARCADE','BOWLING ALLEY','MOVIE THEATER','ICE RINK','ROLLER RINK','SKI RESORT','SURF BEACH','WATER PARK','AMUSEMENT PARK','FAIR',
    ],
  },
  {
    id: 'seasonal',
    emoji: '🎃',
    name: 'Halloween',
    words: [
      // original 50
      'PUMPKIN','HALLOWEEN','GHOST','SKELETON','WITCH','VAMPIRE','CANDY','COSTUME','HAUNTED HOUSE','SPIDER WEB',
      'BLACK CAT','BAT','MUMMY','ZOMBIE','TRICK OR TREAT','JACK O LANTERN','SCARECROW','CAULDRON','WIZARD','WARLOCK',
      'GOBLIN','GHOUL','WEREWOLF','FRANKENSTEIN','DRACULA','BROOMSTICK','SPELL BOOK','POTION','CRYSTAL BALL','TOMBSTONE',
      'GRAVEYARD','COBWEB','OWL','CROW','RAVEN','BONES','SPIDER','SPOOKY','HAUNTED','CREEPY',
      'MONSTER','MASK','GARGOYLE','FACE PAINT','FULL MOON','CORN MAZE','HAY RIDE','APPLE CIDER','CARAMEL APPLE','CANDY CORN',
      // +50 new
      'JACK SKELLINGTON','SALLY','OOGIE BOOGIE','CASPER','SCOOBY DOO','VELMA','MINIONS COSTUME','SUPERHERO COSTUME','PRINCESS COSTUME','PIRATE COSTUME',
      'FAIRY COSTUME','NINJA COSTUME','POLICE OFFICER','FIREFIGHTER COSTUME','DOCTOR COSTUME','CHEF COSTUME','ASTRONAUT COSTUME','DINOSAUR COSTUME','UNICORN COSTUME','DRAGON COSTUME',
      'ZOMBIE COSTUME','WEREWOLF COSTUME','VAMPIRE COSTUME','WITCH HAT','WIZARD HAT','MAGIC WAND','PITCHFORK','DEVIL HORNS','ANGEL WINGS','BUNNY EARS',
      'FACE PAINT','GLOW STICKS','FLASHLIGHT','PILLOWCASE','TRICK','TREAT','CANDY BUCKET','HARVEST MOON','AUTUMN LEAVES','PUMPKIN SPICE',
      'PUMPKIN CARVING','APPLE PICKING','HAUNTED HAYRIDE','SPOOKY STORY','GHOST STORY','MONSTER MASH','THRILLER','ADDAMS FAMILY','MUNSTERS','GHOSTBUSTERS',
    ],
  },
  {
    id: 'jobs',
    emoji: '💼',
    name: 'Jobs & Careers',
    words: [
      'TEACHER','DOCTOR','NURSE','FIREFIGHTER','POLICE OFFICER','VETERINARIAN','DENTIST','ARCHITECT','ENGINEER','SCIENTIST',
      'ASTRONAUT','PILOT','FLIGHT ATTENDANT','TRAIN CONDUCTOR','TAXI DRIVER','TRUCK DRIVER','DELIVERY DRIVER','MAIL CARRIER','FARMER','RANCHER',
      'CHEF','BAKER','WAITER','BARTENDER','BARISTA','ICE CREAM SCOOPER','SHOP KEEPER','CASHIER','MANAGER','SALESPERSON',
      'ARTIST','PAINTER','SCULPTOR','PHOTOGRAPHER','VIDEOGRAPHER','DIRECTOR','ACTOR','ACTRESS','DANCER','MUSICIAN',
      'SINGER','SONGWRITER','PRODUCER','DJ','RAPPER','WRITER','AUTHOR','POET','JOURNALIST','REPORTER',
      'NEWS ANCHOR','LAWYER','JUDGE','DETECTIVE','PRIVATE INVESTIGATOR','FBI AGENT','SECRET AGENT','SPY','SOLDIER','SAILOR',
      'MARINE','GENERAL','ADMIRAL','PRESIDENT','GOVERNOR','MAYOR','SENATOR','AMBASSADOR','DIPLOMAT','PRINCESS',
      'PRINCE','QUEEN','KING','KNIGHT','EXPLORER','ADVENTURER','ARCHAEOLOGIST','PALEONTOLOGIST','MARINE BIOLOGIST','BOTANIST',
      'CHEMIST','PHYSICIST','MATHEMATICIAN','PROGRAMMER','GAME DEVELOPER','YOUTUBER','TIKTOKER','INFLUENCER','STREAMER','PODCASTER',
      'BLOGGER','ILLUSTRATOR','ANIMATOR','GRAPHIC DESIGNER','FASHION DESIGNER','MODEL','HAIR STYLIST','MAKEUP ARTIST','TATTOO ARTIST','MASSAGE THERAPIST',
    ],
  },
  {
    id: 'nature',
    emoji: '🌿',
    name: 'Nature',
    words: [
      'TREE','FLOWER','GRASS','BUSH','SHRUB','MOSS','FERN','VINE','IVY','MUSHROOM',
      'OAK TREE','MAPLE TREE','PINE TREE','PALM TREE','WILLOW TREE','APPLE TREE','CHERRY BLOSSOM','REDWOOD','SEQUOIA','BAMBOO',
      'ROSE','TULIP','SUNFLOWER','DAISY','LILY','ORCHID','DAFFODIL','CARNATION','HYDRANGEA','POPPY',
      'DANDELION','MARIGOLD','CHRYSANTHEMUM','PETUNIA','HIBISCUS','MAGNOLIA','WISTERIA','LAVENDER','LILAC','PEONY',
      'RIVER','CREEK','STREAM','POND','LAKE','OCEAN','SEA','WATERFALL','BAY','HARBOR',
      'ISLAND','PENINSULA','COVE','LAGOON','MARSH','SWAMP','BOG','WETLAND','DELTA','ESTUARY',
      'MOUNTAIN','HILL','CLIFF','VALLEY','PLATEAU','CANYON','GORGE','RAVINE','MESA','BUTTE',
      'DESERT','DUNE','OASIS','PRAIRIE','MEADOW','FIELD','PASTURE','GLADE','GROVE','ORCHARD',
      'FOREST','WOODS','JUNGLE','RAINFOREST','SAVANNA','TUNDRA','GLACIER','ICEBERG','VOLCANO','GEYSER',
      'ROCK','BOULDER','PEBBLE','SAND','SOIL','DIRT','CLAY','QUARTZ','AMETHYST','OBSIDIAN',
    ],
  },
  {
    id: 'weather',
    emoji: '🌦️',
    name: 'Weather & Seasons',
    words: [
      'SUNNY','CLOUDY','RAINY','SNOWY','WINDY','FOGGY','MISTY','HAZY','HUMID','DRY',
      'HOT','COLD','WARM','COOL','FREEZING','SCORCHING','MILD','CRISP','MUGGY','BALMY',
      'RAIN','DRIZZLE','DOWNPOUR','THUNDERSTORM','LIGHTNING','THUNDER','HAIL','SLEET','SNOW','BLIZZARD',
      'SNOWFLAKE','SNOWSTORM','SNOWFALL','FLURRY','ICE','FROST','SNOWMAN','SNOW ANGEL','SNOW FORT','SNOWBALL',
      'SUNSHINE','SUNRISE','SUNSET','RAINBOW','CLOUD','CUMULUS','STRATUS','CIRRUS','OVERCAST','PARTLY CLOUDY',
      'BREEZE','GUST','GALE','HURRICANE','TORNADO','TYPHOON','CYCLONE','WATERSPOUT','WHIRLWIND','DUST STORM',
      'FOG','MIST','DEW','HUMIDITY','MONSOON','DROUGHT','FLOOD','HEATWAVE','COLD SNAP','FROSTBITE',
      'SPRING','SUMMER','FALL','AUTUMN','WINTER','EQUINOX','SOLSTICE','HARVEST','APRIL SHOWERS','MAY FLOWERS',
      'SUMMER VACATION','BACK TO SCHOOL','AUTUMN LEAVES','FALLING LEAVES','PUMPKIN SEASON','HOLIDAY SEASON','WINTER WONDERLAND','SPRING BREAK','GRADUATION','SNOW DAY',
      'UMBRELLA','RAIN BOOTS','RAINCOAT','SUNGLASSES','SUNSCREEN','BEACH TOWEL','SWEATER','PARKA','MITTENS','SCARF',
    ],
  },
  {
    id: 'mixed',
    emoji: '🎲',
    name: 'Mixed',
    words: [], // populated below
  },
];

// Populate "Mixed" with all words from other categories
WORD_BANK[WORD_BANK.length - 1].words = WORD_BANK
  .slice(0, -1)
  .flatMap((c) => c.words);

function randomWordFromCategory(
  category: Category,
  avoid: string[] = []
): string {
  // Avoid recent words; keep enough variety by capping avoid to leave options
  const avoidSet = new Set(avoid);
  const available = category.words.filter((w) => !avoidSet.has(w));
  const pool = available.length > 0 ? available : category.words;
  return pool[Math.floor(Math.random() * pool.length)];
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
  return words.some((w) => PROFANITY_BLOCKLIST.has(w));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

const PROFANITY_LOWER = new Set(
  Array.from(PROFANITY_BLOCKLIST).map((w) => w.toLowerCase())
);

const DICTIONARY_BY_FIRST_LETTER: Record<string, string[]> = {};
for (const w of englishWords) {
  if (w.length < 3 || w.length > 12) continue;
  if (!/^[a-z]+$/.test(w)) continue;
  if (PROFANITY_LOWER.has(w)) continue;
  const first = w[0];
  if (!DICTIONARY_BY_FIRST_LETTER[first]) {
    DICTIONARY_BY_FIRST_LETTER[first] = [];
  }
  DICTIONARY_BY_FIRST_LETTER[first].push(w);
}

function findBestMatches(input: string, limit: number = 3): string[] {
  const lower = input.toLowerCase();
  if (lower.length < 4 || lower.length > 15) return [];

  const first = lower[0];
  const candidates = DICTIONARY_BY_FIRST_LETTER[first];
  if (!candidates) return [];

  const maxDistance = lower.length <= 6 ? 1 : 2;
  const matches: { word: string; distance: number }[] = [];

  for (const candidate of candidates) {
    if (Math.abs(candidate.length - lower.length) > maxDistance) continue;
    const d = levenshtein(lower, candidate);
    if (d > 0 && d <= maxDistance) {
      matches.push({ word: candidate, distance: d });
    }
  }

  matches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.word.length !== b.word.length) return b.word.length - a.word.length;
    return a.word.localeCompare(b.word);
  });

  return matches.slice(0, limit).map((m) => m.word.toUpperCase());
}

function suggestForPhrase(phrase: string): string[] {
  const words = phrase.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  if (words.length === 1) {
    return findBestMatches(words[0], 3);
  }

  const replacements: string[] = [];
  let anyChange = false;
  for (const w of words) {
    if (wordIsInDictionary(w)) {
      replacements.push(w);
    } else {
      const matches = findBestMatches(w, 1);
      if (matches.length > 0 && matches[0] !== w) {
        replacements.push(matches[0]);
        anyChange = true;
      } else {
        replacements.push(w);
      }
    }
  }

  return anyChange ? [replacements.join(' ')] : [];
}

type Screen =
  | 'loading'
  | 'whosPlaying'
  | 'addProfile'
  | 'start'
  | 'nameEntry'
  | 'categorySelect'
  | 'playerAEntry'
  | 'preGameHandoff'
  | 'playerBEntry'
  | 'playing'
  | 'turnPass'
  | 'blindBoxReveal'
  | 'roundEnd'
  | 'soloRoundEnd'
  | 'matchWinner'
  | 'trophyRoom';

type Player = 'A' | 'B';
type Mode = '2player' | 'solo';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  const [screen, setScreen] = useState<Screen>('loading');
  const [mode, setMode] = useState<Mode>('2player');

  // Profile system
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileAId, setProfileAId] = useState<string | null>(null);
  const [profileBId, setProfileBId] = useState<string | null>(null);
  const [profilesHydrated, setProfilesHydrated] = useState(false);
  const [splashFadingOut, setSplashFadingOut] = useState(false);

  // Rewarded + interstitial ad state
  const [adWatching, setAdWatching] = useState<null | 'coins' | 'freePull' | 'interstitial'>(null);
  const [adRewardCoins, setAdRewardCoins] = useState<number | null>(null);
  const roundStartedAtRef = useRef<number>(Date.now());

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? null;
  const profileA = profiles.find((p) => p.id === profileAId) ?? null;
  const profileB = profiles.find((p) => p.id === profileBId) ?? null;

  // Hydrate profiles on mount
  useEffect(() => {
    const splashStart = Date.now();
    (async () => {
      let loaded = await loadProfiles();
      const activeId = await loadActiveProfileId();

      // One-time collection wipe (bump the flag name to run again later)
      const RESET_FLAG = 'squishpop.collectionResetV3';
      const alreadyReset = await AsyncStorage.getItem(RESET_FLAG);
      if (!alreadyReset && loaded.length > 0) {
        loaded = loaded.map((p) => ({
          ...p,
          collection: [],
          matchesWon: 0,
          matchesPlayed: 0,
          legendariesPulled: 0,
        }));
        await saveProfiles(loaded);
        await AsyncStorage.setItem(RESET_FLAG, '1');
      }

      // Schema migration: backfill coins for older profiles that pre-date the economy
      loaded = loaded.map((p) => ({
        ...p,
        coins: typeof p.coins === 'number' ? p.coins : 25,
        isVip: typeof p.isVip === 'boolean' ? p.isVip : false,
        puzzlesPlayed: typeof p.puzzlesPlayed === 'number' ? p.puzzlesPlayed : 0,
      }));

      setProfiles(loaded);
      setActiveProfileId(activeId);
      setProfilesHydrated(true);

      // Minimum splash duration so MD Studios branding + credits register
      const MIN_SPLASH_MS = 3800;
      const FADE_OUT_MS = 600;
      const elapsed = Date.now() - splashStart;
      if (elapsed < MIN_SPLASH_MS) {
        await new Promise((r) => setTimeout(r, MIN_SPLASH_MS - elapsed));
      }

      // Trigger fade-out, then wait for it to complete before routing
      setSplashFadingOut(true);
      await new Promise((r) => setTimeout(r, FADE_OUT_MS));

      // Routing: no profiles → create one; otherwise go to home (not player picker)
      if (loaded.length === 0) {
        setScreen('addProfile');
      } else {
        // If no active profile is saved, fall back to picker; else go straight home
        if (activeId && loaded.find((p) => p.id === activeId)) {
          setScreen('start');
        } else {
          setScreen('whosPlaying');
        }
      }
    })();
  }, []);

  // Persist profiles whenever they change (after hydration)
  useEffect(() => {
    if (!profilesHydrated) return;
    saveProfiles(profiles).catch((e) => console.warn('saveProfiles', e));
  }, [profiles, profilesHydrated]);

  // Persist active profile ID
  useEffect(() => {
    if (!profilesHydrated) return;
    saveActiveProfileId(activeProfileId).catch((e) =>
      console.warn('saveActiveProfileId', e)
    );
  }, [activeProfileId, profilesHydrated]);

  // Where to return after creating a new profile ('start' = make it active; 'nameEntry' = use as player B)
  const [addProfileReturnTo, setAddProfileReturnTo] = useState<
    'start' | 'nameEntry'
  >('start');

  function updateProfile(id: string, mutator: (p: Profile) => Profile) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? mutator(p) : p)));
  }

  function addProfile(name: string, avatarId: string): Profile {
    const newProfile = createProfile(name, avatarId);
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  }

  // Interstitial gate: increments the lifetime puzzle counter, then shows an
  // interstitial if we're past the grace period AND the round took long enough
  // to justify interrupting. VIP skips entirely. Always runs the callback.
  async function maybeShowInterstitialThen(cb: () => void) {
    if (!activeProfile) return cb();
    if (activeProfile.isVip) return cb();

    const roundDurationMs = Date.now() - roundStartedAtRef.current;
    const newPuzzleCount = (activeProfile.puzzlesPlayed ?? 0) + 1;
    updateProfile(activeProfile.id, (p) => ({
      ...p,
      puzzlesPlayed: (p.puzzlesPlayed ?? 0) + 1,
    }));

    const beyondGrace = newPuzzleCount > INTERSTITIAL_GRACE_PUZZLES;
    const onCadence =
      (newPuzzleCount - (INTERSTITIAL_GRACE_PUZZLES + 1)) % INTERSTITIAL_EVERY_N_PUZZLES === 0;
    const longEnough = roundDurationMs >= INTERSTITIAL_MIN_ROUND_MS;
    if (!beyondGrace || !onCadence || !longEnough) return cb();

    setAdWatching('interstitial');
    await showInterstitial();
    setAdWatching(null);
    cb();
  }

  async function handleWatchAd(type: 'coins' | 'freePull') {
    if (!activeProfile) return;
    if (!canWatchAd(activeProfile, type)) return;
    if (adWatching) return;
    setAdWatching(type);
    const result = await watchAdForReward(type);
    setAdWatching(null);
    if (!result.success) return;
    if (type === 'coins') {
      updateProfile(activeProfile.id, (p) => recordAdWatch(addCoins(p, COINS_PER_AD), 'coins'));
      setAdRewardCoins(COINS_PER_AD);
    } else {
      const squishy = randomSquishy(activeProfile.isVip);
      updateProfile(activeProfile.id, (p) =>
        recordAdWatch(awardSquishiesToProfile(p, [squishy]), 'freePull')
      );
      setLastEarnedSquishy(squishy);
      setPendingReveal({ squishy, nextScreen: 'trophyRoom', autoOpenCard: true });
      setScreen('blindBoxReveal');
    }
  }

  const [pendingReveal, setPendingReveal] = useState<{
    squishy: Squishy;
    nextScreen: Screen;
    autoOpenCard?: boolean;
  } | null>(null);

  const [wordA, setWordA] = useState('');
  const [wordB, setWordB] = useState('');
  const [guessedByA, setGuessedByA] = useState<string[]>([]);
  const [guessedByB, setGuessedByB] = useState<string[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winReason, setWinReason] = useState<string>('');
  const [solveModalOpen, setSolveModalOpen] = useState(false);

  const [shelfA, setShelfA] = useState<Squishy[]>([]);
  const [shelfB, setShelfB] = useState<Squishy[]>([]);
  const [matchSquishiesA, setMatchSquishiesA] = useState<Squishy[]>([]);
  const [matchSquishiesB, setMatchSquishiesB] = useState<Squishy[]>([]);
  const [matchBonus, setMatchBonus] = useState<Squishy | null>(null);
  const [roundsWonA, setRoundsWonA] = useState(0);
  const [roundsWonB, setRoundsWonB] = useState(0);
  const [lastEarnedSquishy, setLastEarnedSquishy] = useState<Squishy | null>(
    null
  );

  const [playerAName, setPlayerAName] = useState('Player A');
  const [playerBName, setPlayerBName] = useState('Player B');
  const [firstPlayerThisRound, setFirstPlayerThisRound] =
    useState<Player>('A');
  const [turnFeedback, setTurnFeedback] = useState<{
    type: 'wrong' | 'streak';
    letter?: string;
  } | null>(null);
  const [rulesVisible, setRulesVisible] = useState(false);

  const nameOf = (p: Player) => (p === 'A' ? playerAName : playerBName);

  const [soloCategory, setSoloCategory] = useState<Category | null>(null);
  const [soloWord, setSoloWord] = useState('');
  const [soloGuessed, setSoloGuessed] = useState<string[]>([]);
  const [soloWon, setSoloWon] = useState(false);
  const [soloWinStreak, setSoloWinStreak] = useState(0);
  const [soloShelf, setSoloShelf] = useState<Squishy[]>([]);
  // Track recent solo words per category to prevent repeats
  const [recentSoloWords, setRecentSoloWords] = useState<string[]>([]);
  // Coin economy
  const [hintsUsedThisRound, setHintsUsedThisRound] = useState(0);
  const [extraLivesThisRound, setExtraLivesThisRound] = useState(0);

  function startNewMatch() {
    setMode('2player');
    setWordA('');
    setWordB('');
    setGuessedByA([]);
    setGuessedByB([]);
    setCurrentPlayer('A');
    setConsecutiveCorrect(0);
    setWinner(null);
    setWinReason('');
    setMatchSquishiesA([]);
    setMatchSquishiesB([]);
    setMatchBonus(null);
    setRoundsWonA(0);
    setRoundsWonB(0);
    setLastEarnedSquishy(null);
    setHintsUsedThisRound(0);
    setExtraLivesThisRound(0);
    // Player A = active profile; Player B picked at nameEntry
    setProfileAId(activeProfileId);
    setProfileBId(null);
    setPlayerAName(activeProfile?.name ?? 'Player A');
    setPlayerBName('Player B');
    setFirstPlayerThisRound('A');
    roundStartedAtRef.current = Date.now();
    setScreen('nameEntry');
  }

  // DEV ONLY — force a pull of a specific rarity to preview the reveal
  function devPullByRarity(rarity: Rarity) {
    const pool = SQUISHIES.filter((s) => s.rarity === rarity);
    if (pool.length === 0) return;
    const squishy = pool[Math.floor(Math.random() * pool.length)];
    setLastEarnedSquishy(squishy);
    setPendingReveal({ squishy, nextScreen: 'start' });
    setScreen('blindBoxReveal');
  }

  function startSoloMode() {
    setMode('solo');
    setSoloCategory(null);
    setSoloWord('');
    setSoloGuessed([]);
    setSoloWon(false);
    setLastEarnedSquishy(null);
    setScreen('categorySelect');
  }

  function pickCategory(category: Category) {
    setSoloCategory(category);
    // Reset recent history when switching categories
    const word = randomWordFromCategory(category, []);
    setSoloWord(word);
    setRecentSoloWords([word]);
    setSoloGuessed([]);
    setSoloWon(false);
    setLastEarnedSquishy(null);
    setHintsUsedThisRound(0);
    setExtraLivesThisRound(0);
    roundStartedAtRef.current = Date.now();
    setScreen('playing');
  }

  function startNextSoloRound() {
    if (!soloCategory) return;
    setHintsUsedThisRound(0);
    setExtraLivesThisRound(0);
    // Remember up to 5 recent words — avoid repeating any of them
    const word = randomWordFromCategory(soloCategory, recentSoloWords);
    setSoloWord(word);
    setRecentSoloWords((prev) => [word, ...prev].slice(0, 25));
    setSoloGuessed([]);
    setSoloWon(false);
    setLastEarnedSquishy(null);
    roundStartedAtRef.current = Date.now();
    setScreen('playing');
  }

  function startNextRound() {
    const nextFirst: Player = firstPlayerThisRound === 'A' ? 'B' : 'A';
    setFirstPlayerThisRound(nextFirst);
    setWordA('');
    setWordB('');
    setGuessedByA([]);
    setGuessedByB([]);
    setCurrentPlayer(nextFirst);
    setConsecutiveCorrect(0);
    setWinner(null);
    setWinReason('');
    setLastEarnedSquishy(null);
    setHintsUsedThisRound(0);
    setExtraLivesThisRound(0);
    roundStartedAtRef.current = Date.now();
    setScreen('playerAEntry');
  }

  // Hint handler — spend coins, apply the effect
  function buyHint(type: HintType, cost: number) {
    if (!activeProfile || activeProfile.coins < cost) return;
    if (hintsUsedThisRound >= MAX_HINTS_PER_ROUND) return;

    updateProfile(activeProfile.id, (p) => spendCoins(p, cost));
    setHintsUsedThisRound((n) => n + 1);

    const word = mode === 'solo' ? soloWord : (currentPlayer === 'A' ? wordB : wordA);
    const guessedList = mode === 'solo' ? soloGuessed : (currentPlayer === 'A' ? guessedByA : guessedByB);
    const setGuessed = (next: string[]) => {
      if (mode === 'solo') setSoloGuessed(next);
      else if (currentPlayer === 'A') setGuessedByA(next);
      else setGuessedByB(next);
    };

    if (type === 'firstLetter') {
      const first = word.replace(/[^A-Z]/g, '')[0];
      if (first && !guessedList.includes(first)) {
        setGuessed([...guessedList, first]);
      }
    } else if (type === 'letter') {
      const uniqueLetters = Array.from(new Set(word.replace(/[^A-Z]/g, '').split('')));
      const unguessed = uniqueLetters.filter((l) => !guessedList.includes(l));
      if (unguessed.length > 0) {
        const pick = unguessed[Math.floor(Math.random() * unguessed.length)];
        setGuessed([...guessedList, pick]);
      }
    } else if (type === 'vowels') {
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      const wordVowels = vowels.filter((v) => word.includes(v) && !guessedList.includes(v));
      if (wordVowels.length > 0) {
        setGuessed([...guessedList, ...wordVowels]);
      }
    } else if (type === 'extraLife') {
      setExtraLivesThisRound((n) => n + 1);
    } else if (type === 'skip') {
      if (mode === 'solo') {
        finishSoloRound(false);
      } else {
        setWinner(null);
        setWinReason(`${nameOf(currentPlayer)} skipped this round.`);
        setScreen('roundEnd');
      }
    }
  }

  function finishRound(winningPlayer: Player, reason: string) {
    const squishy = randomSquishy(activeProfile?.isVip ?? false);
    setLastEarnedSquishy(squishy);
    setWinner(winningPlayer);
    setWinReason(reason);

    let nextScreen: Screen = 'roundEnd';

    if (winningPlayer === 'A') {
      const newRoundsA = roundsWonA + 1;
      const newShelfA = [...shelfA, squishy];
      const newMatchA = [...matchSquishiesA, squishy];
      const awarded: Squishy[] = [squishy];
      if (newRoundsA >= ROUNDS_TO_WIN_MATCH) {
        const bonus = bonusSquishy(activeProfile?.isVip ?? false);
        newShelfA.push(bonus);
        newMatchA.push(bonus);
        awarded.push(bonus);
        setMatchBonus(bonus);
        nextScreen = 'matchWinner';
      }
      setShelfA(newShelfA);
      setMatchSquishiesA(newMatchA);
      setRoundsWonA(newRoundsA);
      // Persist to Player A's profile
      if (profileAId) {
        updateProfile(profileAId, (p) => {
          const awarded_p = awardSquishiesToProfile(p, awarded);
          if (nextScreen === 'matchWinner') {
            return recordMatchForProfile(awarded_p, true);
          }
          return awarded_p;
        });
        if (nextScreen === 'matchWinner' && profileBId) {
          updateProfile(profileBId, (p) => recordMatchForProfile(p, false));
        }
      }
    } else {
      const newRoundsB = roundsWonB + 1;
      const newShelfB = [...shelfB, squishy];
      const newMatchB = [...matchSquishiesB, squishy];
      const awarded: Squishy[] = [squishy];
      if (newRoundsB >= ROUNDS_TO_WIN_MATCH) {
        const bonus = bonusSquishy(activeProfile?.isVip ?? false);
        newShelfB.push(bonus);
        newMatchB.push(bonus);
        awarded.push(bonus);
        setMatchBonus(bonus);
        nextScreen = 'matchWinner';
      }
      setShelfB(newShelfB);
      setMatchSquishiesB(newMatchB);
      setRoundsWonB(newRoundsB);
      // Persist to Player B's profile
      if (profileBId) {
        updateProfile(profileBId, (p) => {
          const awarded_p = awardSquishiesToProfile(p, awarded);
          if (nextScreen === 'matchWinner') {
            return recordMatchForProfile(awarded_p, true);
          }
          return awarded_p;
        });
        if (nextScreen === 'matchWinner' && profileAId) {
          updateProfile(profileAId, (p) => recordMatchForProfile(p, false));
        }
      }
    }

    if (nextScreen === 'matchWinner') haptics.matchWin();
    else haptics.roundWin();

    setPendingReveal({ squishy, nextScreen });
    setScreen('blindBoxReveal');
  }

  function finishSoloRound(didWin: boolean) {
    setSoloWon(didWin);

    if (didWin) {
      haptics.roundWin();
      const newStreak = soloWinStreak + 1;
      setSoloWinStreak(newStreak);

      if (newStreak % SOLO_WINS_PER_SQUISHY === 0) {
        const squishy = randomSquishy(activeProfile?.isVip ?? false);
        setLastEarnedSquishy(squishy);
        setSoloShelf([...soloShelf, squishy]);
        // Persist to active profile's collection
        if (activeProfileId) {
          updateProfile(activeProfileId, (p) =>
            awardSquishiesToProfile(p, [squishy])
          );
        }
        setPendingReveal({ squishy, nextScreen: 'soloRoundEnd' });
        setScreen('blindBoxReveal');
        return;
      }
    }

    setScreen('soloRoundEnd');
  }

  function swapTurn() {
    setConsecutiveCorrect(0);
    setCurrentPlayer(currentPlayer === 'A' ? 'B' : 'A');
    haptics.turnPass();
    setScreen('turnPass');
  }

  function swapTurnWithFeedback(
    type: 'wrong' | 'streak',
    letter?: string
  ) {
    if (type === 'streak') haptics.streak();
    setTurnFeedback({ type, letter });
    setTimeout(() => {
      setTurnFeedback(null);
      swapTurn();
    }, 1300);
  }

  function handleLetterPress(letter: string) {
    if (mode === 'solo') {
      handleSoloLetterPress(letter);
      return;
    }

    const guessedList = currentPlayer === 'A' ? guessedByA : guessedByB;
    const opponentWord = currentPlayer === 'A' ? wordB : wordA;

    if (guessedList.includes(letter)) return;

    const newGuessed = [...guessedList, letter];
    if (currentPlayer === 'A') setGuessedByA(newGuessed);
    else setGuessedByB(newGuessed);

    const isCorrect = opponentWord.includes(letter);

    if (isCorrect) {
      haptics.correctGuess();
      const uniqueLetters = [
        ...new Set(opponentWord.replace(/[^A-Z]/g, '').split('')),
      ];
      const solved = uniqueLetters.every((l) => newGuessed.includes(l));

      if (solved) {
        finishRound(
          currentPlayer,
          `${nameOf(currentPlayer)} solved it letter by letter!`
        );
        return;
      }

      const newConsecutive = consecutiveCorrect + 1;
      if (newConsecutive >= MAX_CONSECUTIVE) {
        swapTurnWithFeedback('streak');
        return;
      }

      setConsecutiveCorrect(newConsecutive);
    } else {
      haptics.wrongGuess();
      const wrongCount = newGuessed.filter(
        (l) => !opponentWord.includes(l)
      ).length;
      if (wrongCount >= MAX_WRONG + extraLivesThisRound) {
        haptics.letterLockout();
        // Current player locked out. Check if other player can still play.
        const other: Player = currentPlayer === 'A' ? 'B' : 'A';
        const otherGuessed = other === 'A' ? guessedByA : guessedByB;
        const otherOpponentWord = other === 'A' ? wordB : wordA;
        const otherWrong = otherGuessed.filter(
          (l) => !otherOpponentWord.includes(l)
        ).length;

        if (otherWrong >= MAX_WRONG + extraLivesThisRound) {
          // Both locked out — tie
          finishRoundTie();
          return;
        }
        // Other player still has guesses. Pass to them to continue solving.
        swapTurnWithFeedback('wrong', letter);
        return;
      }
      swapTurnWithFeedback('wrong', letter);
    }
  }

  function finishRoundTie() {
    setWinner(null);
    setWinReason(
      `Both players ran out of guesses. No squishy this round — try again!`
    );
    setScreen('roundEnd');
  }

  function handleSoloLetterPress(letter: string) {
    if (soloGuessed.includes(letter)) return;

    const newGuessed = [...soloGuessed, letter];
    setSoloGuessed(newGuessed);

    const isCorrect = soloWord.includes(letter);

    if (isCorrect) {
      haptics.correctGuess();
      const uniqueLetters = [
        ...new Set(soloWord.replace(/[^A-Z]/g, '').split('')),
      ];
      const solved = uniqueLetters.every((l) => newGuessed.includes(l));

      if (solved) {
        finishSoloRound(true);
      }
    } else {
      haptics.wrongGuess();
      const wrongCount = newGuessed.filter((l) => !soloWord.includes(l)).length;
      if (wrongCount >= MAX_WRONG + extraLivesThisRound) {
        haptics.letterLockout();
        finishSoloRound(false);
      }
    }
  }

  function handleSolveAttempt(attempt: string) {
    const normalize = (s: string) =>
      s.trim().toUpperCase().replace(/\s+/g, ' ');
    setSolveModalOpen(false);

    if (mode === 'solo') {
      if (normalize(attempt) === normalize(soloWord)) {
        finishSoloRound(true);
      } else {
        finishSoloRound(false);
      }
      return;
    }

    const opponentWord = currentPlayer === 'A' ? wordB : wordA;
    if (normalize(attempt) === normalize(opponentWord)) {
      finishRound(currentPlayer, `${nameOf(currentPlayer)} solved the puzzle!`);
    } else {
      const opponent: Player = currentPlayer === 'A' ? 'B' : 'A';
      finishRound(
        opponent,
        `${nameOf(currentPlayer)} missed the puzzle. ${nameOf(opponent)} wins.`
      );
    }
  }

  const currentGuessed =
    mode === 'solo'
      ? soloGuessed
      : currentPlayer === 'A'
      ? guessedByA
      : guessedByB;
  const currentOpponentWord =
    mode === 'solo' ? soloWord : currentPlayer === 'A' ? wordB : wordA;
  const currentWrongCount = currentGuessed.filter(
    (l) => !currentOpponentWord.includes(l)
  ).length;

  if (!fontsLoaded || !profilesHydrated || screen === 'loading') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LoadingScreen fadingOut={splashFadingOut} />
      </View>
    );
  }

  function handleDeleteProfile(p: Profile) {
    setProfiles((prev) => prev.filter((x) => x.id !== p.id));
    if (activeProfileId === p.id) setActiveProfileId(null);
  }

  const usedAvatarIds = new Set(profiles.map((p) => p.avatarId));

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {screen === 'whosPlaying' && (
        <WhosPlayingScreen
          profiles={profiles}
          onPickProfile={(p) => {
            setActiveProfileId(p.id);
            setScreen('start');
          }}
          onAddNew={() => {
            setAddProfileReturnTo('start');
            setScreen('addProfile');
          }}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {screen === 'addProfile' && (
        <AddProfileScreen
          usedAvatarIds={usedAvatarIds}
          canCancel={profiles.length > 0}
          onCancel={() =>
            setScreen(addProfileReturnTo === 'nameEntry' ? 'nameEntry' : 'whosPlaying')
          }
          onCreate={(name, avatarId) => {
            const newProfile = addProfile(name, avatarId);
            if (addProfileReturnTo === 'nameEntry') {
              setProfileBId(newProfile.id);
              setPlayerBName(newProfile.name);
              setScreen('playerAEntry');
            } else {
              setActiveProfileId(newProfile.id);
              setScreen('start');
            }
            setAddProfileReturnTo('start');
          }}
        />
      )}

      {screen === 'trophyRoom' && activeProfile && (
        <TrophyRoomScreen
          profile={activeProfile}
          onBack={() => setScreen('start')}
          onSellSquishy={(squishy) => {
            updateProfile(activeProfile.id, (p) => sellOneDuplicate(p, squishy.id));
          }}
          onWatchAdForFreePull={() => handleWatchAd('freePull')}
          freePullsRemaining={AD_DAILY_LIMIT - getAdWatchesToday(activeProfile).freePull}
        />
      )}

      {screen === 'start' && (
        <StartScreen
          onPlayWithFriend={startNewMatch}
          onPlaySolo={startSoloMode}
          onShowRules={() => setRulesVisible(true)}
          onOpenTrophyRoom={() => setScreen('trophyRoom')}
          onSwitchProfile={() => setScreen('whosPlaying')}
          onDevPull={devPullByRarity}
          activeProfile={activeProfile}
          soloShelfCount={soloShelf.length}
          soloWinStreak={soloWinStreak}
        />
      )}

      {screen === 'categorySelect' && (
        <CategorySelectScreen
          onPick={pickCategory}
          onBack={() => setScreen('start')}
        />
      )}

      {screen === 'nameEntry' && (
        <NameEntryScreen
          activeProfile={activeProfile}
          otherProfiles={profiles.filter((p) => p.id !== activeProfileId)}
          onPickOpponent={(opponent) => {
            setProfileBId(opponent.id);
            setPlayerAName(activeProfile?.name ?? 'Player A');
            setPlayerBName(opponent.name);
            setScreen('playerAEntry');
          }}
          onAddNew={() => {
            setAddProfileReturnTo('nameEntry');
            setScreen('addProfile');
          }}
          onBack={() => setScreen('start')}
        />
      )}

      {screen === 'playerAEntry' && (
        <WordEntryScreen
          playerLabel={playerAName}
          playerAvatarId={profileA?.avatarId ?? null}
          roundsWonA={roundsWonA}
          roundsWonB={roundsWonB}
          onLockWord={(word) => {
            setWordA(word);
            setScreen('preGameHandoff');
          }}
        />
      )}

      {screen === 'preGameHandoff' && (
        <PlaceholderScreen
          title="📱 →"
          subtitle={`Pass the phone to ${playerBName} to set a secret word`}
          buttonLabel="Ready"
          onPress={() => setScreen('playerBEntry')}
        />
      )}

      {screen === 'playerBEntry' && (
        <WordEntryScreen
          playerLabel={playerBName}
          playerAvatarId={profileB?.avatarId ?? null}
          roundsWonA={roundsWonA}
          roundsWonB={roundsWonB}
          onLockWord={(word) => {
            setWordB(word);
            setCurrentPlayer(firstPlayerThisRound);
            setConsecutiveCorrect(0);
            setScreen('playing');
          }}
        />
      )}

      {screen === 'turnPass' && (
        <PlaceholderScreen
          title={`${nameOf(currentPlayer)}, you're up`}
          subtitle={`Pass the phone to ${nameOf(currentPlayer)}`}
          buttonLabel="Ready"
          onPress={() => setScreen('playing')}
        />
      )}

      {screen === 'blindBoxReveal' && pendingReveal && (
        <BlindBoxReveal
          squishy={pendingReveal.squishy}
          autoOpenCard={pendingReveal.autoOpenCard}
          onContinue={() => {
            const next = pendingReveal.nextScreen;
            setPendingReveal(null);
            setScreen(next);
          }}
        />
      )}

      {screen === 'playing' && (
        <GameScreen
          mode={mode}
          currentPlayer={currentPlayer}
          currentPlayerName={nameOf(currentPlayer)}
          secretWord={currentOpponentWord}
          guessed={currentGuessed}
          wrongCount={currentWrongCount}
          consecutiveCorrect={consecutiveCorrect}
          roundsWonA={roundsWonA}
          roundsWonB={roundsWonB}
          soloCategory={soloCategory}
          onLetterPress={handleLetterPress}
          onSolvePress={() => setSolveModalOpen(true)}
          onQuit={() => setScreen('start')}
          activeProfile={activeProfile}
          hintsUsedThisRound={hintsUsedThisRound}
          onBuyHint={buyHint}
          onWatchAdForCoins={() => handleWatchAd('coins')}
          coinAdsRemaining={activeProfile ? AD_DAILY_LIMIT - getAdWatchesToday(activeProfile).coins : 0}
        />
      )}

      {screen === 'roundEnd' && (
        <RoundEndScreen
          winner={winner}
          winnerName={winner ? nameOf(winner) : null}
          reason={winReason}
          nameA={playerAName}
          nameB={playerBName}
          wordA={wordA}
          wordB={wordB}
          earnedSquishy={lastEarnedSquishy}
          shelfA={matchSquishiesA}
          shelfB={matchSquishiesB}
          lifetimeShelfA={shelfA}
          lifetimeShelfB={shelfB}
          roundsWonA={roundsWonA}
          roundsWonB={roundsWonB}
          onNextRound={() => maybeShowInterstitialThen(startNextRound)}
          onHome={() => setScreen('start')}
          onTrophyRoom={() => setScreen('trophyRoom')}
        />
      )}

      {screen === 'soloRoundEnd' && (
        <SoloRoundEndScreen
          didWin={soloWon}
          word={soloWord}
          category={soloCategory}
          earnedSquishy={lastEarnedSquishy}
          winStreak={soloWinStreak}
          onNextWord={() => maybeShowInterstitialThen(startNextSoloRound)}
          onChangeCategory={() => setScreen('categorySelect')}
          onHome={() => setScreen('start')}
        />
      )}

      {screen === 'matchWinner' && (
        <MatchWinnerScreen
          winner={winner}
          winnerName={winner ? nameOf(winner) : null}
          loserName={winner ? nameOf(winner === 'A' ? 'B' : 'A') : null}
          matchBonus={matchBonus}
          winnerMatchSquishies={
            winner === 'A' ? matchSquishiesA : matchSquishiesB
          }
          loserMatchSquishies={
            winner === 'A' ? matchSquishiesB : matchSquishiesA
          }
          winnerLifetimeTotal={
            winner === 'A' ? shelfA.length : shelfB.length
          }
          loserLifetimeTotal={
            winner === 'A' ? shelfB.length : shelfA.length
          }
          roundsWonA={roundsWonA}
          roundsWonB={roundsWonB}
          onNewMatch={() => maybeShowInterstitialThen(startNewMatch)}
          onHome={() => setScreen('start')}
        />
      )}

      <SolvePuzzleModal
        visible={solveModalOpen}
        currentPlayerName={mode === 'solo' ? null : nameOf(currentPlayer)}
        secretWord={currentOpponentWord}
        guessed={currentGuessed}
        onSubmit={handleSolveAttempt}
        onCancel={() => setSolveModalOpen(false)}
      />

      <TurnFeedbackOverlay feedback={turnFeedback} />

      <Modal

        visible={rulesVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRulesVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <ScrollView
              contentContainerStyle={{ padding: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>How to Play</Text>
              <Text style={{ fontSize: 13, color: '#1a1613', lineHeight: 20, marginBottom: 12 }}>
                SquishPop Word Duel is a secret word game you can play solo, or with a friend. Guess the hidden word and collect squishies forever.
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Setup
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Each player picks a secret word OR phrase (up to 25 characters — "Taylor Swift" and "pepperoni pizza" both work). Pass the phone — only you see your own word.
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Meet zAIa
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Your purple plush AI buddy checks if your word is real. If she doesn't know it, she'll ask: "Hmm, I don't know this one." You decide if it counts.
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Taking Turns
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Guess letters in the opponent's word.{'\n'}
                ✓ Correct letter → keep going (max 3 in a row){'\n'}
                ✗ Wrong letter → turn passes to the other player{'\n'}
                💀 6 wrong on your word? You can't guess anymore — opponent gets a chance to solve
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Solve the Puzzle
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Tap 🎯 anytime to type the whole word.{'\n'}
                Right = instant win · Wrong = instant loss
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Winning Squishies
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Win a round → earn a squishy from one of 10 themed shelves (Rainbow, Halloween, Dessert, Floral, Sea, Dumpling and more){'\n'}
                First to 5 wins the match → bonus squishy with much better rare odds{'\n'}
                Yours forever — your collection never resets
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Themed Blind Boxes
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                Every shelf has its own box color — Halloween squishies arrive in orange & black boxes, Rainbow in rainbow boxes. Shake to open, then meet your new squishy!
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                💰 Coins & 💡 Hints
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 10 }}>
                You start with 💰 25 coins. Got a duplicate squishy? Sell it for coins (Common 5 · Rare 25 · Legendary 100 · Beyond-Legendary way more).{'\n\n'}
                Stuck on a word? Spend coins on a Hint (up to 2 per round):{'\n'}
                🎯 Reveal First Letter — 15{'\n'}
                🔤 Reveal a Letter — 20{'\n'}
                🎵 Reveal All Vowels — 30{'\n'}
                🆘 Extra Life — 40{'\n'}
                🏃 Skip Round — 50{'\n\n'}
                🎬 Low on coins? Watch a short ad for 💰 100. In the Trophy Room, you can also watch an ad to earn a free squishy pull. Both are capped at 3 per day.
              </Text>

              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a6a2e', marginTop: 6, marginBottom: 4 }}>
                Rarity
              </Text>
              <Text style={{ fontSize: 12, color: '#1a1613', lineHeight: 18, marginBottom: 16 }}>
                Common · 🥈 Rare · 🏆 Legendary · 💎 Beyond-Legendary (VIP Vault){'\n'}
                Chase the rare ones!
              </Text>

              <Pressable
                style={[styles.primaryButton, { alignSelf: 'center' }]}
                onPress={() => setRulesVisible(false)}
              >
                <Text style={styles.primaryButtonText}>Got it!</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <WatchingAdOverlay visible={adWatching !== null} />
      <AdCoinRewardOverlay
        coins={adRewardCoins}
        onClose={() => setAdRewardCoins(null)}
      />
    </View>
  );
}

function WatchingAdOverlay({ visible }: { visible: boolean }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(t);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎬</Text>
          <OutlinedText size={22} color="#FFF2A8" outlineColor="#8A5F00" outlineWidth={2}>
            Watching Ad{dots}
          </OutlinedText>
          <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12, letterSpacing: 1.5 }}>
            (ad simulator — SDK coming soon)
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function AdCoinRewardOverlay({
  coins,
  onClose,
}: {
  coins: number | null;
  onClose: () => void;
}) {
  const visible = coins !== null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
        <View style={{ backgroundColor: '#FFF8EA', borderRadius: 24, padding: 28, borderWidth: 3, borderColor: '#8A5F00', alignItems: 'center', minWidth: 280 }}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>🎉</Text>
          <OutlinedText size={28} color="#FFF2A8" outlineColor="#8A5F00" outlineWidth={2}>
            +💰 {coins ?? 0}
          </OutlinedText>
          <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 14, color: '#8A5F00', marginTop: 8 }}>
            Coins added to your wallet!
          </Text>
          <Pressable onPress={onClose} style={{ marginTop: 18, backgroundColor: '#FFB800', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 100, borderWidth: 2, borderColor: '#8A5F00' }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 14, color: '#2A1A00' }}>Yay!</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function LoadingScreen({ fadingOut = false }: { fadingOut?: boolean }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0.3)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fadingOut) {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [fadingOut]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // The amber "constellation" dot pulse — subtle breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 0.6,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#0F1420', opacity: screenOpacity }}>
      <LinearGradient
        colors={['#1A2340', '#0F1420', '#070A14'] as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Center stack: MD Studios wordmark + "presents" + "SquishPop Word Duel" */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            alignItems: 'center',
          }}
        >
          <Image
            source={require('./assets/md-studios-wordmark.png')}
            fadeDuration={0}
            style={{ width: 260, height: 46, resizeMode: 'contain', tintColor: '#F5F5F5' }}
          />
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity, alignItems: 'center', marginTop: 36 }}>
          <Text
            style={{
              fontFamily: FONT_SEMIBOLD,
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            presents
          </Text>
          <OutlinedText size={38} color="#FFF2A8" outlineColor="#8A5F00" outlineWidth={3}>
            SquishPop
          </OutlinedText>
          <View style={{ marginTop: -4 }}>
            <OutlinedText size={22} color="#FFFFFF" outlineColor="#8A5F00" outlineWidth={2}>
              Word Duel
            </OutlinedText>
          </View>

          <Text
            style={{
              fontFamily: FONT_SEMIBOLD,
              fontSize: 13,
              color: 'rgba(255,255,255,0.78)',
              textAlign: 'center',
              marginTop: 28,
              letterSpacing: 0.3,
            }}
          >
            Designed by Cora, Aubrey, and their Dad
          </Text>
          <Text
            style={{
              fontFamily: FONT_SEMIBOLD,
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              marginTop: 8,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Powered by MDStudios
          </Text>
        </Animated.View>
      </View>

      {/* Pulsing amber constellation dot — bottom center */}
      <View style={{ position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' }}>
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#F5A623',
            transform: [{ scale: dotScale }],
          }}
        />
        <Text
          style={{
            fontFamily: FONT_SEMIBOLD,
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 2,
            marginTop: 12,
          }}
        >
          LOADING...
        </Text>
      </View>
    </Animated.View>
  );
}

function TurnFeedbackOverlay({
  feedback,
}: {
  feedback: { type: 'wrong' | 'streak'; letter?: string } | null;
}) {
  if (!feedback) return null;

  const isWrong = feedback.type === 'wrong';
  const bg = isWrong ? 'rgba(166, 61, 43, 0.92)' : 'rgba(42, 122, 59, 0.92)';
  const emoji = isWrong ? '✗' : '🎯';
  const title = isWrong ? 'Nope!' : 'Streak!';
  const message = isWrong
    ? feedback.letter
      ? `"${feedback.letter}" isn't in the word`
      : 'Wrong guess'
    : 'Three in a row — turn passes';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 96, color: 'white', fontWeight: '900', marginBottom: 8 }}>
        {emoji}
      </Text>
      <Text style={{ fontSize: 36, color: 'white', fontWeight: '900', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
        {message}
      </Text>
    </View>
  );
}

const DEV_RARITIES: { rarity: Rarity; label: string; emoji: string; color: string }[] = [
  { rarity: 'common',    label: 'Common',    emoji: '⚪', color: '#D5E8D4' },
  { rarity: 'rare',      label: 'Rare',      emoji: '🥈', color: '#C8A4F0' },
  { rarity: 'legendary', label: 'Legendary', emoji: '🏆', color: '#FFD54F' },
  { rarity: 'chrome',    label: 'Chrome',    emoji: '🪞', color: '#C0C0C0' },
  { rarity: 'crystal',   label: 'Crystal',   emoji: '💎', color: '#A5F0FF' },
  { rarity: 'shadow',    label: 'Shadow',    emoji: '🌑', color: '#6B4A8E' },
  { rarity: 'mythic',    label: 'Mythic',    emoji: '⚡', color: '#FFB800' },
];

function StartScreen({
  onPlayWithFriend,
  onPlaySolo,
  onShowRules,
  onOpenTrophyRoom,
  onSwitchProfile,
  onDevPull,
  activeProfile,
  soloShelfCount,
  soloWinStreak,
}: {
  onPlayWithFriend: () => void;
  onPlaySolo: () => void;
  onShowRules: () => void;
  onOpenTrophyRoom: () => void;
  onSwitchProfile: () => void;
  onDevPull: (rarity: Rarity) => void;
  activeProfile: Profile | null;
  soloShelfCount: number;
  soloWinStreak: number;
}) {
  const [devPickerOpen, setDevPickerOpen] = useState(false);
  const [devBoxBrowserOpen, setDevBoxBrowserOpen] = useState(false);
  // Decorative teaser squishies for the showcase
  const legendaryGalaxy = SQUISHIES.find((s) => s.id === 'rainbow-08')!;
  const legendaryDiamond = SQUISHIES.find((s) => s.id === 'glitter-08')!;
  const legendaryDragon = SQUISHIES.find((s) => s.id === 'creature-08')!;
  const legendaryLotus = SQUISHIES.find((s) => s.id === 'floral-08')!;
  const legendarySpirit = SQUISHIES.find((s) => s.id === 'halloween-08')!;
  const legendarySmores = SQUISHIES.find((s) => s.id === 'dessert-08')!;
  const legendaryMarble = SQUISHIES.find((s) => s.id === 'sea-08')!;
  const heroSquishy = SQUISHIES.find((s) => s.id === 'rainbow-01')!;

  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.start}>
      {/* Top-row teaser squishies */}
      <Image source={legendaryGalaxy.image} style={{ position: 'absolute', top: 50, left: -30, width: 150, height: 150, resizeMode: 'contain', transform: [{ rotate: '-18deg' }] }} />
      <Image source={legendaryDiamond.image} style={{ position: 'absolute', top: 70, right: -25, width: 140, height: 140, resizeMode: 'contain', transform: [{ rotate: '15deg' }] }} />
      <Image source={legendarySpirit.image} style={{ position: 'absolute', top: 170, left: 10, width: 90, height: 90, resizeMode: 'contain', transform: [{ rotate: '20deg' }], opacity: 0.9 }} />
      <Image source={legendarySmores.image} style={{ position: 'absolute', top: 190, right: 10, width: 90, height: 90, resizeMode: 'contain', transform: [{ rotate: '-15deg' }], opacity: 0.9 }} />

      {/* Mid-side larger teasers */}
      <Image source={legendaryLotus.image} style={{ position: 'absolute', bottom: 180, left: -20, width: 130, height: 130, resizeMode: 'contain', transform: [{ rotate: '12deg' }] }} />
      <Image source={legendaryDragon.image} style={{ position: 'absolute', bottom: 180, right: -20, width: 130, height: 130, resizeMode: 'contain', transform: [{ rotate: '-10deg' }] }} />
      <Image source={legendaryMarble.image} style={{ position: 'absolute', bottom: 320, left: 30, width: 80, height: 80, resizeMode: 'contain', transform: [{ rotate: '-25deg' }], opacity: 0.85 }} />

      {/* Hero scene — big box with squishy popping out */}
      <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center', height: 220 }} pointerEvents="none">
        <Image source={BOX_IMAGES.rainbow.open} style={{ position: 'absolute', bottom: 0, width: 200, height: 200, resizeMode: 'contain' }} />
        <Image source={heroSquishy.image} style={{ position: 'absolute', bottom: 90, width: 160, height: 160, resizeMode: 'contain' }} />
      </View>

      {/* "Collect Them All!" sticker tag — tucked below the player badge, above the second teaser row */}
      <View style={{ position: 'absolute', top: 135, alignSelf: 'center', transform: [{ rotate: '-6deg' }], backgroundColor: '#FFB800', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 3, borderColor: '#8A3F00', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, zIndex: 5 }} pointerEvents="none">
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 14, color: '#2A1A00', letterSpacing: 0.8, textAlign: 'center' }}>⭐ COLLECT THEM ALL! ⭐</Text>
      </View>

      <View style={styles.startContainer}>
        <OutlinedText size={44} color="#FFFFFF" outlineColor="#8A3F00" outlineWidth={4}>
          SquishPop
        </OutlinedText>
        <View style={{ marginTop: -6, marginBottom: 10 }}>
          <OutlinedText size={28} color="#FFF2D1" outlineColor="#8A3F00" outlineWidth={3}>
            Word Duel
          </OutlinedText>
        </View>
        <Text
          style={{
            fontFamily: FONT_SEMIBOLD,
            fontSize: 15,
            color: '#8A3F00',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          How do you want to play?
        </Text>

        <ChunkyButton
          onPress={onPlayWithFriend}
          color={BUBBLE_COLORS.coral}
          textColor={BUBBLE_COLORS.coralText}
          shadowColor={BUBBLE_COLORS.coralShadow}
          size="lg"
          style={{ marginBottom: 16, minWidth: 280 }}
        >
          👥  Play with a Friend
        </ChunkyButton>

        <ChunkyButton
          onPress={onPlaySolo}
          color={BUBBLE_COLORS.purple}
          textColor={BUBBLE_COLORS.purpleText}
          shadowColor={BUBBLE_COLORS.purpleShadow}
          size="lg"
          style={{ marginBottom: 16, minWidth: 280 }}
        >
          🎮  Play Solo
        </ChunkyButton>

        {(soloShelfCount > 0 || soloWinStreak > 0) && (
          <View
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_SEMIBOLD,
                fontSize: 13,
                color: '#8A3F00',
                textAlign: 'center',
              }}
            >
              Your solo stats: {soloWinStreak} wins · {soloShelfCount} squishies
            </Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <ChunkyButton
            onPress={onOpenTrophyRoom}
            color={BUBBLE_COLORS.mint}
            textColor={BUBBLE_COLORS.mintText}
            shadowColor={BUBBLE_COLORS.mintShadow}
            size="md"
            style={{ minWidth: 260 }}
          >
            🏆  Trophy Room
          </ChunkyButton>
        </View>

        <View style={{ marginTop: 20 }}>
          <ChunkyButton
            onPress={onShowRules}
            color="rgba(255,255,255,0.85)"
            textColor="#8A3F00"
            shadowColor="rgba(0,0,0,0.15)"
            size="sm"
          >
            ❓  How to Play
          </ChunkyButton>
        </View>
      </View>

      {/* DEV buttons — remove before shipping. */}
      <Pressable
        onPress={() => setDevPickerOpen(true)}
        style={{
          position: 'absolute',
          top: 60,
          left: 16,
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 100,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 4 }}>🏆</Text>
        <Text style={{ fontFamily: FONT_BOLD, color: '#FFD700', fontSize: 10, letterSpacing: 1 }}>
          PULL
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setDevBoxBrowserOpen(true)}
        style={{
          position: 'absolute',
          top: 96,
          left: 16,
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 100,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 4 }}>📦</Text>
        <Text style={{ fontFamily: FONT_BOLD, color: '#FFD700', fontSize: 10, letterSpacing: 1 }}>
          BOXES
        </Text>
      </Pressable>

      {/* Active profile chip — top-right corner */}
      {activeProfile && (
        <Pressable
          onPress={onSwitchProfile}
          style={{
            position: 'absolute',
            top: 60,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 100,
            paddingLeft: 6,
            paddingRight: 14,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
            zIndex: 10,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFC168',
              overflow: 'hidden',
              marginRight: 8,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          >
            <Image
              source={getAvatar(activeProfile.avatarId).image}
              style={{ width: 60, height: 60, position: 'absolute', top: -4, left: -10, resizeMode: 'contain' }}
            />
          </View>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 14, color: '#2A1A00' }}>
            {activeProfile.name}
          </Text>
          <View style={{
            marginLeft: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: '#FFECA8',
            borderRadius: 100,
            borderWidth: 1,
            borderColor: '#8A5F00',
          }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, color: '#8A5F00' }}>
              💰 {activeProfile.coins}
            </Text>
          </View>
        </Pressable>
      )}

      {/* MD Studios footer badge — bottom center */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Image
          source={require('./assets/md-studios-wordmark.png')}
          fadeDuration={0}
          style={{ width: 110, height: 20, resizeMode: 'contain', opacity: 0.45, tintColor: '#2A1A00' }}
        />
      </View>

      {/* DEV rarity picker modal */}
      <Modal visible={devPickerOpen} transparent={true} animationType="fade" onRequestClose={() => setDevPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDevPickerOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={{
              width: '82%',
              maxWidth: 320,
              backgroundColor: '#1a1613',
              borderRadius: 20,
              padding: 18,
              borderWidth: 2,
              borderColor: '#FFD700',
            }}
          >
            <Text style={{ fontFamily: FONT_BOLD, color: '#FFD700', fontSize: 14, letterSpacing: 2, textAlign: 'center', marginBottom: 14 }}>
              🏆  DEV — PICK A PULL
            </Text>
            {DEV_RARITIES.map((r) => (
              <Pressable
                key={r.rarity}
                onPress={() => {
                  setDevPickerOpen(false);
                  onDevPull(r.rarity);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: r.color,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>{r.emoji}</Text>
                <Text style={{ fontFamily: FONT_BOLD, color: '#1a1613', fontSize: 15, flex: 1 }}>
                  {r.label}
                </Text>
                <Text style={{ fontFamily: FONT_SEMIBOLD, color: 'rgba(0,0,0,0.6)', fontSize: 11 }}>
                  →
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setDevPickerOpen(false)} style={{ marginTop: 6, padding: 10 }}>
              <Text style={{ fontFamily: FONT_SEMIBOLD, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DEV box browser modal */}
      <Modal visible={devBoxBrowserOpen} transparent={true} animationType="slide" onRequestClose={() => setDevBoxBrowserOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#1a1613' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#444' }}>
              <Text style={{ flex: 1, fontFamily: FONT_BOLD, color: '#FFD700', fontSize: 16, letterSpacing: 2 }}>
                📦  BOX BROWSER
              </Text>
              <Pressable onPress={() => setDevBoxBrowserOpen(false)}>
                <Text style={{ fontFamily: FONT_BOLD, color: '#FFF', fontSize: 14 }}>Close ✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {(Object.entries(SHELVES) as [Shelf, { emoji: string; name: string }][]).map(([shelfId, meta]) => {
                const shelfSquishyCount = SQUISHIES.filter((s) => s.shelf === shelfId).length;
                return (
                  <View key={shelfId} style={{
                    backgroundColor: '#2A2228',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#444',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 20, marginRight: 8 }}>{meta.emoji}</Text>
                      <Text style={{ fontFamily: FONT_BOLD, color: '#FFF', fontSize: 14, flex: 1 }}>
                        {meta.name}
                      </Text>
                      <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 11 }}>
                        {shelfSquishyCount} squishies
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                          <Image
                            source={BOX_IMAGES[shelfId].closed}
                            style={{ width: 90, height: 90, resizeMode: 'contain' }}
                            fadeDuration={0}
                          />
                        </View>
                        <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
                          CLOSED
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                          <Image
                            source={BOX_IMAGES[shelfId].open}
                            style={{ width: 90, height: 90, resizeMode: 'contain' }}
                            fadeDuration={0}
                          />
                        </View>
                        <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
                          OPEN
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* VIP box — shown for all Beyond-Legendary pulls regardless of shelf */}
              <View style={{
                backgroundColor: '#2A2228',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: '#FFD700',
              }}>
                <Text style={{ fontFamily: FONT_BOLD, color: '#FFD700', fontSize: 14, marginBottom: 8, letterSpacing: 2 }}>
                  💎 VIP VAULT BOX
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={BOX_IMAGES.vip.closed} style={{ width: 90, height: 90, resizeMode: 'contain' }} fadeDuration={0} />
                    </View>
                    <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4 }}>CLOSED</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={BOX_IMAGES.vip.open} style={{ width: 90, height: 90, resizeMode: 'contain' }} fadeDuration={0} />
                    </View>
                    <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4 }}>OPEN</Text>
                  </View>
                </View>
              </View>

              {/* Plain fallback box */}
              <View style={{
                backgroundColor: '#2A2228',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#444',
              }}>
                <Text style={{ fontFamily: FONT_BOLD, color: '#FFF', fontSize: 14, marginBottom: 8 }}>
                  📦 Plain Brown (fallback)
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={BOX_IMAGES.plain.closed} style={{ width: 90, height: 90, resizeMode: 'contain' }} fadeDuration={0} />
                    </View>
                    <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4 }}>CLOSED</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 100, height: 100, backgroundColor: '#1a1613', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={BOX_IMAGES.plain.open} style={{ width: 90, height: 90, resizeMode: 'contain' }} fadeDuration={0} />
                    </View>
                    <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A8A8A', fontSize: 10, marginTop: 4 }}>OPEN</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

function NameEntryScreen({
  activeProfile,
  otherProfiles,
  onPickOpponent,
  onAddNew,
  onBack,
}: {
  activeProfile: Profile | null;
  otherProfiles: Profile[];
  onPickOpponent: (profileB: Profile) => void;
  onAddNew: () => void;
  onBack: () => void;
}) {
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.nameEntry}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 40, paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <OutlinedText size={34} color="#FFFFFF" outlineColor="#A5305A" outlineWidth={3}>
          Pick your opponent
        </OutlinedText>

        {activeProfile && (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 100, paddingLeft: 6, paddingRight: 16, paddingVertical: 6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', overflow: 'hidden', marginRight: 10 }}>
              <Image source={getAvatar(activeProfile.avatarId).image} style={{ width: 66, height: 66, position: 'absolute', top: -4, left: -11, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 15, color: '#FFFFFF' }}>
              You: {activeProfile.name}
            </Text>
          </View>
        )}

        <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 14, color: '#FFF', marginTop: 24, marginBottom: 16, textAlign: 'center' }}>
          Who are you playing with?
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {otherProfiles.map((p) => {
            const palette = getAvatarPalette(p.avatarId);
            return (
              <Pressable
                key={p.id}
                onPress={() => onPickOpponent(p)}
                style={{
                  width: 140,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  backgroundColor: palette.bg,
                  borderRadius: 20,
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: palette.accent,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <View style={{ width: 100, height: 100, overflow: 'hidden' }}>
                  <Image source={getAvatar(p.avatarId).image} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
                </View>
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 16, color: palette.accent, marginTop: 6 }}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onAddNew}
            style={{
              width: 140,
              paddingVertical: 14,
              paddingHorizontal: 8,
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderRadius: 20,
              alignItems: 'center',
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.9)',
              borderStyle: 'dashed',
              justifyContent: 'center',
              minHeight: 150,
            }}
          >
            <Text style={{ fontSize: 48, color: '#FFF' }}>+</Text>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 14, color: '#FFF', marginTop: 2 }}>
              Add Player
            </Text>
          </Pressable>
        </View>

        <Pressable style={{ marginTop: 24, padding: 10 }} onPress={onBack}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: FONT_SEMIBOLD }}>← Back</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

function WhosPlayingScreen({
  profiles,
  onPickProfile,
  onAddNew,
  onDeleteProfile,
}: {
  profiles: Profile[];
  onPickProfile: (p: Profile) => void;
  onAddNew: () => void;
  onDeleteProfile: (p: Profile) => void;
}) {
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.start}>
      <ScrollView contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' }}>
        <OutlinedText size={40} color="#FFFFFF" outlineColor="#8A3F00" outlineWidth={4}>
          Who's playing?
        </OutlinedText>
        <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 14, color: '#8A3F00', marginTop: 8, marginBottom: 24 }}>
          Tap your character to begin
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
          {profiles.map((p) => {
            const palette = getAvatarPalette(p.avatarId);
            return (
              <Pressable
                key={p.id}
                onPress={() => onPickProfile(p)}
                onLongPress={() => onDeleteProfile(p)}
                delayLongPress={700}
                style={{
                  width: 150,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  backgroundColor: palette.bg,
                  borderRadius: 24,
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: palette.accent,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 6,
                }}
              >
                <View style={{ width: 120, height: 120 }}>
                  <Image source={getAvatar(p.avatarId).image} style={{ width: 120, height: 120, resizeMode: 'contain' }} />
                </View>
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 18, color: palette.accent, marginTop: 4 }}>
                  {p.name}
                </Text>
                <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 11, color: palette.accent, opacity: 0.75, marginTop: 2 }}>
                  {uniqueSquishyIds(p).size} / 80  ·  💰 {p.coins}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onAddNew}
            style={{
              width: 150,
              paddingVertical: 12,
              paddingHorizontal: 8,
              backgroundColor: 'rgba(255,255,255,0.4)',
              borderRadius: 24,
              alignItems: 'center',
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.9)',
              borderStyle: 'dashed',
              justifyContent: 'center',
              minHeight: 170,
            }}
          >
            <Text style={{ fontSize: 56, color: '#FFF' }}>+</Text>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 15, color: '#FFF', marginTop: 2 }}>
              New Player
            </Text>
          </Pressable>
        </View>

        {profiles.length > 0 && (
          <Text style={{ fontFamily: FONT_REGULAR, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 24, textAlign: 'center' }}>
            Long-press a character to delete
          </Text>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function AddProfileScreen({
  usedAvatarIds,
  onCreate,
  onCancel,
  canCancel,
}: {
  usedAvatarIds: Set<string>;
  onCreate: (name: string, avatarId: string) => void;
  onCancel: () => void;
  canCancel: boolean;
}) {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canCreate = name.trim().length > 0 && selectedId !== null;

  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.avatarPicker}>
      {/* Warm amber bloom accents for alive feel */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255, 184, 0, 0.18)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -120, left: -120, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(153, 114, 204, 0.15)' }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 180 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center' }}>
            <OutlinedText size={34} color="#FFFFFF" outlineColor="#1A1A22" outlineWidth={3}>
              Pick Your Character
            </OutlinedText>
            <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, marginBottom: 18, letterSpacing: 0.5 }}>
              Scroll to find your match
            </Text>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            placeholder="Your name"
            placeholderTextColor="rgba(26,22,19,0.4)"
            style={{
              borderWidth: 0,
              borderRadius: 100,
              paddingHorizontal: 24,
              paddingVertical: 16,
              fontSize: 20,
              fontFamily: FONT_BOLD,
              marginBottom: 28,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#1a1613',
            }}
          />

          {AVATAR_SECTIONS.map((section) => (
            <View key={section.title} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ height: 2, width: 24, backgroundColor: 'rgba(255,255,255,0.4)', marginRight: 10 }} />
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 13, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  {section.title}
                </Text>
                <View style={{ height: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginLeft: 10 }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
                {section.data.map((avatar) => {
                  const taken = usedAvatarIds.has(avatar.id) && avatar.id !== selectedId;
                  const picked = selectedId === avatar.id;
                  return (
                    <Pressable
                      key={avatar.id}
                      onPress={() => !taken && setSelectedId(avatar.id)}
                      style={{
                        width: '47%',
                        aspectRatio: 0.85,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        opacity: taken ? 0.25 : 1,
                        paddingBottom: 10,
                      }}
                    >
                      {/* Glow halo behind picked avatar */}
                      {picked && (
                        <View style={{
                          position: 'absolute',
                          top: '10%',
                          left: '5%',
                          right: '5%',
                          bottom: '20%',
                          backgroundColor: 'rgba(255, 184, 0, 0.35)',
                          borderRadius: 1000,
                        }} />
                      )}
                      <Image
                        source={avatar.image}
                        style={{ width: '100%', height: '85%', resizeMode: 'contain' }}
                      />
                      <View style={{
                        marginTop: 4,
                        backgroundColor: picked ? '#FFB800' : 'rgba(255,255,255,0.12)',
                        paddingHorizontal: 14,
                        paddingVertical: 5,
                        borderRadius: 100,
                        borderWidth: picked ? 0 : 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                      }}>
                        <Text style={{
                          fontFamily: FONT_BOLD,
                          fontSize: 14,
                          color: picked ? '#2A1A00' : '#FFF',
                          letterSpacing: 0.5,
                        }}>
                          {avatar.name}{taken ? ' · taken' : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Sticky bottom action bar */}
        <View style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          paddingTop: 14, paddingBottom: 30, paddingHorizontal: 20,
          backgroundColor: 'rgba(26, 22, 30, 0.92)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
        }}>
          <ChunkyButton
            onPress={() => canCreate && onCreate(name.trim(), selectedId!)}
            color={BUBBLE_COLORS.primary}
            textColor={BUBBLE_COLORS.primaryText}
            shadowColor={BUBBLE_COLORS.primaryShadow}
            size="lg"
            disabled={!canCreate}
            style={{ minWidth: 260 }}
          >
            {selectedId
              ? `Create ${name.trim() || '...'} →`
              : 'Pick a character ↑'}
          </ChunkyButton>
          {canCancel && (
            <Pressable style={{ marginTop: 10, padding: 8 }} onPress={onCancel}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: FONT_SEMIBOLD }}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const SpotlitSlot = React.memo(function SpotlitSlot({
  squishy,
  owned,
  dupes,
  onPress,
}: {
  squishy: Squishy;
  owned: boolean;
  dupes: number;
  onPress?: (squishy: Squishy) => void;
}) {
  const handlePress = owned && onPress ? () => onPress(squishy) : undefined;
  return (
    <Pressable
      onPress={handlePress}
      style={{
        width: 68,
        alignItems: 'center',
        marginBottom: 4,
      }}>
      {/* Light fixture — small circular lamp */}
      <View style={{
        width: 18,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#2A1A00',
        marginBottom: 2,
      }}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 2,
          right: 2,
          height: 3,
          backgroundColor: owned ? '#FFE89E' : '#5A4030',
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }} />
      </View>

      {/* Spotlight cone (narrow top → wide bottom via overlapping gradients) */}
      <View style={{ width: 68, height: 72, alignItems: 'center', justifyContent: 'flex-end' }}>
        {owned && (
          <LinearGradient
            colors={['rgba(255, 229, 150, 0.75)', 'rgba(255, 215, 120, 0.25)', 'rgba(255, 180, 80, 0)'] as any}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              width: 54,
              height: 72,
              transform: [{ scaleX: 0.9 }],
              borderRadius: 2,
            }}
          />
        )}
        {/* Squishy image */}
        <Image
          source={squishy.image}
          fadeDuration={0}
          style={{
            width: 60,
            height: 60,
            resizeMode: 'contain',
            opacity: owned ? 1 : 0.15,
            tintColor: owned ? undefined : '#000',
          }}
        />
        {owned && dupes > 1 && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 2,
            backgroundColor: '#FFB800',
            borderRadius: 10,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderWidth: 1.5,
            borderColor: '#FFF',
          }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 9, color: '#2A1A00' }}>
              x{dupes}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const EDITION_META: Record<string, { label: string; emoji: string; color: string }> = {
  chrome:  { label: 'CHROME',  emoji: '🪞', color: '#C0C0C0' },
  crystal: { label: 'CRYSTAL', emoji: '💎', color: '#A5F0FF' },
  shadow:  { label: 'SHADOW',  emoji: '🌑', color: '#B48FEE' },
  mythic:  { label: 'MYTHIC',  emoji: '⚡', color: '#FFD700' },
};

const VaultSlot = React.memo(function VaultSlot({
  squishy,
  owned,
  isVip,
  onPress,
}: {
  squishy: Squishy;
  owned: boolean;
  isVip: boolean;
  onPress?: (squishy: Squishy) => void;
}) {
  const meta = EDITION_META[squishy.rarity];
  const canReveal = isVip || owned;
  const handlePress = owned && onPress ? () => onPress(squishy) : undefined;

  return (
    <Pressable
      onPress={handlePress}
      style={{ width: 70, alignItems: 'center' }}
    >
      {/* Shimmering holographic background behind the slot */}
      <View style={{
        width: 64,
        height: 64,
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <LinearGradient
          colors={canReveal
            ? ['rgba(255, 215, 0, 0.3)', 'rgba(165, 240, 255, 0.3)', 'rgba(180, 143, 238, 0.3)'] as any
            : ['rgba(255, 215, 0, 0.5)', 'rgba(165, 240, 255, 0.5)', 'rgba(180, 143, 238, 0.5)'] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Squishy image or padlock */}
        {canReveal ? (
          <Image
            source={squishy.image}
            fadeDuration={0}
            style={{
              width: 54,
              height: 54,
              resizeMode: 'contain',
              opacity: owned ? 1 : 0.25,
              tintColor: owned ? undefined : '#000',
            }}
          />
        ) : (
          <Text style={{ fontSize: 28 }}>🔒</Text>
        )}
      </View>

      {/* Edition label badge */}
      <View style={{
        marginTop: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        backgroundColor: meta.color,
        borderRadius: 6,
      }}>
        <Text style={{
          fontFamily: FONT_BOLD,
          fontSize: 8,
          color: '#1a1613',
          letterSpacing: 1,
        }}>
          {meta.emoji} {meta.label}
        </Text>
      </View>
    </Pressable>
  );
});

const WoodenShelf = React.memo(function WoodenShelf({
  shelfId,
  shelfMeta,
  profile,
  owned,
  onSquishyPress,
}: {
  shelfId: Shelf;
  shelfMeta: { emoji: string; name: string };
  profile: Profile;
  owned: Set<string>;
  onSquishyPress?: (squishy: Squishy) => void;
}) {
  const shelfSquishies = SQUISHIES.filter((s) => s.shelf === shelfId);
  // Split: base (common/rare/legendary) vs vault (chrome/crystal/shadow/mythic)
  const baseSquishies = shelfSquishies.filter((s) => !isBeyondLegendary(s.rarity));
  const vaultSquishies = shelfSquishies.filter((s) => isBeyondLegendary(s.rarity));
  const baseOwnedCount = baseSquishies.filter((s) => owned.has(s.id)).length;
  const vaultOwnedCount = vaultSquishies.filter((s) => owned.has(s.id)).length;

  // Chunk base into rows of 4
  const baseRows: Squishy[][] = [];
  for (let i = 0; i < baseSquishies.length; i += 4) {
    baseRows.push(baseSquishies.slice(i, i + 4));
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Decorative shelf label plaque */}
      <View style={{
        alignSelf: 'center',
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 4,
        backgroundColor: '#4A2E18',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#8B5E3B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 10, color: '#D9A878', letterSpacing: 1.5, marginRight: 6 }}>
          ❦
        </Text>
        <Text style={{
          fontFamily: FONT_BOLD,
          fontSize: 11,
          color: '#F5E6C8',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          {shelfMeta.name} Collection
        </Text>
        <Text style={{
          fontFamily: FONT_SEMIBOLD,
          fontSize: 10,
          color: '#D9A878',
          marginLeft: 6,
        }}>
          {baseOwnedCount}/{baseSquishies.length}
        </Text>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 10, color: '#D9A878', letterSpacing: 1.5, marginLeft: 6 }}>
          ❦
        </Text>
      </View>

      {/* Base rows: spotlights + squishies + wooden plank underneath */}
      {baseRows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ marginBottom: 4 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: 2,
          }}>
            {row.map((s) => (
              <SpotlitSlot
                key={s.id}
                squishy={s}
                owned={owned.has(s.id)}
                dupes={duplicateCount(profile, s.id)}
                onPress={onSquishyPress}
              />
            ))}
            {Array.from({ length: 4 - row.length }).map((_, i) => (
              <View key={`pad-${i}`} style={{ width: 68 }} />
            ))}
          </View>

          <LinearGradient
            colors={['#C8956B', '#A47046', '#6D4621'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 10,
              borderTopWidth: 1,
              borderTopColor: '#D9A878',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 2,
            }}
          />
          <View style={{
            height: 4,
            backgroundColor: 'rgba(20, 10, 0, 0.5)',
          }} />
        </View>
      ))}

      {/* 💎 VIP VAULT ROW — distinct holographic treatment */}
      {vaultSquishies.length > 0 && (
        <View style={{ marginTop: 2 }}>
          {/* Iridescent banner */}
          <View style={{
            alignSelf: 'center',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 4,
            marginBottom: 4,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['#FFD700', '#A5F0FF', '#B48FEE', '#FFD700'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={{
              fontFamily: FONT_BOLD,
              fontSize: 9,
              color: '#1a1613',
              letterSpacing: 2.5,
              textShadowColor: 'rgba(255,255,255,0.6)',
              textShadowRadius: 1,
            }}>
              💎  VIP VAULT  💎  {vaultOwnedCount}/{vaultSquishies.length}
            </Text>
          </View>

          {/* Vault row with holographic back wall */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: 2,
            paddingVertical: 6,
            backgroundColor: 'rgba(255, 215, 0, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 215, 0, 0.3)',
            borderRadius: 6,
          }}>
            {vaultSquishies.map((s) => (
              <VaultSlot
                key={s.id}
                squishy={s}
                owned={owned.has(s.id)}
                isVip={profile.isVip}
                onPress={onSquishyPress}
              />
            ))}
          </View>

          {/* Gold shelf plank (fancier than base shelf) */}
          <LinearGradient
            colors={['#FFE89E', '#D4AF37', '#8B6F2E'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 10,
              marginTop: 2,
              borderTopWidth: 1,
              borderTopColor: '#FFF2A8',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 2,
            }}
          />
          <View style={{
            height: 4,
            backgroundColor: 'rgba(20, 10, 0, 0.5)',
          }} />

          {/* CTA for free users */}
          {!profile.isVip && (
            <View style={{
              alignSelf: 'center',
              marginTop: 4,
              paddingHorizontal: 10,
              paddingVertical: 3,
              backgroundColor: '#FFB800',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: '#8A5F00',
            }}>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 9, color: '#2A1A00', letterSpacing: 1 }}>
                ✨ UNLOCK VAULT · $6.99 ✨
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// Interior opening as % of the FRAME IMAGE (not container).
// Measured directly from the generated 1024x1024 cabinet-frame.png:
//   painted cutout = pixels 325-720 horizontal × 207-882 vertical
// Shelf container is sized relative to a wrapper that matches the image aspect,
// so these percentages map 1:1 to image pixels — no runtime math required.
const FRAME_INTERIOR = {
  top: 207 / 1024,      // 0.202
  bottom: (1024 - 882) / 1024,  // 0.139
  left: 325 / 1024,     // 0.317
  right: (1024 - 720) / 1024,   // 0.297
};

function rarityLabel(r: Rarity): string {
  if (r === 'legendary') return 'Legendary';
  if (r === 'rare') return 'Rare';
  return 'Common';
}

function TradingCardModal({
  squishy,
  dupes,
  onClose,
  onSell,
}: {
  squishy: Squishy | null;
  dupes: number;
  onClose: () => void;
  onSell?: (squishy: Squishy) => void;
}) {
  const [confirmSellOpen, setConfirmSellOpen] = useState(false);

  const sellValue = squishy ? coinValueFor(squishy) : 0;
  const sellsLastCopy = dupes === 1;

  if (!squishy) return null;

  function handleSellPress() {
    if (!onSell) return;
    if (!squishy) return;
    if (sellsLastCopy) {
      setConfirmSellOpen(true);
    } else {
      onSell(squishy);
    }
  }

  function confirmSell() {
    setConfirmSellOpen(false);
    if (onSell && squishy) onSell(squishy);
  }

  const rarityBg =
    squishy.rarity === 'legendary' ? '#FFD54F' :
    squishy.rarity === 'rare' ? '#C8A4F0' :
    '#D5E8D4';
  const rarityText =
    squishy.rarity === 'legendary' ? '#5A4300' :
    squishy.rarity === 'rare' ? '#4A2E78' :
    '#2E5E35';

  return (
    <Modal visible={true} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={{
            width: '85%',
            maxWidth: 340,
            backgroundColor: '#FFF8EA',
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 4,
            borderColor: '#8B5E3B',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 15,
          }}
          onPress={() => {}}
        >
          {/* Rarity badge strip at top */}
          <View style={{
            paddingVertical: 6,
            backgroundColor: rarityBg,
            alignItems: 'center',
          }}>
            <Text style={{
              fontFamily: FONT_BOLD,
              fontSize: 12,
              letterSpacing: 2.5,
              color: rarityText,
              textTransform: 'uppercase',
            }}>
              {squishy.rarity === 'legendary' ? '🏆 Legendary' :
               squishy.rarity === 'rare' ? '🥈 Rare' :
               rarityLabel(squishy.rarity)}
            </Text>
          </View>

          {/* Hero image */}
          <View style={{
            padding: 16,
            paddingBottom: 8,
            alignItems: 'center',
            backgroundColor: '#FFF8EA',
          }}>
            <Image
              source={squishy.image}
              fadeDuration={0}
              style={{ width: 180, height: 180, resizeMode: 'contain' }}
            />
          </View>

          {/* Name + species */}
          <View style={{ alignItems: 'center', paddingHorizontal: 16, marginTop: -8 }}>
            <OutlinedText size={30} color="#FFFFFF" outlineColor="#8B5E3B" outlineWidth={3}>
              {squishy.name}
            </OutlinedText>
            <Text style={{
              fontFamily: FONT_SEMIBOLD,
              fontSize: 13,
              color: '#8B5E3B',
              marginTop: 2,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              {squishy.species}
            </Text>
          </View>

          {/* Birthday + Favorite — tag card inside */}
          <View style={{
            marginHorizontal: 16,
            marginTop: 14,
            marginBottom: 14,
            backgroundColor: '#FFECC9',
            borderRadius: 14,
            padding: 14,
            borderWidth: 2,
            borderColor: '#D4A574',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🎂</Text>
              <View>
                <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 10, color: '#8B5E3B', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Birthday
                </Text>
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 16, color: '#2A1A00' }}>
                  {squishy.birthday}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>💛</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 10, color: '#8B5E3B', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {squishy.favorite.category}
                </Text>
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 15, color: '#2A1A00' }}>
                  {squishy.favorite.value}
                </Text>
              </View>
            </View>
          </View>

          {dupes > 1 && (
            <View style={{
              alignSelf: 'center',
              marginBottom: 10,
              backgroundColor: '#FFB800',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 100,
              borderWidth: 2,
              borderColor: '#8A3F00',
            }}>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, color: '#2A1A00' }}>
                You have ×{dupes}
              </Text>
            </View>
          )}

          {/* Sell + Close buttons */}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
            {onSell && (
              <ChunkyButton
                onPress={handleSellPress}
                color="#FFECA8"
                textColor="#8A5F00"
                shadowColor="#CC9000"
                size="sm"
              >
                💰 Sell · {sellValue}
              </ChunkyButton>
            )}
            <ChunkyButton
              onPress={onClose}
              color={BUBBLE_COLORS.secondary}
              textColor={BUBBLE_COLORS.secondaryText}
              shadowColor={BUBBLE_COLORS.secondaryShadow}
              size="sm"
            >
              Close
            </ChunkyButton>
          </View>
        </Pressable>
      </Pressable>

      {/* Sell confirmation modal — fires when selling last copy */}
      <Modal visible={confirmSellOpen} transparent={true} animationType="fade" onRequestClose={() => setConfirmSellOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 20 }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>⚠️</Text>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 18, color: '#1a1613', textAlign: 'center', marginBottom: 6 }}>
              Last one!
            </Text>
            <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
              This is your only {squishy.name}. If you sell it, you'll lose them from your collection. Are you sure?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ChunkyButton
                onPress={() => setConfirmSellOpen(false)}
                color={BUBBLE_COLORS.secondary}
                textColor={BUBBLE_COLORS.secondaryText}
                shadowColor={BUBBLE_COLORS.secondaryShadow}
                size="sm"
              >
                Keep it
              </ChunkyButton>
              <ChunkyButton
                onPress={confirmSell}
                color={BUBBLE_COLORS.coral}
                textColor={BUBBLE_COLORS.coralText}
                shadowColor={BUBBLE_COLORS.coralShadow}
                size="sm"
              >
                Sell for {sellValue}
              </ChunkyButton>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function TrophyRoomScreen({
  profile,
  onBack,
  onSellSquishy,
  onWatchAdForFreePull,
  freePullsRemaining,
}: {
  profile: Profile;
  onBack: () => void;
  onSellSquishy: (squishy: Squishy) => void;
  onWatchAdForFreePull: () => void;
  freePullsRemaining: number;
}) {
  const owned = uniqueSquishyIds(profile);
  const avatar = getAvatar(profile.avatarId);
  const [cardSquishy, setCardSquishy] = useState<Squishy | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#2E1F15' }}>
      {/* Warm walnut room background */}
      <LinearGradient
        colors={['#5A3D2A', '#4A3220', '#2E1F15'] as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Soft warm glow at top of room */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 180,
        backgroundColor: 'rgba(255, 200, 120, 0.08)',
      }} />

      {/* Header — only this uses SafeAreaView for top inset */}
      <SafeAreaView style={{ zIndex: 10 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2, alignItems: 'center' }}>
          <OutlinedText size={22} color="#FFECC9" outlineColor="#2A1A00" outlineWidth={2}>
            {profile.name}'s Trophy Room
          </OutlinedText>
          <View style={{
            marginTop: 2,
            backgroundColor: 'rgba(255, 220, 150, 0.95)',
            paddingHorizontal: 14,
            paddingVertical: 3,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: '#8B5E3B',
          }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, color: '#2A1A00' }}>
              {owned.size} / 80 collected  ·  💰 {profile.coins}
            </Text>
          </View>

          <Pressable
            onPress={freePullsRemaining > 0 ? onWatchAdForFreePull : undefined}
            disabled={freePullsRemaining <= 0}
            style={{
              marginTop: 8,
              backgroundColor: freePullsRemaining > 0 ? '#FFB800' : 'rgba(255,255,255,0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 100,
              borderWidth: 2,
              borderColor: freePullsRemaining > 0 ? '#8A3F00' : 'rgba(255,255,255,0.25)',
              flexDirection: 'row',
              alignItems: 'center',
              opacity: freePullsRemaining > 0 ? 1 : 0.6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>🎬</Text>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 13, color: freePullsRemaining > 0 ? '#2A1A00' : '#FFECC9' }}>
              {freePullsRemaining > 0 ? 'Watch for a Free Squishy!' : 'Free squishies back tomorrow'}
            </Text>
            {freePullsRemaining > 0 && (
              <View style={{ marginLeft: 8, backgroundColor: '#2A1A00', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 100 }}>
                <Text style={{ fontFamily: FONT_BOLD, fontSize: 10, color: '#FFECC9' }}>
                  {freePullsRemaining}/{AD_DAILY_LIMIT}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Peeking character — rendered OUTSIDE cabinet overflow:hidden so it never clips.
          Positioned at top-right where header ends / cabinet begins. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 90,         // just below header area
          right: 30,
          width: 120,
          height: 110,
          zIndex: 100,
          transform: [{ rotate: '-6deg' }],
        }}
      >
        <Image
          source={avatar.image}
          fadeDuration={0}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
      </View>

      {/* Cabinet area — fills EVERYTHING from bottom of header to screen bottom */}
      <View style={{ flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>

        {/* UNIFIED WRAPPER — frame image + shelves live in the same coordinate space.
            Wrapper has the exact aspect ratio of the frame image (1:1),
            so image-coordinate percentages work directly on the shelf container. */}
        <View style={{
          height: '100%',
          aspectRatio: 1,
          position: 'relative',
          transform: [{ scale: 1.06 }],
        }}>
          {/* Frame image — fills wrapper exactly, no distortion */}
          <Image
            source={require('./assets/images/room/cabinet-frame.png')}
            fadeDuration={0}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
            }}
          />

          {/* Shelves — positioned at EXACT image-coordinate percentages.
              Because wrapper aspect = image aspect, these percentages align perfectly. */}
          <View style={{
            position: 'absolute',
            top: `${FRAME_INTERIOR.top * 100}%`,
            bottom: `${FRAME_INTERIOR.bottom * 100}%`,
            left: `${FRAME_INTERIOR.left * 100}%`,
            right: `${FRAME_INTERIOR.right * 100}%`,
            backgroundColor: '#2E1F15',
            overflow: 'hidden',
            zIndex: 20,
          }}>
            <ScrollView
              contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 2 }}
              showsVerticalScrollIndicator={false}
            >
              {(Object.entries(SHELVES) as [Shelf, { emoji: string; name: string }][]).map(
                ([shelfId, shelfMeta]) => (
                  <WoodenShelf
                    key={shelfId}
                    shelfId={shelfId}
                    shelfMeta={shelfMeta}
                    profile={profile}
                    owned={owned}
                    onSquishyPress={setCardSquishy}
                  />
                )
              )}
            </ScrollView>
          </View>
        </View>

        {/* Trading card modal */}
        <TradingCardModal
          squishy={cardSquishy}
          dupes={cardSquishy ? duplicateCount(profile, cardSquishy.id) : 0}
          onClose={() => setCardSquishy(null)}
          onSell={(s) => {
            onSellSquishy(s);
            // If that was the last copy, close the card
            if (duplicateCount(profile, s.id) <= 1) {
              setCardSquishy(null);
            }
          }}
        />
      </View>

      {/* Floating back button — bottom safe area respected, overlays baseboard */}
      <SafeAreaView style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 30,
      }} pointerEvents="box-none">
        <View style={{ alignItems: 'center', paddingBottom: 4 }} pointerEvents="box-none">
          <ChunkyButton
            onPress={onBack}
            color={BUBBLE_COLORS.secondary}
            textColor={BUBBLE_COLORS.secondaryText}
            shadowColor={BUBBLE_COLORS.secondaryShadow}
            size="md"
          >
            ← Back
          </ChunkyButton>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CategorySelectScreen({
  onPick,
  onBack,
}: {
  onPick: (c: Category) => void;
  onBack: () => void;
}) {
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.categorySelect}>
      <View style={{ flex: 1, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <OutlinedText size={32} color="#FFFFFF" outlineColor="#3F2578" outlineWidth={3}>
            Pick a category
          </OutlinedText>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {WORD_BANK.map((category) => (
            <Pressable
              key={category.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: 14,
                borderRadius: 20,
                marginBottom: 10,
              }}
              onPress={() => onPick(category)}
            >
              <Text style={{ fontSize: 36, marginRight: 14 }}>{category.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontFamily: FONT_BOLD, color: '#1a1613' }}>{category.name}</Text>
                <Text style={{ fontSize: 12, color: '#7A5BC8', fontFamily: FONT_SEMIBOLD }}>
                  {category.words.length} words
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ alignItems: 'center' }}>
          <ChunkyButton
            onPress={onBack}
            color={BUBBLE_COLORS.secondary}
            textColor={BUBBLE_COLORS.secondaryText}
            shadowColor={BUBBLE_COLORS.secondaryShadow}
            size="md"
          >
            ← Back
          </ChunkyButton>
        </View>
      </View>
    </ScreenBackground>
  );
}

function ScreenBackground({
  gradient = SCREEN_GRADIENTS.start,
  children,
}: {
  gradient?: string[];
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {children}
      </SafeAreaView>
    </View>
  );
}

function ChunkyButton({
  onPress,
  color = BUBBLE_COLORS.primary,
  textColor = BUBBLE_COLORS.primaryText,
  shadowColor = BUBBLE_COLORS.primaryShadow,
  size = 'md',
  disabled = false,
  children,
  style,
}: {
  onPress: () => void;
  color?: string;
  textColor?: string;
  shadowColor?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  style?: any;
}) {
  const sizes = {
    sm: { padV: 10, padH: 20, fontSize: 15 },
    md: { padV: 14, padH: 32, fontSize: 18 },
    lg: { padV: 18, padH: 40, fontSize: 22 },
  };
  const s = sizes[size];
  return (
    <View
      style={[
        {
          borderRadius: 100,
          backgroundColor: shadowColor,
          padding: 0,
          marginBottom: 4,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => ({
          backgroundColor: disabled ? '#B5B5B5' : color,
          paddingHorizontal: s.padH,
          paddingVertical: s.padV,
          borderRadius: 100,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateY: pressed ? 3 : -3 }],
        })}
      >
        <Text
          style={{
            fontFamily: FONT_BOLD,
            fontSize: s.fontSize,
            color: textColor,
            textAlign: 'center',
            letterSpacing: 0.3,
          }}
        >
          {children}
        </Text>
      </Pressable>
    </View>
  );
}

function PlaceholderScreen({
  title,
  subtitle,
  buttonLabel,
  onPress,
  gradient = SCREEN_GRADIENTS.handoff,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  gradient?: string[];
}) {
  return (
    <ScreenBackground gradient={gradient}>
      <View style={styles.placeholderContainer}>
        <OutlinedText size={40} color="#FFFFFF" outlineColor="#3F2578" outlineWidth={3}>
          {title}
        </OutlinedText>
        <Text style={{
          fontFamily: FONT_SEMIBOLD,
          fontSize: 16,
          color: '#3F2578',
          textAlign: 'center',
          marginTop: 16,
          marginBottom: 32,
          lineHeight: 22,
          paddingHorizontal: 24,
        }}>
          {subtitle}
        </Text>
        <ChunkyButton
          onPress={onPress}
          color={BUBBLE_COLORS.primary}
          textColor={BUBBLE_COLORS.primaryText}
          shadowColor={BUBBLE_COLORS.primaryShadow}
          size="lg"
          style={{ minWidth: 220 }}
        >
          {buttonLabel}
        </ChunkyButton>
      </View>
    </ScreenBackground>
  );
}

type Validation = {
  valid: boolean;
  warning: boolean;
  message: string;
  suggestions?: string[];
};

function validateWord(word: string): Validation {
  if (word.length === 0) {
    return {
      valid: false,
      warning: false,
      message: 'Type a word or phrase to begin.',
    };
  }
  if (word.length < 3) {
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
    const suggestions = suggestForPhrase(word);
    return {
      valid: true,
      warning: true,
      message: "⚠ Can't verify this is a real word. Lock in if you're sure.",
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  return {
    valid: true,
    warning: false,
    message: '✓ Great word — ready to lock in.',
  };
}

function WordEntryScreen({
  playerLabel,
  playerAvatarId,
  roundsWonA,
  roundsWonB,
  onLockWord,
}: {
  playerLabel: string;
  playerAvatarId: string | null;
  roundsWonA: number;
  roundsWonB: number;
  onLockWord: (word: string) => void;
}) {
  const [input, setInput] = useState('');
  const [llmResult, setLlmResult] = useState<AiValidation | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [zaiaPopupOpen, setZaiaPopupOpen] = useState(false);
  const normalized = input.trim().toUpperCase();
  const localValidation = validateWord(normalized);

  // Haptic ping whenever zAIa pops up — gentle "look at me"
  useEffect(() => {
    if (zaiaPopupOpen) haptics.zaiaAttention();
  }, [zaiaPopupOpen]);

  // When input changes, debounce an LLM check if local is uncertain.
  useEffect(() => {
    setLlmResult(null);
    setLlmLoading(false);
    setZaiaPopupOpen(false);
    if (!localValidation.warning) return;
    if (normalized.length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLlmLoading(true);
      const result = await aiValidate(normalized);
      if (cancelled) return;
      setLlmLoading(false);
      setLlmResult(result);
      if (result.source === 'llm') {
        setZaiaPopupOpen(true);
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  // Build "effective" validation combining local + LLM
  const effective: {
    valid: boolean;
    warning: boolean;
    message: string;
    loading: boolean;
    fromLlm: boolean;
  } = llmLoading
    ? {
        valid: false,
        warning: false,
        message: '✨ zAIa is thinking...',
        loading: true,
        fromLlm: false,
      }
    : localValidation.warning && llmResult?.source === 'llm'
    ? {
        valid: llmResult.valid,
        warning: !llmResult.valid,
        message: llmResult.message,
        loading: false,
        fromLlm: true,
      }
    : {
        valid: localValidation.valid,
        warning: localValidation.warning,
        message: localValidation.message,
        loading: false,
        fromLlm: false,
      };

  async function handleSubmit() {
    if (effective.loading) return;

    // If local validation is uncertain, force zAIa to check inline before locking.
    if (localValidation.warning) {
      if (llmResult) {
        if (!llmResult.valid) {
          setZaiaPopupOpen(true);
          return;
        }
        // LLM already approved — fall through to lock
      } else {
        setLlmLoading(true);
        const result = await aiValidate(normalized);
        setLlmLoading(false);
        setLlmResult(result);
        if (!result.valid) {
          setZaiaPopupOpen(true);
          return;
        }
        // LLM says valid — fall through to lock
      }
    } else if (!localValidation.valid) {
      return;
    }

    RNKeyboard.dismiss();
    onLockWord(normalized);
  }

  function handleUseSuggestion(suggestion: string) {
    const upperSuggestion = suggestion.toUpperCase();
    setInput(upperSuggestion);
    setZaiaPopupOpen(false);
    RNKeyboard.dismiss();
    onLockWord(upperSuggestion);
  }

  function handleLockFromPopup() {
    setZaiaPopupOpen(false);
    RNKeyboard.dismiss();
    onLockWord(normalized);
  }

  function handleTryAgainFromPopup() {
    setZaiaPopupOpen(false);
  }

  return (
    <ScreenBackground gradient={playerAvatarId ? getAvatarPalette(playerAvatarId).gradient : SCREEN_GRADIENTS.wordEntry}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.entryScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MatchScore roundsWonA={roundsWonA} roundsWonB={roundsWonB} compact />

        <Text style={styles.entryPlayerLabel}>{playerLabel}</Text>
        <Text style={styles.entryTitle}>Enter your secret word</Text>
        <Text style={styles.entryHint}>
          Only you see this. Pass to the other player after.
        </Text>

        <TextInput
          value={input}
          onChangeText={setInput}
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
          maxLength={25}
          placeholder="Type word or phrase..."
          placeholderTextColor="#aaa"
          style={styles.entryInput}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          enablesReturnKeyAutomatically={true}
        />

        <Text
          style={[
            styles.entryValidation,
            !effective.valid && !effective.loading && styles.entryValidBad,
            effective.valid && !effective.warning && styles.entryValidOk,
            effective.warning && styles.entryValidWarning,
            effective.loading && { color: '#7a5fa0' },
          ]}
        >
          {effective.message}
          {effective.fromLlm ? '  ✨' : ''}
        </Text>

        {/* Suggestions removed per kid-test 2026-10-02 — too intrusive during active play. Validation warning still shows below. */}

        <Text style={styles.entryTip}>
          💡 Tip: tap the 🎤 next to the spacebar to speak your word.
          Not showing? Settings → General → Keyboard → Enable Dictation.
        </Text>

        <Text style={styles.entryRules}>
          3–25 characters · letters, spaces, apostrophes, hyphens · at least
          one vowel
        </Text>

        <Pressable
          disabled={!effective.valid || effective.loading}
          style={[
            styles.primaryButton,
            (!effective.valid || effective.loading) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {effective.loading ? 'Checking...' : 'Lock Word →'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.dismissKeyboardLink}
          onPress={() => RNKeyboard.dismiss()}
        >
          <Text style={styles.dismissKeyboardLinkText}>
            ⌨︎ Hide keyboard
          </Text>
        </Pressable>
      </ScrollView>


      {/* zAIa pop-up — fires when LLM gives a verdict */}
      <Modal
        visible={zaiaPopupOpen && !!llmResult}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setZaiaPopupOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { alignItems: 'center', paddingTop: 28 }]}>
            <ZaiaAvatar
              mood={llmResult?.valid ? 'happy' : 'uncertain'}
              size={110}
            />
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 2.5,
                color: '#7a5fa0',
                textTransform: 'uppercase',
                fontWeight: '700',
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              zAIa says
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: '#1a1613',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 20,
                fontStyle: 'italic',
                paddingHorizontal: 10,
              }}
            >
              "{llmResult?.message}"
            </Text>

            {llmResult?.valid && (
              <Pressable
                style={[styles.primaryButton, { paddingHorizontal: 36 }]}
                onPress={handleLockFromPopup}
              >
                <Text style={styles.primaryButtonText}>Lock it in →</Text>
              </Pressable>
            )}

            {llmResult && !llmResult.valid && llmResult.suggestion && (
              <>
                <Pressable
                  style={[
                    styles.primaryButton,
                    { paddingHorizontal: 24, marginBottom: 10 },
                  ]}
                  onPress={() => handleUseSuggestion(llmResult.suggestion!)}
                >
                  <Text style={styles.primaryButtonText}>
                    Use "{llmResult.suggestion}"
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleTryAgainFromPopup}
                >
                  <Text style={styles.secondaryButtonText}>Let me try again</Text>
                </Pressable>
              </>
            )}

            {llmResult && !llmResult.valid && !llmResult.suggestion && (
              <Pressable
                style={[styles.primaryButton, { paddingHorizontal: 36 }]}
                onPress={handleTryAgainFromPopup}
              >
                <Text style={styles.primaryButtonText}>Let me try again</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

function ZaiaAvatar({
  mood = 'listening',
  size = 110,
}: {
  mood?: 'listening' | 'thinking' | 'uncertain' | 'happy';
  size?: number;
}) {
  // Subtle mood tilt — ears/body slight rotation
  const rotation =
    mood === 'uncertain' ? '-6deg' : mood === 'happy' ? '4deg' : '0deg';

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('./assets/images/characters/zaia.png')}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          transform: [{ rotate: rotation }],
        }}
      />
    </View>
  );
}

type HintType = 'letter' | 'firstLetter' | 'vowels' | 'extraLife' | 'skip';

const HINT_OPTIONS: { type: HintType; label: string; emoji: string; cost: number; description: string }[] = [
  { type: 'letter',      label: 'Reveal a Letter',      emoji: '🔤', cost: 20, description: 'Reveals one random correct letter' },
  { type: 'firstLetter', label: 'Reveal First Letter',  emoji: '🎯', cost: 15, description: 'Reveals the first letter of the word' },
  { type: 'vowels',      label: 'Reveal All Vowels',    emoji: '🎵', cost: 30, description: 'Reveals A, E, I, O, U where they appear' },
  { type: 'extraLife',   label: 'Extra Life',           emoji: '🆘', cost: 40, description: 'One extra wrong guess allowed' },
  { type: 'skip',        label: 'Skip Round',           emoji: '🏃', cost: 50, description: 'End this round with no squishy, no penalty' },
];

const MAX_HINTS_PER_ROUND = 2;

function GameScreen({
  mode,
  currentPlayer,
  currentPlayerName,
  secretWord,
  guessed,
  wrongCount,
  consecutiveCorrect,
  roundsWonA,
  roundsWonB,
  soloCategory,
  onLetterPress,
  onSolvePress,
  onQuit,
  activeProfile,
  hintsUsedThisRound,
  onBuyHint,
  onWatchAdForCoins,
  coinAdsRemaining,
}: {
  mode: Mode;
  currentPlayer: Player;
  currentPlayerName: string;
  secretWord: string;
  guessed: string[];
  wrongCount: number;
  consecutiveCorrect: number;
  roundsWonA: number;
  roundsWonB: number;
  soloCategory: Category | null;
  onLetterPress: (letter: string) => void;
  onSolvePress: () => void;
  onQuit: () => void;
  activeProfile: Profile | null;
  hintsUsedThisRound: number;
  onBuyHint: (type: HintType, cost: number) => void;
  onWatchAdForCoins: () => void;
  coinAdsRemaining: number;
}) {
  const [hintMenuOpen, setHintMenuOpen] = useState(false);
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.playing}>
    <Pressable
      onPress={onQuit}
      style={{
        position: 'absolute',
        top: 54,
        left: 14,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <Text style={{ fontSize: 20 }}>🏠</Text>
    </Pressable>
    <View style={styles.gameContainer}>
      {mode === '2player' ? (
        <>
          <MatchScore roundsWonA={roundsWonA} roundsWonB={roundsWonB} compact />
          <Text style={styles.gameTurnLabel}>
            {currentPlayerName}'s turn
          </Text>
          <Text style={styles.gameSubtle}>
            Guessing the opponent's word · streak {consecutiveCorrect}/
            {MAX_CONSECUTIVE}
          </Text>
        </>
      ) : (
        <>
          <View style={styles.soloCategoryTag}>
            <Text style={styles.soloCategoryText}>
              {soloCategory?.emoji} {soloCategory?.name}
            </Text>
          </View>
          <Text style={styles.gameTurnLabel}>Can you guess the word?</Text>
          <Text style={styles.gameSubtle}>Solo mode</Text>
        </>
      )}

      <Gallows wrongCount={wrongCount} />
      <WordDisplay word={secretWord} guessed={guessed} reveal={false} />

      <Keyboard
        guessed={guessed}
        secretWord={secretWord}
        disabled={false}
        onPress={onLetterPress}
      />

      <Pressable style={styles.solveButton} onPress={onSolvePress}>
        <Text style={styles.solveButtonText}>🎯 Solve the Puzzle</Text>
      </Pressable>

      {/* Hints chip — bottom-right corner */}
      {activeProfile && (
        <Pressable
          onPress={() => setHintMenuOpen(true)}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 14,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFECA8',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 100,
            borderWidth: 1.5,
            borderColor: '#8A5F00',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
            zIndex: 20,
          }}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>💡</Text>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, color: '#8A5F00' }}>
            Hints · 💰 {activeProfile.coins}
          </Text>
        </Pressable>
      )}

      {/* Hint menu modal */}
      <Modal visible={hintMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setHintMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setHintMenuOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={{
              width: '85%',
              maxWidth: 340,
              backgroundColor: '#FFF8EA',
              borderRadius: 20,
              padding: 16,
              borderWidth: 2,
              borderColor: '#8A5F00',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 16, color: '#8A5F00', letterSpacing: 2 }}>
                💡  HINTS  💡
              </Text>
              <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 11, color: '#8A5F00', marginTop: 2 }}>
                You have 💰 {activeProfile?.coins ?? 0}  ·  Used {hintsUsedThisRound}/{MAX_HINTS_PER_ROUND} this round
              </Text>
            </View>

            {(activeProfile?.coins ?? 0) < 15 && coinAdsRemaining > 0 && (
              <Pressable
                onPress={() => {
                  setHintMenuOpen(false);
                  onWatchAdForCoins();
                }}
                style={{
                  backgroundColor: '#FFB800',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#8A3F00',
                }}
              >
                <Text style={{ fontSize: 22, marginRight: 10 }}>🎬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT_BOLD, fontSize: 13, color: '#2A1A00' }}>
                    Watch Ad — Get 💰 {COINS_PER_AD}
                  </Text>
                  <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 10, color: '#2A1A00', marginTop: 1, opacity: 0.75 }}>
                    Free coins to afford a hint
                  </Text>
                </View>
                <View style={{ backgroundColor: '#2A1A00', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 }}>
                  <Text style={{ fontFamily: FONT_BOLD, fontSize: 10, color: '#FFECC9' }}>
                    {coinAdsRemaining}/{AD_DAILY_LIMIT}
                  </Text>
                </View>
              </Pressable>
            )}

            {HINT_OPTIONS.map((hint) => {
              const canAfford = (activeProfile?.coins ?? 0) >= hint.cost;
              const underLimit = hintsUsedThisRound < MAX_HINTS_PER_ROUND;
              const enabled = canAfford && underLimit;
              return (
                <Pressable
                  key={hint.type}
                  onPress={() => {
                    if (!enabled) return;
                    setHintMenuOpen(false);
                    onBuyHint(hint.type, hint.cost);
                  }}
                  style={{
                    backgroundColor: enabled ? '#FFECA8' : '#E8E0D0',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginBottom: 6,
                    opacity: enabled ? 1 : 0.5,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{hint.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT_BOLD, fontSize: 13, color: '#1a1613' }}>
                      {hint.label}
                    </Text>
                    <Text style={{ fontFamily: FONT_SEMIBOLD, fontSize: 10, color: '#555', marginTop: 1 }}>
                      {hint.description}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: enabled ? '#FFB800' : '#AAA',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                  }}>
                    <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, color: '#2A1A00' }}>
                      💰 {hint.cost}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable onPress={() => setHintMenuOpen(false)} style={{ marginTop: 6, padding: 8 }}>
              <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#8A5F00', textAlign: 'center' }}>
                Close
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </ScreenBackground>
  );
}

function SolvePuzzleModal({
  visible,
  currentPlayerName,
  secretWord,
  guessed,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  currentPlayerName: string | null;
  secretWord: string;
  guessed: string[];
  onSubmit: (word: string) => void;
  onCancel: () => void;
}) {
  const positions = secretWord.split('').map((char, index) => {
    const isLetter = /[A-Z]/.test(char);
    const isGuessed = isLetter && guessed.includes(char);
    const isBlank = isLetter && !isGuessed;
    return { char, index, isLetter, isGuessed, isBlank };
  });

  const blankIndices = positions
    .filter((p) => p.isBlank)
    .map((p) => p.index);

  const [blankValues, setBlankValues] = useState<string[]>(() =>
    blankIndices.map(() => '')
  );
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setBlankValues(blankIndices.map(() => ''));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [visible, secretWord]);

  const allFilled = blankValues.every((v) => v.length > 0);

  function assembleWord(): string {
    return positions
      .map((p) => {
        if (!p.isBlank) return p.char;
        const bIdx = blankIndices.indexOf(p.index);
        return blankValues[bIdx] || '';
      })
      .join('');
  }

  function handleBlankChange(blankIdx: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const newValues = [...blankValues];
    newValues[blankIdx] = char;
    setBlankValues(newValues);

    if (char && blankIdx < blankIndices.length - 1) {
      inputRefs.current[blankIdx + 1]?.focus();
    }
  }

  function handleBlankKeyPress(
    blankIdx: number,
    key: string
  ) {
    if (key === 'Backspace' && !blankValues[blankIdx] && blankIdx > 0) {
      inputRefs.current[blankIdx - 1]?.focus();
    }
  }

  function handleCancel() {
    onCancel();
  }

  function handleSubmit() {
    if (!allFilled) return;
    onSubmit(assembleWord());
  }

  const words = positions.reduce<Array<typeof positions>>(
    (acc, p) => {
      if (p.char === ' ') {
        acc.push([]);
      } else {
        if (acc.length === 0) acc.push([]);
        acc[acc.length - 1].push(p);
      }
      return acc;
    },
    [[]]
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Solve the Puzzle</Text>
          <Text style={styles.modalWarning}>
            ⚠️ {currentPlayerName ? `${currentPlayerName}, ` : ''}if you're
            wrong you LOSE this round immediately.
          </Text>

          <View style={styles.puzzleWordContainer}>
            {words.map((wordPositions, wordIdx) => (
              <View key={wordIdx} style={styles.puzzleWordBlock}>
                {wordPositions.map((p) => {
                  if (!p.isBlank) {
                    return (
                      <View key={p.index} style={styles.puzzleFilledSlot}>
                        <Text style={styles.puzzleFilledText}>{p.char}</Text>
                      </View>
                    );
                  }
                  const bIdx = blankIndices.indexOf(p.index);
                  return (
                    <TextInput
                      key={p.index}
                      ref={(el) => {
                        inputRefs.current[bIdx] = el;
                      }}
                      value={blankValues[bIdx]}
                      onChangeText={(v) => handleBlankChange(bIdx, v)}
                      onKeyPress={({ nativeEvent }) =>
                        handleBlankKeyPress(bIdx, nativeEvent.key)
                      }
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                      maxLength={1}
                      style={styles.puzzleBlankInput}
                      selectTextOnFocus={true}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Pressable style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryButton,
                !allFilled && styles.primaryButtonDisabled,
              ]}
              disabled={!allFilled}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoundEndScreen({
  winner,
  winnerName,
  reason,
  nameA,
  nameB,
  wordA,
  wordB,
  earnedSquishy,
  shelfA,
  shelfB,
  lifetimeShelfA,
  lifetimeShelfB,
  roundsWonA,
  roundsWonB,
  onNextRound,
  onHome,
  onTrophyRoom,
}: {
  winner: Player | null;
  winnerName: string | null;
  reason: string;
  nameA: string;
  nameB: string;
  wordA: string;
  wordB: string;
  earnedSquishy: Squishy | null;
  shelfA: Squishy[];
  shelfB: Squishy[];
  lifetimeShelfA: Squishy[];
  lifetimeShelfB: Squishy[];
  roundsWonA: number;
  roundsWonB: number;
  onNextRound: () => void;
  onHome: () => void;
  onTrophyRoom: () => void;
}) {
  const isTie = winner === null;
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.roundEnd}>
    <ScrollView contentContainerStyle={styles.roundEndContainer} showsVerticalScrollIndicator={false}>
      {isTie ? (
        <>
          <Text style={styles.earnedEmoji}>🤝</Text>
          <Text style={styles.earnedLabel}>Nobody won this one!</Text>
        </>
      ) : (
        <>
          {earnedSquishy && (
            <Image
              source={earnedSquishy.image}
              style={{ width: 140, height: 140, resizeMode: 'contain', marginBottom: 8 }}
            />
          )}
          <Text style={styles.earnedLabel}>
            {winnerName} earned a {earnedSquishy?.name}!
          </Text>
          <Text style={{ fontSize: 12, color: '#2a7a3b', fontWeight: '600', marginBottom: 8 }}>
            ✨ Yours to keep forever ✨
          </Text>
        </>
      )}
      <Text style={styles.winnerReason}>{reason}</Text>

      <MatchScore roundsWonA={roundsWonA} roundsWonB={roundsWonB} />

      <View style={styles.shelvesRow}>
        <ShelfPreview
          label={`${nameA} · this match`}
          squishies={shelfA}
          lifetimeTotal={lifetimeShelfA.length}
        />
        <ShelfPreview
          label={`${nameB} · this match`}
          squishies={shelfB}
          lifetimeTotal={lifetimeShelfB.length}
        />
      </View>

      <View style={styles.wordsRevealBox}>
        <Text style={styles.wordRevealLabel}>{nameA}'s word was:</Text>
        <Text style={styles.wordRevealValue}>{wordA}</Text>
        <Text style={styles.wordRevealLabel}>{nameB}'s word was:</Text>
        <Text style={styles.wordRevealValue}>{wordB}</Text>
      </View>

      <ChunkyButton
        onPress={onNextRound}
        color={BUBBLE_COLORS.coral}
        textColor={BUBBLE_COLORS.coralText}
        shadowColor={BUBBLE_COLORS.coralShadow}
        size="lg"
        style={{ minWidth: 220, marginTop: 8 }}
      >
        Next Round →
      </ChunkyButton>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <ChunkyButton
          onPress={onTrophyRoom}
          color={BUBBLE_COLORS.mint}
          textColor={BUBBLE_COLORS.mintText}
          shadowColor={BUBBLE_COLORS.mintShadow}
          size="sm"
        >
          🏆 Trophy Room
        </ChunkyButton>
        <ChunkyButton
          onPress={onHome}
          color={BUBBLE_COLORS.secondary}
          textColor={BUBBLE_COLORS.secondaryText}
          shadowColor={BUBBLE_COLORS.secondaryShadow}
          size="sm"
        >
          🏠 Home
        </ChunkyButton>
      </View>
    </ScrollView>
    </ScreenBackground>
  );
}

function SoloRoundEndScreen({
  didWin,
  word,
  category,
  earnedSquishy,
  winStreak,
  onNextWord,
  onChangeCategory,
  onHome,
}: {
  didWin: boolean;
  word: string;
  category: Category | null;
  earnedSquishy: Squishy | null;
  winStreak: number;
  onNextWord: () => void;
  onChangeCategory: () => void;
  onHome: () => void;
}) {
  const progressToNext = winStreak % SOLO_WINS_PER_SQUISHY;
  const justEarned = didWin && progressToNext === 0 && earnedSquishy !== null;

  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.soloRoundEnd}>
    <ScrollView contentContainerStyle={styles.roundEndContainer} showsVerticalScrollIndicator={false}>
      {justEarned ? (
        <>
          <Image
            source={earnedSquishy.image}
            style={{ width: 160, height: 160, resizeMode: 'contain', marginBottom: 10 }}
          />
          <OutlinedText size={26} color="#FFFFFF" outlineColor="#1A5A3F" outlineWidth={3}>
            You earned a {earnedSquishy.name}!
          </OutlinedText>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 72, marginBottom: 8 }}>{didWin ? '🎉' : '💀'}</Text>
          <OutlinedText size={28} color="#FFFFFF" outlineColor="#1A5A3F" outlineWidth={3}>
            {didWin ? 'You got it!' : 'Nice try!'}
          </OutlinedText>
        </>
      )}

      <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 20, width: '100%', marginTop: 20, marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#1A5A3F', fontFamily: FONT_SEMIBOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          {category?.emoji} {category?.name} — the word was
        </Text>
        <Text style={{ fontSize: 22, fontFamily: FONT_BOLD, color: '#1a1613' }}>{word}</Text>
      </View>

      <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', padding: 14, borderRadius: 20, width: '100%', marginBottom: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#1A5A3F', fontFamily: FONT_SEMIBOLD, letterSpacing: 1, textTransform: 'uppercase' }}>Progress to next squishy</Text>
        <Text style={{ fontSize: 26, fontFamily: FONT_BOLD, color: '#1A5A3F', marginVertical: 4, letterSpacing: 2 }}>
          {progressToNext} / {SOLO_WINS_PER_SQUISHY}
        </Text>
        <Text style={{ fontSize: 11, color: '#4A7A5E' }}>
          Total wins this session: {winStreak}
        </Text>
      </View>

      <View style={styles.soloButtonRow}>
        <ChunkyButton onPress={onChangeCategory} color={BUBBLE_COLORS.secondary} textColor={BUBBLE_COLORS.secondaryText} shadowColor={BUBBLE_COLORS.secondaryShadow} size="md">
          Change
        </ChunkyButton>
        <ChunkyButton onPress={onNextWord} color={BUBBLE_COLORS.primary} textColor={BUBBLE_COLORS.primaryText} shadowColor={BUBBLE_COLORS.primaryShadow} size="md">
          Next Word →
        </ChunkyButton>
      </View>

      <Pressable style={{ marginTop: 12, padding: 10 }} onPress={onHome}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: FONT_SEMIBOLD }}>← Back to Home</Text>
      </Pressable>
    </ScrollView>
    </ScreenBackground>
  );
}

function MatchWinnerScreen({
  winner,
  winnerName,
  loserName,
  matchBonus,
  winnerMatchSquishies,
  loserMatchSquishies,
  winnerLifetimeTotal,
  loserLifetimeTotal,
  roundsWonA,
  roundsWonB,
  onNewMatch,
  onHome,
}: {
  winner: Player | null;
  winnerName: string | null;
  loserName: string | null;
  matchBonus: Squishy | null;
  winnerMatchSquishies: Squishy[];
  loserMatchSquishies: Squishy[];
  winnerLifetimeTotal: number;
  loserLifetimeTotal: number;
  roundsWonA: number;
  roundsWonB: number;
  onNewMatch: () => void;
  onHome: () => void;
}) {
  return (
    <ScreenBackground gradient={SCREEN_GRADIENTS.matchWinner}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.matchWinnerContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.trophyEmoji}>🏆</Text>
      <OutlinedText size={32} color="#FFF2D1" outlineColor="#2E155A" outlineWidth={3}>
        {winnerName} wins!
      </OutlinedText>
      <Text style={styles.matchWinnerScore}>
        {roundsWonA} — {roundsWonB}
      </Text>

      {matchBonus && (
        <View
          style={{
            backgroundColor: '#FFF8EA',
            borderWidth: 3,
            borderColor: rarityColor(matchBonus.rarity),
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 18,
            minWidth: 240,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: rarityColor(matchBonus.rarity),
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            ✨ MATCH BONUS ✨
          </Text>
          <Image
            source={matchBonus.image}
            style={{ width: 100, height: 100, resizeMode: 'contain', marginVertical: 4 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#1a1613',
              marginBottom: 2,
            }}
          >
            {matchBonus.name}
          </Text>
          <View
            style={{
              backgroundColor: rarityColor(matchBonus.rarity),
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 10,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: '#fff',
                fontWeight: '700',
                letterSpacing: 1,
              }}
            >
              {rarityBadge(matchBonus.rarity)}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.shelfHeader}>{winnerName}'s Match Haul</Text>
      <ShelfGrid squishies={winnerMatchSquishies} />
      <Text style={{ fontSize: 12, color: '#8a6a2e', fontWeight: '600', marginBottom: 10 }}>
        🏆 {winnerLifetimeTotal} total in {winnerName}'s collection
      </Text>

      {loserMatchSquishies.length > 0 && loserName && (
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: '#e8e2d5', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: '#1a1613', fontWeight: '600', marginBottom: 4 }}>
            {loserName} earned {loserMatchSquishies.length} squish{loserMatchSquishies.length === 1 ? 'y' : 'ies'} this match
          </Text>
          <Text style={{ fontSize: 11, color: '#2a7a3b', fontWeight: '600', marginBottom: 6 }}>
            ✨ All kept — forever yours ✨
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
            {loserMatchSquishies.map((s, i) => (
              <Image
                key={i}
                source={s.image}
                style={{ width: 36, height: 36, resizeMode: 'contain' }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 10, color: '#8a6a2e', fontWeight: '600' }}>
            🏆 {loserLifetimeTotal} total in {loserName}'s collection
          </Text>
        </View>
      )}

      <View style={styles.soloButtonRow}>
        <ChunkyButton onPress={onHome} color={BUBBLE_COLORS.secondary} textColor={BUBBLE_COLORS.secondaryText} shadowColor={BUBBLE_COLORS.secondaryShadow} size="md">
          Home
        </ChunkyButton>
        <ChunkyButton onPress={onNewMatch} color={BUBBLE_COLORS.primary} textColor={BUBBLE_COLORS.primaryText} shadowColor={BUBBLE_COLORS.primaryShadow} size="md">
          New Match
        </ChunkyButton>
      </View>
    </ScrollView>
    </ScreenBackground>
  );
}

function MatchScore({
  roundsWonA,
  roundsWonB,
  compact,
}: {
  roundsWonA: number;
  roundsWonB: number;
  compact?: boolean;
}) {
  return (
    <View style={compact ? styles.matchScoreCompact : styles.matchScore}>
      <Text style={styles.matchScoreLabel}>
        A {roundsWonA} — {roundsWonB} B · first to {ROUNDS_TO_WIN_MATCH}
      </Text>
    </View>
  );
}

function ShelfPreview({
  label,
  squishies,
  lifetimeTotal,
}: {
  label: string;
  squishies: Squishy[];
  lifetimeTotal?: number;
}) {
  return (
    <View style={styles.shelfPreview}>
      <Text style={styles.shelfPreviewLabel}>{label}</Text>
      <View style={styles.shelfPreviewRow}>
        {Array.from({ length: ROUNDS_TO_WIN_MATCH }).map((_, i) =>
          squishies[i] ? (
            <Image
              key={i}
              source={squishies[i].image}
              style={{ width: 28, height: 28, resizeMode: 'contain', marginHorizontal: 1 }}
            />
          ) : (
            <Text key={i} style={styles.shelfSlot}>·</Text>
          )
        )}
      </View>
      {lifetimeTotal !== undefined && lifetimeTotal > 0 && (
        <Text style={{ fontSize: 10, color: '#8a6a2e', marginTop: 4, fontWeight: '600' }}>
          🏆 {lifetimeTotal} total in collection
        </Text>
      )}
    </View>
  );
}

function ShelfGrid({ squishies }: { squishies: Squishy[] }) {
  return (
    <View style={styles.shelfGrid}>
      {squishies.map((squishy, i) => (
        <View
          key={i}
          style={[
            styles.shelfGridItem,
            squishy.rarity !== 'common' && {
              borderWidth: 2,
              borderColor: rarityColor(squishy.rarity),
              borderRadius: 10,
              paddingVertical: 4,
              backgroundColor:
                squishy.rarity === 'legendary' ? '#FFF8EA' : '#FAF4F8',
            },
          ]}
        >
          <Image
            source={squishy.image}
            style={{ width: 54, height: 54, resizeMode: 'contain', marginBottom: 2 }}
          />
          <Text style={styles.shelfGridName}>{squishy.name}</Text>
          {squishy.rarity !== 'common' && (
            <Text
              style={{
                fontSize: 8,
                color: rarityColor(squishy.rarity),
                fontWeight: '700',
                letterSpacing: 0.5,
                marginTop: 1,
              }}
            >
              {squishy.rarity === 'legendary' ? '🏆' : '🥈'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function OutlinedText({
  children,
  size = 32,
  color = '#fff',
  outlineColor = BRAND.outlineDark,
  outlineWidth = 3,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  style?: any;
}) {
  const baseStyle = {
    fontFamily: FONT_BOLD,
    fontSize: size,
    letterSpacing: 0.5,
  };
  const offsets = [
    [-outlineWidth, -outlineWidth],
    [outlineWidth, -outlineWidth],
    [-outlineWidth, outlineWidth],
    [outlineWidth, outlineWidth],
    [0, -outlineWidth],
    [0, outlineWidth],
    [-outlineWidth, 0],
    [outlineWidth, 0],
  ];
  return (
    <View style={[{ position: 'relative' }, style]}>
      {offsets.map(([x, y], i) => (
        <Text
          key={i}
          style={[
            baseStyle,
            {
              position: 'absolute',
              color: outlineColor,
              left: x,
              top: y,
            },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text style={[baseStyle, { color }]}>{children}</Text>
    </View>
  );
}

const CONFETTI_COLORS = [
  '#FF4E8E', '#FFC168', '#8EEEE0', '#B48FEE',
  '#4FC3F7', '#FFE54C', '#FF7A5A', '#78D4B3',
  '#FFD700', '#FF1493', '#00FF7F', '#FF4500',
];

type ConfettiWaveProps = { active: boolean; delayMs: number; count: number };

function ConfettiWave({ active, delayMs, count }: ConfettiWaveProps) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 220 + Math.random() * 240;
      return {
        angle,
        distance,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 10 + Math.random() * 12,
        rotation: Math.random() * 360,
        startDelay: delayMs + Math.random() * 180,
        trans: new Animated.Value(0),
        rot: new Animated.Value(0),
        opacity: new Animated.Value(0),
      };
    })
  ).current;

  useEffect(() => {
    if (!active) return;
    particles.forEach((p) => {
      p.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(p.trans, {
          toValue: 1,
          duration: 1500,
          delay: p.startDelay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.rot, {
          toValue: 1,
          duration: 1500,
          delay: p.startDelay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(p.startDelay + 900),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      zIndex: 25,
    }}>
      {particles.map((p, i) => {
        const dx = Math.cos(p.angle) * p.distance;
        const dy = Math.sin(p.angle) * p.distance;
        const translateX = p.trans.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = p.trans.interpolate({ inputRange: [0, 1], outputRange: [0, dy + 120] });
        const rotate = p.rot.interpolate({ inputRange: [0, 1], outputRange: [`${p.rotation}deg`, `${p.rotation + 1080}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size * 1.8,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity: p.opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

// Mini-fanfare for RARE pulls — much lighter than legendary.
function RareFanfare({ active }: { active: boolean }) {
  const haloScale = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    // Soft haptic ping — just a success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0.5,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);

  if (!active) return null;

  return (
    <>
      {/* Small silver halo */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 280,
          height: 280,
          marginLeft: -140,
          marginTop: -140,
          borderRadius: 140,
          backgroundColor: 'rgba(200, 220, 255, 0.5)',
          zIndex: 9,
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />
      {/* Single small confetti burst — silver/blue themed */}
      <ConfettiWave active={active} delayMs={0} count={25} />
    </>
  );
}

// Enhanced fanfare for Beyond-Legendary (Chrome/Crystal/Shadow/Mythic).
// MORE than legendary: longer, bigger, edition-themed colors, camera shake.
function VipFanfare({ active, edition }: {
  active: boolean;
  edition: 'chrome' | 'crystal' | 'shadow' | 'mythic';
}) {
  const rayRotate = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  const theme = {
    chrome:  { color: '#E0E0E0', flashColor: '#F5F5F5', halo: 'rgba(220, 220, 230, 0.55)' },
    crystal: { color: '#A5F0FF', flashColor: '#CCF8FF', halo: 'rgba(180, 240, 255, 0.55)' },
    shadow:  { color: '#B48FEE', flashColor: '#D8BCF5', halo: 'rgba(180, 130, 220, 0.55)' },
    mythic:  { color: '#FFD700', flashColor: '#FFEB99', halo: 'rgba(255, 215, 100, 0.65)' },
  }[edition];

  useEffect(() => {
    if (!active) return;

    // Thunderous haptic pattern — more intense than legendary
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    [250, 500, 800, 1100, 1400].forEach((delay) =>
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), delay)
    );

    // Double screen flash
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(flashOpacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Camera shake — brief but intense
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    // Expanding + pulsing themed halo (bigger than legendary)
    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0.75,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(haloScale, {
            toValue: 1.25,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Faster rotating sunburst rays
    Animated.loop(
      Animated.timing(rayRotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [active]);

  if (!active) return null;

  const raySpin = rayRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      transform: [{ translateX: shakeX }],
    }} pointerEvents="none">
      {/* 16 themed sunburst rays — more than legendary */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          zIndex: 8,
          transform: [{ rotate: raySpin }],
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (360 / 16) * i;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 800,
                height: 60,
                marginTop: -30,
                transformOrigin: 'left center',
                transform: [{ rotate: `${angle}deg` }] as any,
                opacity: 0.35,
              }}
            >
              <LinearGradient
                colors={[theme.color, 'rgba(255, 255, 255, 0.4)', 'rgba(0, 0, 0, 0)'] as any}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* Giant themed halo */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 600,
          height: 600,
          marginLeft: -300,
          marginTop: -300,
          borderRadius: 300,
          backgroundColor: theme.halo,
          zIndex: 9,
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />

      {/* Flash — themed color */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: theme.flashColor,
          zIndex: 40,
          opacity: flashOpacity,
        }}
      />

      {/* FOUR confetti waves — more than legendary's three */}
      <ConfettiWave active={active} delayMs={0} count={70} />
      <ConfettiWave active={active} delayMs={400} count={60} />
      <ConfettiWave active={active} delayMs={900} count={50} />
      <ConfettiWave active={active} delayMs={1500} count={40} />
    </Animated.View>
  );
}

function LegendaryFanfare({ active }: { active: boolean }) {
  const rayRotate = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;

    // Haptic punch: strong success + a second buzz for emphasis
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 400);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 800);

    // White screen-flash on reveal
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Expanding + pulsing golden halo
    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0.65,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Keep halo pulsing continuously
      Animated.loop(
        Animated.sequence([
          Animated.timing(haloScale, {
            toValue: 1.15,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Slowly rotating sunburst rays
    Animated.loop(
      Animated.timing(rayRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [active]);

  if (!active) return null;

  const raySpin = rayRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      {/* Golden sunburst rays behind squishy — 12 rotating beams */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          zIndex: 8,
          transform: [{ rotate: raySpin }],
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (360 / 12) * i;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 700,
                height: 70,
                marginLeft: 0,
                marginTop: -35,
                transformOrigin: 'left center',
                transform: [{ rotate: `${angle}deg` }] as any,
                opacity: 0.3,
              }}
            >
              <LinearGradient
                colors={['rgba(255, 220, 100, 0.65)', 'rgba(255, 180, 50, 0.25)', 'rgba(255, 180, 50, 0)'] as any}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* Expanding pulsing golden halo */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 500,
          height: 500,
          marginLeft: -250,
          marginTop: -250,
          borderRadius: 250,
          backgroundColor: 'rgba(255, 215, 0, 0.4)',
          zIndex: 9,
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />

      {/* White screen flash on reveal */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 40,
          opacity: flashOpacity,
        }}
      />

      {/* Three staggered confetti waves */}
      <ConfettiWave active={active} delayMs={0} count={60} />
      <ConfettiWave active={active} delayMs={500} count={50} />
      <ConfettiWave active={active} delayMs={1100} count={40} />
    </>
  );
}

function BlindBoxReveal({
  squishy,
  onContinue,
  autoOpenCard = false,
}: {
  squishy: Squishy;
  onContinue: () => void;
  autoOpenCard?: boolean;
}) {
  const [stage, setStage] = useState<
    'appearing' | 'shaking' | 'opening' | 'revealed'
  >('appearing');
  const [cardVisible, setCardVisible] = useState(false);

  // When the reveal animation lands, auto-open the trading card if requested
  // (used by rewarded ad free-pulls so the "Meet your squishy" card appears without needing a tap)
  useEffect(() => {
    if (!autoOpenCard) return;
    if (stage !== 'revealed') return;
    const t = setTimeout(() => setCardVisible(true), 600);
    return () => clearTimeout(t);
  }, [autoOpenCard, stage]);

  const boxScale = useRef(new Animated.Value(0)).current;
  const boxRotate = useRef(new Animated.Value(0)).current;
  const boxOpacity = useRef(new Animated.Value(1)).current;
  const squishyScale = useRef(new Animated.Value(0)).current;
  const squishyTranslateY = useRef(new Animated.Value(60)).current;
  const auraScale = useRef(new Animated.Value(0)).current;
  const auraOpacity = useRef(new Animated.Value(0)).current;
  const auraRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0)).current;

  const skipRef = useRef(false);

  function skipToReveal() {
    if (stage === 'revealed') return;
    skipRef.current = true;
    boxOpacity.setValue(0);
    boxScale.setValue(1);
    squishyScale.setValue(1);
    squishyTranslateY.setValue(0);
    auraScale.setValue(1);
    auraOpacity.setValue(0.9);
    textOpacity.setValue(1);
    continueOpacity.setValue(1);
    haptics.boxReveal();
    setStage('revealed');
  }

  useEffect(() => {
    // Haptic — box has appeared on screen
    haptics.boxAppear();

    // Continuously rotate the aura for lively feel
    Animated.loop(
      Animated.timing(auraRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.parallel([
      Animated.spring(boxScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(auraScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(auraOpacity, {
        toValue: 0.9,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (skipRef.current) return;
      haptics.boxShake();
      setStage('shaking');

      const shakeOnce = (dir: number, intensity = 0.18, speed = 100) =>
        Animated.sequence([
          Animated.timing(boxRotate, {
            toValue: dir * intensity,
            duration: speed,
            useNativeDriver: true,
          }),
          Animated.timing(boxRotate, {
            toValue: -dir * intensity,
            duration: speed * 2,
            useNativeDriver: true,
          }),
          Animated.timing(boxRotate, {
            toValue: 0,
            duration: speed,
            useNativeDriver: true,
          }),
        ]);

      // 5 shakes with escalating intensity + longer pauses
      Animated.sequence([
        shakeOnce(1, 0.12, 110),
        Animated.delay(150),
        shakeOnce(-1, 0.15, 100),
        Animated.delay(180),
        shakeOnce(1, 0.18, 95),
        Animated.delay(180),
        shakeOnce(-1, 0.22, 90),
        Animated.delay(220),
        shakeOnce(1, 0.26, 85),
        Animated.delay(300),
      ]).start(() => {
        if (skipRef.current) return;
        setStage('opening');

        setTimeout(() => {
          if (skipRef.current) return;
          Animated.parallel([
            Animated.timing(boxOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(squishyScale, {
              toValue: 1,
              tension: 70,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.spring(squishyTranslateY, {
              toValue: 0,
              tension: 70,
              friction: 5,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (skipRef.current) return;
            haptics.boxReveal();
            setStage('revealed');

            Animated.sequence([
              Animated.timing(textOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(continueOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start();
          });
        }, 300);
      });
    });
  }, []);

  const spin = boxRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  const auraSpin = auraRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shelfGradient =
    SCREEN_GRADIENTS[squishy.shelf] ?? SCREEN_GRADIENTS.roundEnd;

  const isLegendary = squishy.rarity === 'legendary';
  const isRare = squishy.rarity === 'rare';
  const isVip = isBeyondLegendary(squishy.rarity);
  const vipEdition = isVip
    ? (squishy.rarity as 'chrome' | 'crystal' | 'shadow' | 'mythic')
    : null;

  return (
    <ScreenBackground gradient={shelfGradient}>
      <Pressable
        style={{ flex: 1 }}
        onPress={skipToReveal}
        android_disableSound={true}
      >
        {isRare && <RareFanfare active={stage === 'revealed'} />}
        {isLegendary && <LegendaryFanfare active={stage === 'revealed'} />}
        {isVip && vipEdition && <VipFanfare active={stage === 'revealed'} edition={vipEdition} />}

        <View style={styles.revealContainer}>
          {/* Big radial aura - rotating slowly */}
          <Animated.View
            style={[
              styles.revealAura,
              {
                opacity: auraOpacity,
                transform: [{ scale: auraScale }, { rotate: auraSpin }],
              },
            ]}
          />

          {/* Secondary smaller aura - counter-rotating for depth */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 380,
              height: 380,
              borderRadius: 190,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              top: '50%',
              left: '50%',
              marginLeft: -190,
              marginTop: -190,
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            }}
          />

          {/* Static sparkles decorating around */}
          <Text style={{ position: 'absolute', top: '20%', left: '12%', fontSize: 36 }}>✨</Text>
          <Text style={{ position: 'absolute', top: '18%', right: '14%', fontSize: 42 }}>⭐</Text>
          <Text style={{ position: 'absolute', bottom: '32%', left: '8%', fontSize: 32 }}>✨</Text>
          <Text style={{ position: 'absolute', bottom: '28%', right: '10%', fontSize: 40 }}>⭐</Text>
          <Text style={{ position: 'absolute', top: '35%', left: '5%', fontSize: 28 }}>✨</Text>
          <Text style={{ position: 'absolute', top: '32%', right: '5%', fontSize: 28 }}>✨</Text>

          <View style={styles.revealTopText}>
            <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
              {isVip && vipEdition ? (() => {
                const vipLabels = {
                  chrome:  { emoji: '🪞', text: 'CHROME EDITION', sub: '💎 ONE OF A KIND 💎', color: '#F5F5F5', outline: '#555555' },
                  crystal: { emoji: '💎', text: 'CRYSTAL EDITION', sub: '💎 ONE OF A KIND 💎', color: '#CCF8FF', outline: '#1A5A78' },
                  shadow:  { emoji: '🌑', text: 'SHADOW EDITION', sub: '💎 ONE OF A KIND 💎', color: '#D8BCF5', outline: '#4A2E78' },
                  mythic:  { emoji: '⚡', text: 'MYTHIC',          sub: '✨ GAME-CHANGING ✨', color: '#FFEB99', outline: '#8A4300' },
                }[vipEdition];
                return (
                  <>
                    <OutlinedText size={46} color={vipLabels.color} outlineColor={vipLabels.outline} outlineWidth={4}>
                      {vipLabels.emoji}  {vipLabels.text}  {vipLabels.emoji}
                    </OutlinedText>
                    <Text style={{
                      fontFamily: FONT_BOLD,
                      fontSize: 15,
                      color: vipLabels.color,
                      letterSpacing: 4,
                      marginTop: 4,
                      textShadowColor: vipLabels.outline,
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 2,
                    }}>
                      {vipLabels.sub}
                    </Text>
                  </>
                );
              })() : isLegendary ? (
                <>
                  <OutlinedText size={42} color="#FFF2A8" outlineColor="#8A4300" outlineWidth={4}>
                    🏆  LEGENDARY  🏆
                  </OutlinedText>
                  <Text style={{
                    fontFamily: FONT_BOLD,
                    fontSize: 14,
                    color: '#FFF2A8',
                    letterSpacing: 4,
                    marginTop: 4,
                    textShadowColor: '#8A4300',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 2,
                  }}>
                    ✨  ULTRA RARE PULL  ✨
                  </Text>
                </>
              ) : isRare ? (
                <>
                  <OutlinedText size={32} color="#E0E8F5" outlineColor="#2A4A78" outlineWidth={3}>
                    🥈  RARE  🥈
                  </OutlinedText>
                  <Text style={{
                    fontFamily: FONT_BOLD,
                    fontSize: 12,
                    color: '#E0E8F5',
                    letterSpacing: 3,
                    marginTop: 2,
                    textShadowColor: '#2A4A78',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 1,
                  }}>
                    nice pull!
                  </Text>
                </>
              ) : (
                <OutlinedText size={28}>YOU GOT</OutlinedText>
              )}
            </Animated.View>
          </View>

          <View style={styles.revealCenter}>
            <Animated.View
              style={[
                styles.revealSquishy,
                {
                  opacity: squishyScale,
                  transform: [
                    { scale: squishyScale },
                    { translateY: squishyTranslateY },
                  ],
                },
              ]}
            >
              <Image
                source={squishy.image}
                style={{ width: 240, height: 240, resizeMode: 'contain' }}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.revealBox,
                {
                  opacity: boxOpacity,
                  transform: [{ scale: boxScale }, { rotate: spin }],
                },
              ]}
            >
              <Image
                source={boxForSquishy(squishy).closed}
                style={{ width: 240, height: 240, resizeMode: 'contain' }}
              />
            </Animated.View>
          </View>

          <View style={styles.revealBottomText}>
            <Animated.View style={{ opacity: textOpacity }}>
              <OutlinedText size={40}>{squishy.name}</OutlinedText>
              <Text style={{
                fontFamily: FONT_SEMIBOLD,
                fontSize: 13,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                textAlign: 'center',
                marginTop: 2,
              }}>
                the {squishy.species}
              </Text>
            </Animated.View>

            <Animated.View style={{ opacity: continueOpacity, marginTop: 20, alignItems: 'center' }}>
              <ChunkyButton
                onPress={() => setCardVisible(true)}
                color={BUBBLE_COLORS.secondary}
                textColor={BUBBLE_COLORS.secondaryText}
                shadowColor={BUBBLE_COLORS.secondaryShadow}
                size="sm"
                style={{ marginBottom: 10 }}
              >
                ✨  Meet {squishy.name}
              </ChunkyButton>
              <ChunkyButton
                onPress={onContinue}
                color={BUBBLE_COLORS.primary}
                textColor={BUBBLE_COLORS.primaryText}
                shadowColor={BUBBLE_COLORS.primaryShadow}
                size="lg"
                disabled={stage !== 'revealed'}
              >
                Continue →
              </ChunkyButton>
            </Animated.View>

            {stage !== 'revealed' && (
              <Text
                style={{
                  marginTop: 16,
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: FONT_SEMIBOLD,
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                tap anywhere to skip
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      {/* Trading card modal — opened via "Meet [Name]" button */}
      <TradingCardModal
        squishy={cardVisible ? squishy : null}
        dupes={1}
        onClose={() => setCardVisible(false)}
      />
    </ScreenBackground>
  );
}

function Gallows({ wrongCount }: { wrongCount: number }) {
  const stages = ['😀', '🙂', '😐', '😟', '😨', '😱', '💀'];
  return (
    <View style={styles.gallowsContainer}>
      <Text style={styles.gallowsEmoji}>{stages[wrongCount]}</Text>
      <Text style={styles.gallowsText}>
        {wrongCount} / {MAX_WRONG} wrong
      </Text>
    </View>
  );
}

function WordDisplay({
  word,
  guessed,
  reveal,
}: {
  word: string;
  guessed: string[];
  reveal: boolean;
}) {
  const words = word.split(' ');
  return (
    <View style={styles.wordContainer}>
      {words.map((singleWord, wordIndex) => (
        <View key={wordIndex} style={styles.wordBlock}>
          {singleWord.split('').map((letter, letterIndex) => {
            const isLetter = /[A-Z]/.test(letter);
            const show = reveal || !isLetter || guessed.includes(letter);
            return (
              <View key={letterIndex} style={styles.letterSlot}>
                <Text style={styles.letterText}>{show ? letter : ''}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Keyboard({
  guessed,
  secretWord,
  disabled,
  onPress,
}: {
  guessed: string[];
  secretWord: string;
  disabled: boolean;
  onPress: (letter: string) => void;
}) {
  return (
    <View style={styles.keyboardContainer}>
      {ALPHABET.map((letter) => {
        const isGuessed = guessed.includes(letter);
        const isCorrect = isGuessed && secretWord.includes(letter);
        const isWrong = isGuessed && !secretWord.includes(letter);
        return (
          <Pressable
            key={letter}
            onPress={() => onPress(letter)}
            disabled={disabled || isGuessed}
            style={[
              styles.key,
              isCorrect && styles.keyCorrect,
              isWrong && styles.keyWrong,
            ]}
          >
            <Text style={[styles.keyText, isGuessed && styles.keyTextGuessed]}>
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  legacyPaddedContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  startContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  startTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1613',
  },
  startSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f4ec',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e8dec5',
  },
  modeButtonEmoji: {
    fontSize: 42,
    marginRight: 16,
  },
  modeButtonText: {
    flex: 1,
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1613',
    marginBottom: 2,
  },
  modeButtonSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  soloStatsBox: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0ebe0',
    borderRadius: 20,
  },
  soloStatsLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#8a6a2e',
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  soloStatsValue: {
    fontSize: 14,
    color: '#5a4a2e',
    textAlign: 'center',
  },
  categoryContainer: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
  },
  categoryTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1613',
  },
  categoryScroll: {
    flex: 1,
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f4ec',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8dec5',
  },
  categoryEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  categoryTextBlock: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1613',
  },
  categoryWordCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1613',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#bbb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  secondaryButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  entryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  flex1: {
    flex: 1,
    width: '100%',
  },
  entryScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    width: '100%',
  },
  dismissKeyboardLink: {
    marginTop: 16,
    padding: 10,
  },
  dismissKeyboardLinkText: {
    fontSize: 13,
    color: '#888',
  },
  entryPlayerLabel: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    fontFamily: 'Fredoka_700Bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  entryTitle: {
    fontSize: 28,
    fontFamily: 'Fredoka_700Bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  entryHint: {
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.95,
  },
  entryInput: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#1a1613',
  },
  entryValidation: {
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 16,
    minHeight: 20,
    textAlign: 'center',
  },
  entryValidOk: {
    color: '#B8FFE0',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  entryValidBad: {
    color: '#FFD6D6',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  entryValidWarning: {
    color: '#FFECA8',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  entryRules: {
    fontSize: 12,
    fontFamily: 'Fredoka_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.85,
  },
  entryTip: {
    fontSize: 12,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#FFF2D1',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  suggestionsBlock: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  suggestionsLabel: {
    fontSize: 11,
    color: '#8a6a2e',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: '#f5e6d9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b8863d',
  },
  suggestionPillText: {
    fontSize: 15,
    color: '#1a1613',
    fontWeight: '700',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  gameTurnLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1613',
    marginBottom: 4,
  },
  gameSubtle: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
  },
  soloCategoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f0ebe0',
    borderRadius: 16,
    marginBottom: 8,
  },
  soloCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a6a2e',
  },
  gallowsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gallowsEmoji: {
    fontSize: 56,
  },
  gallowsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wordBlock: {
    flexDirection: 'row',
    marginHorizontal: 6,
    marginVertical: 4,
  },
  letterSlot: {
    width: 28,
    height: 32,
    borderBottomWidth: 2,
    borderColor: '#333',
    marginHorizontal: 3,
  },
  letterText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    width: '100%',
  },
  keyboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  key: {
    width: 40,
    height: 48,
    backgroundColor: '#eee',
    borderRadius: 6,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCorrect: {
    backgroundColor: '#c8e6c9',
  },
  keyWrong: {
    backgroundColor: '#ffcdd2',
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  keyTextGuessed: {
    color: '#999',
  },
  solveButton: {
    marginTop: 20,
    backgroundColor: '#fdf0d5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#b8863d',
  },
  solveButtonText: {
    color: '#8a6a2e',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1613',
  },
  modalWarning: {
    fontSize: 14,
    color: '#a63d2b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  puzzleWordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  puzzleWordBlock: {
    flexDirection: 'row',
    marginHorizontal: 6,
    marginVertical: 4,
  },
  puzzleFilledSlot: {
    width: 32,
    height: 40,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0ebe0',
    borderRadius: 4,
    borderBottomWidth: 2,
    borderColor: '#333',
  },
  puzzleFilledText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1613',
    textAlign: 'center',
  },
  puzzleBlankInput: {
    width: 32,
    height: 40,
    marginHorizontal: 2,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: '#333',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1613',
    padding: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roundEndContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  earnedEmoji: {
    fontSize: 96,
    marginBottom: 8,
  },
  soloResultEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  earnedLabel: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1613',
    marginBottom: 8,
  },
  winnerReason: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  matchScore: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0ebe0',
    borderRadius: 20,
  },
  matchScoreCompact: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f0ebe0',
    borderRadius: 16,
  },
  matchScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#8a6a2e',
    textTransform: 'uppercase',
  },
  shelvesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  shelfPreview: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f4ec',
    borderRadius: 8,
    minWidth: 140,
  },
  shelfPreviewLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#8a6a2e',
    fontWeight: '700',
    marginBottom: 6,
  },
  shelfPreviewRow: {
    flexDirection: 'row',
    gap: 2,
  },
  shelfSlot: {
    fontSize: 24,
    width: 26,
    textAlign: 'center',
    color: '#ccc',
  },
  wordsRevealBox: {
    backgroundColor: '#f8f4ec',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  wordRevealLabel: {
    fontSize: 11,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  wordRevealValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1613',
    marginTop: 2,
    marginBottom: 4,
  },
  soloProgressBox: {
    backgroundColor: '#f0ebe0',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  soloProgressValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8a6a2e',
    marginVertical: 4,
    letterSpacing: 2,
  },
  soloProgressSubtle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  soloButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  homeLink: {
    marginTop: 8,
    padding: 8,
  },
  homeLinkText: {
    fontSize: 13,
    color: '#888',
  },
  matchWinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  trophyEmoji: {
    fontSize: 96,
    marginBottom: 8,
  },
  matchWinnerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1613',
    marginBottom: 8,
  },
  matchWinnerScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8a6a2e',
    marginBottom: 24,
    letterSpacing: 2,
  },
  shelfHeader: {
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#8a6a2e',
    fontWeight: '700',
    marginBottom: 12,
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    maxWidth: 320,
  },
  shelfGridItem: {
    alignItems: 'center',
    width: 70,
  },
  shelfGridEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  shelfGridName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  revealContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  revealAura: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: BRAND.auraYellowSoft,
    top: '50%',
    left: '50%',
    marginLeft: -250,
    marginTop: -250,
  },
  revealTopText: {
    position: 'absolute',
    top: '18%',
    alignItems: 'center',
    width: '100%',
  },
  revealCenter: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  revealSquishy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  revealBox: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  boxBody: {
    width: 160,
    height: 150,
    backgroundColor: BRAND.cardboard,
    borderRadius: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  boxSeam: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: '100%',
    marginLeft: -1,
    backgroundColor: BRAND.cardboardDark,
  },
  boxFlapLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: 30,
    backgroundColor: BRAND.cardboardDark,
    borderTopLeftRadius: 6,
  },
  boxFlapRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: 30,
    backgroundColor: BRAND.cardboardDark,
    borderTopRightRadius: 6,
  },
  revealBottomText: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
    width: '100%',
  },
  revealContinueButton: {
    backgroundColor: BRAND.auraYellow,
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: BRAND.outlineDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  revealContinueText: {
    fontFamily: FONT_BOLD,
    fontSize: 20,
    color: BRAND.outlineDark,
  },
});
