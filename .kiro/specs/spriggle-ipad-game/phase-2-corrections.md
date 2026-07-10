# Spriggle — Phase 2: Correctness & Fidelity (pre-release)

## Status (2026-07-10)

- ✅ **P2-A** game logic (swap no-adjacency, single-tap dig, legacy
  refill-starvation game-over, scoring confirmed correct) — merged (#31).
- ✅ **P2-B** About (Evans Software Solutions) + selection styling — merged (#32).
- ✅ **P2-C** sign-in full-screen + guest-first layout — merged (#33).
- ✅ **P2-D** interactive tutorial + first-run routing — implemented in PR #35
  (scripted 3-beat tutorial on the real board/engine, `onboarded` AsyncStorage
  flag + `RootNavigator` startup gate, sign-in → onboarding hand-off). Pending
  Brad's on-device confirmation. See C5 below.
- ✅ **B1** Xcode-16 / expo-modules-core Swift-concurrency build failure —
  RESOLVED. Root cause: Expo SDK 55 dropped Xcode 15/16 support and requires
  Xcode 26 (expo/expo#42525). The production EAS build was never actually
  blocked (EAS's SDK-55 image is `macos-sequoia-15.6-xcode-26.2`); only the E2E
  workflow was, because it pinned the unsupported Xcode 16.2. Fix: E2E now runs
  on macos-15 + Xcode 26.2, and the EAS staging/production images are pinned to
  the same known-good toolchain. Validated by the E2E run on `main`.

Remaining work is best picked up fresh (this session is very long); all context
is here + in `memory/` and the legacy at `~/Documents/projects/personal/
GardenerGame`.

Raised after Brad played the built app (2026-07-10). Milestones M1–M5 wired the
engine, fit the iPad, loaded fonts/animations, added the mascot, and staged
production — but on-device play exposed gameplay-logic and fidelity defects that
the gates never caught (they validated the wrong behaviour, e.g. the adjacency
swap). This phase gets the game _correct and faithful to the prototype_ before
release.

**Ground truth for this phase:** `design-prototype/spriggle/` (the prototype is
the authoritative frontend + mechanics reference). Where the `requirements.md`
spec contradicts the prototype (it mandates adjacency swaps and per-type
scoring), **the spec is wrong and must be updated in lockstep** — otherwise the
next spec-driven pass re-introduces these bugs.

**PR strategy:** independent PRs off `main` (NOT a long stack — the M1–M5 stack
caused squash-merge pain). Each PR: local Inspector Brad + gates green before
raising; on-device verification is Brad's (I can't run a simulator).

---

## P0 — Gameplay correctness (the "fundamentally broken" set)

### C1 — Swap: remove the adjacency requirement

The prototype's `doSwap` (game.js:288) allows swapping **any two** non-empty,
different-type cells — there is no adjacency check. The engine wrongly requires
orthogonal adjacency, and the UI shows "Plants must be next to each other."

- `packages/engine/src/swap.ts`: drop `areOrthogonallyAdjacent` + its use in
  `isValidSwap`; keep in-bounds + non-empty + different-type. Remove the unused
  `DIRECTIONS` import.
- `packages/mobile/src/hooks/useGameInteraction.ts`: delete the adjacency block
  (~:130-142); keep the same-type rejection.
- Tests to update/invert: `swap.test.ts` (diagonal-rejection case),
  `swap.property.test.ts` (non-adjacent generator + property), and the hook's
  `useGameInteraction.test.ts` non-adjacent case.
- `requirements.md`: remove Req 3's adjacency clause + the Swap glossary term.

### C2 — Dig: single tap (not tap-to-highlight-then-confirm)

The prototype digs on a single tap (`doDig`, game.js:249 fires immediately;
highlight is desktop-hover-only). Current app requires two taps.

- `useGameInteraction.ts`: in dig mode, a tap on a group ≥5 calls `onDig`
  immediately; <5 → `onInvalidAction`. Remove the `highlightOrigin`/confirm
  path. The dig still reads visually via the existing `animateDig` clearing
  animation.
- Tests: rewrite the hook's "second tap confirms" case to "first tap digs";
  the integration test's valid-dig case presses once, not twice.

### C3 — Game-over: port the legacy's refill-shortfall rule

**Decided from the legacy GardenerGame** (`~/Documents/projects/personal/
GardenerGame`, `src/page/Gardener.tsx:21-35`). The legacy's `spawnPlants(count)`
spawns one plant at a time and, if it runs out of empty cells before placing
all `count`, sets game over. So:

> **Game over iff a refill cannot place its full spawn count** — i.e. empty
> cells before the refill < spawn count (3 after a dig, 6 after a swap).

A dig frees ≥5 cells so its 3-refill always fits (a dig never ends the game);
a **swap** ends the game when there are `< 6` empty cells before its refill.
This is exactly Brad's "not enough spaces for the plants about to spawn," and a
full board with no diggable group forces a swap that then can't spawn → ends.

- Engine change (`dig.ts` / `swap.ts`): set `newState.isGameOver` from the
  refill result — game over when `filledPositions.length < requestedCount`
  (the refill couldn't place everything). `refillBoard` already fills what it
  can and returns `filledPositions`, so this is a small change.
- The old `isGameOver(board)` ("100% full AND no 5-group") is NOT the legacy
  rule — repurpose/retire it and update `game-over.ts` + Property 11 tests.
- Add an integration test: a swap with < 6 empty cells routes to `/gameover`.

### C4 — Kill the "persistence" splash / branding (stale native project)

Root cause: `packages/mobile/ios/` is a **stale local prebuild** still named
`persistencemobile` (`com.bradleyevans96.persistence`, `CFBundleDisplayName =
persistence-mobile`, old `SplashScreen.storyboard`). Running from it shows the
persistence splash and ignores the (correct) `app.json` Spriggle config. The
assets and `app.json` are correct — this is purely the stale artifact.

- `rm -rf packages/mobile/ios && bunx expo prebuild -p ios --clean` regenerates
  it Spriggle-branded. `ios/` is gitignored, so this is a local/build step, not
  a commit. Document it as the required first step for any local native run.
- Ties into B1 (the E2E/production build already regenerates via CNG).

---

## P1 — Frontend fidelity

### C5 — Interactive onboarding tutorial + first-run routing

Current onboarding is static "how-to-play" cards; the prototype
(`onboarding.js`) is a scripted **3-step interactive** tutorial on a real board:

1. **Dig** — seeded board with a diggable 5-group; only those cells are
   tappable (wrong taps shake); correct tap digs → step 2.
2. **Swap** — two ringed cells; swapping them lines up a 5-group → step 3.
3. **Dig the big patch** — dig the new 5-group → done.
   Plus progress dots, a "Skip tutorial" button, and on completion sets an
   `onboarded` flag and routes into the game.

- Port to RN as an interactive screen driving the real board + engine, with
  tap-gating to scripted cells.
- **First-run routing** (missing entirely): persist an `onboarded` flag; the
  app startup (splash → signin → onboarding → home) checks it. First launch
  shows the tutorial; returning users skip it. Reachable from pause "How to
  play" as today.

### C6 — Sign-in screen: sizing + behaviour

- **Sizing**: signin is `presentation: "modal"` (a smaller sheet on iPad) but
  wraps content in `DesignFrame`, which scales a 1194×834 canvas against the
  **full window** → mis-scaled. Fix: present sign-in full-screen (so the
  window-based scale is correct) or make it not use window-based DesignFrame in
  a modal.
- **Behaviour**: make "Continue as guest" the **primary** CTA with the
  prototype's reassuring copy ("no account needed… sign in only to own your
  leaderboard name"); add the "plays offline · syncs later" line; and route to
  the onboarding tutorial on first-run sign-in (guest included), per the
  prototype's `finish()` — instead of silently dismissing.

### C7 — Selection / highlight styling to match the prototype

- Pre-dig highlight: match the prototype's `.cell.hl` double layer (crisp
  `0 0 0 3px gold` ring + soft `0 0 16px 2px` gold glow) rather than the current
  single soft shadow; make the gold **theme-aware** (garden `#d9a23c` /
  moonlit `#ffc94d`) instead of hardcoded. Bob timing already matches.
- Swap-selection ring: **the prototype defines no `.cell.sel` style** — the
  current green ring is invented. Decision (minor): keep a clean accent ring for
  UX, or match the prototype's absence. Recommend a subtle accent-gold ring and
  flag it as a deliberate fill-in. (Note: with single-tap dig, the pre-dig
  highlight largely disappears; the swap-select ring becomes the main "selected"
  affordance Brad referenced.)

### C8 — About section: real attribution

Replace "Coded by Bradley · Graphics by Nicole · Tested by Libby" (template
leftover; no graphics contributor exists) with **Evans Software Solutions**
attribution and drop the invented per-person credits. Fix the version string
"v1.0" → "1.0.0" to match `app.json`.

---

## Decisions — RESOLVED against the legacy GardenerGame

Legacy located at `~/Documents/projects/personal/GardenerGame` and read
directly. It is the gospel.

### D1 — Dig scoring: NO CHANGE (engine already matches legacy)

Legacy `calculateDigUpScore = pointsPerDig × numberOfDigUp`
(`src/hooks/useGameLogic.ts:108`) with per-plant-type `pointsPerDig`
(`src/components/plantables/plantables.ts`: watermelon 3, flower 6, aubergine 4,
tomato 5, pumpkin 2). This is **identical** to the current engine's
`POINTS_PER_PLANT_TYPE` × count. The prototype's group-size `pts(n)` was the
outlier. **No scoring change; do not touch `calculateDigScore`.**

### D2 — Swap: NO adjacency (confirmed from legacy)

Legacy `swapPlants` (`src/hooks/useGameLogic.ts:158`) rejects only empty cells
and same-type; there is **no adjacency check** (and none in the UI handler
`BoardCell.onPlantSwap`). Confirms C1.

### D3 — Game-over: refill-shortfall (see C3, resolved above)

Legacy mechanism, not "100% full + no group".

---

## B1 — Release blocker: Xcode 16 / expo-modules-core build failure

Surfaced while getting E2E green. Under Xcode 16.2, `expo-modules-core@55.0.25`
fails to compile (`main actor-isolated property 'props' can not be referenced
from a nonisolated context` — Swift strict-concurrency).

**RESOLUTION (2026-07-10).** This is not a bug to patch — it's an unsupported
toolchain. Expo dropped Xcode 15/16 support for SDK 55; the maintainer confirmed
the build works on Xcode 26 and closed expo/expo#42525 as "Xcode 15 (and 16 as
well) are not supported anymore." `expo-modules-core@55.0.25` is already the
latest SDK-55 patch, so `expo install --fix` is a no-op.

- **The production EAS build was never blocked.** EAS builds SDK 55 on
  `macos-sequoia-15.6-xcode-26.2` (the `auto`/`sdk-55` image → Xcode 26.2), where
  expo-modules-core compiles. The earlier "likely affects production" worry was
  an untested hypothesis; it does not.
- **E2E fix:** the workflow pinned Xcode 16.2 (unsupported). Moved it to
  `runs-on: macos-15` + `Xcode_26.2.app` — the macos-15 runner ships Xcode
  26.2/26.3 — so the E2E compile mirrors the production EAS toolchain exactly.
- **EAS pin:** `eas.json` staging + production now pin
  `ios.image = macos-sequoia-15.6-xcode-26.2` so the shipped build uses the same
  CI-proven, Expo-supported toolchain and is immune to a future `auto`/`latest`
  image flip (e.g. `latest` already points at Tahoe/Xcode 26.6).
- Prior E2E fixes — tap-trust, prebuild, Xcode select, iPad-simulator name — are
  all still in place; only the Xcode major changed (16.2 → 26.2).

---

## Suggested sequencing

1. **PR A (P0 gameplay):** C1 + C2 + C3 + spec updates — the "broken game" fixes.
   (Blocked only by D1 if you want scoring in the same PR; otherwise scoring is
   a follow-up.)
2. **PR B:** C8 (About) + C7 (styling) — small, independent.
3. **PR C:** C6 (sign-in) — sizing + behaviour + onboarding hand-off.
4. **PR D:** C5 (interactive tutorial + first-run routing) — largest.
5. **B1** investigated in parallel (blocks release + E2E, not the above PRs).
6. **C4** is a local/build step + doc, folded into B1's prebuild story.
