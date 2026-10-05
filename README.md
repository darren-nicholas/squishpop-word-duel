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

---

# 📋 Roadmap / To-Do

The game is **feature-complete for playtesting** but has distinct work-tracks before App Store submission. Grouped by priority.

## 🚀 Production readiness (required before any public launch)

- [ ] **Backend proxy for Anthropic API key** — `aiValidate.ts` currently calls Claude Haiku directly from the device. Key is bundled into the IPA and extractable. Needs a tiny proxy (Firebase Functions / Cloudflare Worker / Vercel edge) that holds the key server-side.
- [ ] **App icon + splash screen** — currently Expo defaults.
- [ ] **Privacy policy** (public URL) and **Privacy Manifest** (per Apple 2024+ requirement).
- [ ] **Parental gate** before any IAP flow (COPPA / Kids-category requirement).
- [ ] **Crash reporting** — Sentry or Bugsnag integration.
- [ ] **Analytics** — Mixpanel / PostHog / Expo Analytics for retention + engagement.
- [ ] **Remove DEV buttons** on Start screen (🏆 PULL + 📦 BOXES).
- [ ] **Collection-reset flag** — currently hardcoded `squishpop.collectionResetV3`. Needs to be a build-time constant or server-driven for safe production rollouts.

## 💰 Monetization layer (currently decorative)

### Ad system (not yet built)

**Three-phase funnel — hook players before any friction:**

| Phase | Trigger | Behavior |
|---|---|---|
| 1 — **Hook** | First **10 puzzles** post-install | 100% ad-free. Build the collection, fall in love. |
| 2 — **Free with ads** | Puzzle 11+ | Interstitial after each puzzle. Skip if gameplay < 60s (don't interrupt rapid guessing). Hard cap: 1 ad per 60 seconds total. |
| 3 — **VIP removes ads** | $6.99 one-time purchase | No ads ever + Beyond-Legendary Vault + weekly drops. |

- [ ] **Puzzle counter** persistence (survives app close) + ad-trigger logic
- [ ] **Interstitial ad integration** via COPPA-safe network (SuperAwesome / AdMob for Families)
- [ ] **Parental consent flow** on first ad view (required under COPPA)
- [ ] **Rewarded-ad "watch for a bonus squishy" button** on home screen (opt-in, caps at rare)

### VIP IAP (not yet built)

- [ ] **Apple IAP wiring** via `expo-in-app-purchases` for the $6.99 VIP Pass
- [ ] **Receipt validation** (device-side StoreKit 2 or server-side proxy)
- [ ] **Weekly VIP drop mechanic** — Sunday gift-box on home screen; cadence tracking; separate pull odds (60% rare / 35% legendary / 5% BL)
- [ ] **"Unlock Vault — $6.99" button wiring** (currently decorative on Trophy Room)
- [ ] **Expansion pack infrastructure** (future $2.99 themed shelf drops)
- [ ] **VIP entitlement persistence** across devices (currently local-only)

## 🎨 UX / Polish

- [ ] **Sound effects** — reveal chimes, box pop, correct/wrong guesses, legendary trumpet (via `expo-av`).
- [ ] **Themed solo = themed pulls** — playing *Sea Creatures* words should pull from the Sea shelf, not random. Closes the solo-mode feedback loop.
- [ ] **Rules screen refresh** — "How to Play" was written pre-coin-economy and pre-VIP. Needs updating.
- [ ] **Avatar downsize** to 512px (same perf win we did for squishies). ~5-minute Python pass.
- [ ] **Theme-specific VIP box variants** — Chrome / Crystal / Shadow / Mythic each get their own box (currently one unified VIP box).
- [ ] **Mythic character backstories** — 10 shelf-lord characters currently have names but no lore.
- [ ] **First-run tutorial** — currently no onboarding; first-time users dropped into Who's Playing.

## 📦 Content pipeline (ongoing after launch)

- [ ] **Monthly new shelf drops** — Space, Sports, Back-to-School, Summer Beach, etc.
- [ ] **More solo word categories** — currently 9 (Animals, Food, Movies, Sports, Places, Halloween, Jobs, Nature, Weather).
- [ ] **Localization** — if going international, i18n for word banks + UI text.
- [ ] **Weekly content calendar** — one new squishy per week to feed the VIP weekly drop.

## 🧪 Real-world validation

- [ ] **Formal play session with Cora + Aubrey + friends** — gather kid-perspective feedback at scale.
- [ ] **TestFlight distribution** — closed beta with a few families once production hardening is done.

## 🐛 Known tech debt

- [ ] One pre-existing `LinearGradient` TypeScript strict warning (runtime fine, cosmetic).
- [ ] `apiKeys.ts` approach is a stopgap — formal env-var pipeline needed before CI/CD.

---

## Related docs (vault)

Full project documentation lives in Darren's Obsidian vault under `02-Projects/SquishPop Word Duel/`:

- Squishy Categories (base catalog)
- Squishy Character Tags (all 120 tags)
- Beyond-Legendary Vault (40 VIP characters)
- Monetization (pricing model)

---

**License:** proprietary · © MD Studios 2026
