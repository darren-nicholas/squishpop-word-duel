# Game review and release readiness

This change reviews the main game, word entry, profiles and collection storage,
coin economy, ad stubs, catalog/avatars/themes, asset-generation scripts, and
Expo/EAS configuration. It makes the existing game safer to playtest; it does
not establish App Store readiness or deploy a service.

## Fixed in this branch

- Removed the automatic startup wipe of collections and match stats. Corrupt or
  unsupported stored profiles show a retry screen without overwriting the data.
- Restored saved squishies from canonical catalog IDs instead of stale native
  image handles. Ordered profile writes prevent older snapshots winning races.
  Existing full-object collections remain readable; new saves store IDs.
- Kept the last collected copy when selling duplicates and rejected invalid or
  unaffordable currency operations. The sale button explains why the last copy
  cannot be sold.
- Charged hints to the current player's profile, with independent hint limits
  and extra lives. Empty hints cannot charge; revealing the last letter wins.
  Rapid taps cannot grant duplicate round rewards or guess during turn feedback.
  Turn passing skips opponents who have already run out of guesses.
- Used the winner's VIP status for reward odds. Saved solo reward progress per
  profile, including across restarts; completed-round counters advance once
  even for VIP players and when the next action is going home.
- Removed the client-key import and direct Anthropic requests. Word checks now
  remain on the device, with explicit warnings for unknown words. This local
  dictionary/blocklist is limited validation, not comprehensive moderation.
- Hid dev pull/box controls in release builds, disabled release ad simulation,
  and changed the unwired VIP purchase teaser to “coming soon.” Development
  free-pull odds are 90% common / 10% rare, with no legendary rewards.
- Corrected 120-item collection totals, Beyond-Legendary labels/colors, gradient
  tuple types, and remaining-guess feedback. Added quit confirmation and button
  accessibility roles/states. Reused animation values and stopped reveal/fanfare
  animations and delayed haptics on cleanup.
- Added project lint/typecheck/test scripts and CI. Patched `uuid` specifically
  under `xcode` and `@expo/ngrok` to CommonJS-compatible 11.1.1; regression tests
  exercise their v4 usage and the vulnerable buffer-boundary case. Expo and
  React Native versions were preserved.
- Added image-generator dry runs, environment-key support, output-path and PNG
  validation, failure exit codes, and tests without API calls or asset changes.

## Validation

Run `npm ci`, `npm run check`, and `npm run build:check` from the project root.
Node 24/npm 11 were used. `check` runs TypeScript, Expo lint, Node regression
checks, and Python standard-library tests. The Node app tests mount the real
React component tree with native modules mocked; they test state transitions,
not native rendering, accessibility behavior, animations, or device memory.
`react-test-renderer` emits its upstream deprecation notice and is pinned to
React's version. Migrate this harness to the supported native testing stack
when upgrading React.

Production iOS and Android exports verify bundling, Hermes compilation, and
asset resolution. They are not signed native builds or deployment. No automated
checks make purchases, show real ads, send children’s words to a provider, or
spend image-generation credits. All 225 prompt entries were checked locally.

The cloud proxy rejected the official SDK 57 documentation URLs. This branch
adds no native module; existing API usage was checked against installed SDK
implementations/types. Recheck current official documentation before extending
Expo/EAS/native functionality.

## Remaining release requirements

| Priority | Finding | Next step |
| --- | --- | --- |
| P0 | Historical app bundles may contain an Anthropic key | Rotate any previously shipped key. The new app no longer imports it; `apiKeys.ts` is unused and can be removed locally. |
| P1 | Production dependency audit still reports 16 high findings, propagated from `braces` and `node-forge` | Current registry releases (3.0.3 / 1.4.0) are within advisory ranges. Track GHSA-vfj7-8cjw-p6xm and GHSA-86w9-cpqp-85rv; update to compatible patched releases when available and rerun builds. Do not apply npm's suggested Expo/RN downgrades. These are largely build/toolchain paths; mobile exploitability has not been demonstrated. |
| P1 | StoreKit purchases, receipt verification, entitlement recovery, and weekly VIP drops are absent | Select and test a supported SDK 57 purchase path, with parental gates, before offering paid VIP. Local `isVip` is not a verified commercial entitlement. |
| P1 | Real ads, consent, cooldowns, and provider failure/cancel callbacks are absent | Keep release ads disabled until a children-appropriate provider and consent flow are integrated and device-tested. Implement the specified 30-minute free-pull cooldown then. |
| P1 | Privacy policy, privacy manifest review, store metadata, and release artwork remain incomplete | Obtain product/legal inputs and review actual SDK data collection before App Store submission. |
| P1 | No native device or signed-build validation occurred | Run the checklist below on supported iPhones/iPads and Android devices. EAS development profile requests a dev client but `expo-dev-client` is not currently installed. Verify the chosen native-build workflow before distribution. |
| P2 | Existing navigation is a large state machine in `App.tsx`, while AGENTS.md asks for Expo Router | Plan a dedicated, tested Router migration; no new navigation framework was introduced in this bug-fix change. |
| P2 | Fixed-position home/cabinet layouts and 1024px avatars need device performance/accessibility review | Test small screens, large text, screen readers, reduced motion, and low-memory devices. The 25 avatars total about 11.2 MiB compressed. |
| P2 | Themed solo rewards, tutorial, sound, and content expansion remain roadmap items | Prioritize after the safety and native-release checks. Current solo rewards retain the existing random-shelf design. |

## Device checklist before release

- Open existing profiles after upgrading; verify collections, coins, VIP state,
  duplicates, image resolution, and save/reopen behavior without resetting data.
- Create/switch/delete profiles; play solo to the third reward, restart, and
  switch profiles. Verify reward progress stays with each person.
- Play two-player rounds through both lockouts, ties, solves, five-win matches,
  and rapid taps. Confirm the active guesser pays for hints and extra lives do
  not transfer to the other player.
- Try empty/already-revealed hints, final-letter hints, repeated-letter words,
  apostrophes/hyphens, keyboard return, and accidental home taps.
- Verify release builds hide dev controls, simulated ads, and any purchase claim.
- Inspect reveal skip/continue, every rarity, typography, cabinet scrolling,
  touch targets, screen-reader focus, large text, and performance on real devices.

Merging, signed builds for distribution, publication, and deployment require
separate approval. This branch and its pull-request material do none of them.
