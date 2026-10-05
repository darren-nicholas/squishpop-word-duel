# SquishPop Word Duel

> A kid-friendly 2-player hangman game with a blind-box squishy collection meta-game, built in React Native + Expo.

Darren & Manny — MD Studios · 2026

---

## What it is

- **2-player pass-the-phone** hangman: each player picks a secret word, the other guesses letter-by-letter (6 wrong = out)
- **Solo mode** with 9 themed word categories (Animals, Food, Movies, Sports, Places, Halloween, Jobs, Nature, Weather)
- **Blind-box squishy collection** — win rounds, open themed boxes, collect 120 kawaii dumpling squishies across 10 shelves
- **Beanie-Boo tags** — every squishy has a canonical name, birthday, and favorite trait (kids can discover the squishy whose birthday matches theirs)
- **4-tier rarity system:** Common → Rare → Legendary → Beyond-Legendary (Chrome / Crystal / Shadow / Mythic — VIP-only)
- **Coin economy** — sell duplicates, buy hints during gameplay
- **Monetization:** $6.99 one-time VIP Pass unlocks the Beyond-Legendary Vault + weekly drops (not yet wired to IAP)

## Tech stack

- **React Native + Expo 57** — iOS primary, Android capable
- **TypeScript**
- **AsyncStorage** for profile persistence
- **Anthropic Claude Haiku** via `aiValidate.ts` — zAIa character validates kid-typed words (handles typos, suggests corrections)
- **expo-haptics** for reveal haptics
- **expo-linear-gradient** throughout the UI
- **Gemini 2.5 Flash Image** (`generate_images.py`) — all 120 squishies, 25 avatars, 10 themed boxes, cabinet frame, VIP box were AI-generated
- **rembg** (Python) — transparent background processing

## Project structure

```
.
├── App.tsx                      # ~5500 lines — main app, all screens, game logic
├── squishies.ts                 # 120-squishy catalog + 10 shelves + box images
├── profiles.ts                  # Profile type, coin economy, AsyncStorage helpers
├── avatars.ts                   # 25 character avatars + per-avatar team colors
├── theme.ts                     # Screen-themed gradients + button palette
├── aiValidate.ts                # zAIa Anthropic validation
├── apiKeys.ts                   # (gitignored) local Anthropic key
├── apiKeys.example.ts           # template Manny copies into apiKeys.ts
│
├── assets/
│   ├── images/
│   │   ├── squishies/           # 10 shelves × 12 PNGs = 120 characters (512px)
│   │   ├── avatars/             # 25 character portraits (512px)
│   │   ├── boxes/               # 11 themed blind-boxes (closed + open)
│   │   ├── room/                # cabinet frame overlay
│   │   └── characters/          # zAIa and other UI characters
│   ├── icon.png                 # app icon
│   └── splash-icon.png
│
├── generate_images.py           # batch Gemini image generator
├── strip_avatar_bg.py           # rembg transparency pass
├── strip_cabinet_bg.py          # cabinet-specific processor
├── prompts_*.json               # all generation prompts (regenerate any asset)
│
├── app.json                     # Expo config
├── package.json
└── tsconfig.json
```

## Development setup

```bash
# Install JS deps
npm install

# Copy the API-key template and drop in a real Anthropic key
cp apiKeys.example.ts apiKeys.ts
# edit apiKeys.ts with your Anthropic Haiku key

# Start Expo dev server
npx expo start
```

Open the Expo Go app on your phone and scan the QR code.

## Regenerating images

```bash
# Set up Python venv for rembg (one-time)
python3 -m venv .venv-rembg
source .venv-rembg/bin/activate
pip install rembg Pillow

# Set Gemini API key
echo 'GEMINI_API_KEY=your_key_here' > .env

# Generate anything from a prompts file
python3 generate_images.py --prompts prompts_dogs.json

# Strip backgrounds + downsize
python3 strip_avatar_bg.py       # for avatars
# or run the inline downsize snippet in docs
```

## DEV buttons (currently in-app, remove before shipping)

Two testing shortcuts live on the Start screen top-left:

- 🏆 **PULL** — forces a reveal of any rarity (Common / Rare / Legendary / Chrome / Crystal / Shadow / Mythic). Great for QA on the reveal animations.
- 📦 **BOXES** — scrollable gallery of every box (10 shelves + VIP + plain brown fallback).

Strip these before App Store submission.

## Known production-readiness blockers

- 🔑 **Anthropic key is client-side.** Must be moved behind a backend proxy before shipping (currently in `aiValidate.ts`, bundled into the IPA).
- 🏷️ **No app icon / splash branding** (placeholder Expo defaults).
- 📜 **No privacy policy / privacy manifest** (Apple requires both).
- 👶 **No parental gate** (required for Kids category + IAP flow).
- 💰 **IAP not wired** — VIP purchase button is decorative. Needs `expo-in-app-purchases` + Apple receipt validation.
- 📊 **No analytics / crash reporting.**

## Related docs (vault)

Full project documentation lives in Darren's Obsidian vault under `02-Projects/SquishPop Word Duel/`:

- Squishy Categories (base catalog)
- Squishy Character Tags (all 120 tags)
- Beyond-Legendary Vault (40 VIP characters)
- Monetization (pricing model)

---

**License:** proprietary · © MD Studios 2026
