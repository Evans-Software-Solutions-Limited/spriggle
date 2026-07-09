# Spriggle — Remediation Plan (audit of 2026-07-09)

## Why this document exists

`tasks.md` claimed tasks 1–22 complete. A full audit (engine trace, mobile
implementation inventory, prototype design-spec extraction, quality-gate run)
found that **the game loop was never wired**, the board **doesn't fit real
iPads**, and the app **doesn't follow the design prototype** despite the spec
claiming otherwise. All quality gates are green (typecheck 5/5 packages,
86/86 mobile tests) — the gates measured the wrong things: units in
isolation, never the integration or the visuals.

**Canonical design reference:** `design-prototype/` (verified content-identical
to `~/Downloads/Spriggle`, just prettier-formatted). `Spriggle Prototype.html`
is the full functional shell and the direction to follow; `Locked Direction`
is the frozen play-screen chrome; `Soil Patch` is the board treatment study.

**Mechanics precedence (unchanged):** legacy GardenerGame is gospel for
mechanics (per `.kiro/steering/spriggle-conventions.md`); the prototype is
gospel for **visuals, motion, and flow**. Where the prototype's game.js
deviates from the engine mechanics (it allows non-adjacent swaps, awards
coins for 8+ groups), the engine/legacy behaviour wins; coins are deferred
post-MVP unless Brad rules otherwise.

## Root-cause findings (evidence)

1. **Engine never wired into the UI** — `app/game.tsx:78` uses a local
   `generateMockBoard`; `onDig`/`onSwap`/`onInvalidAction` are no-op stubs
   ("Engine wiring in later task", game.tsx:82–90); `score` is
   `useState(0)` with no setter. `initializeBoard`/`executeDig`/`executeSwap`
   have **zero call sites** in `packages/mobile`. `useGameSession`
   (src/hooks/useGameSession.ts) is dead code. `/gameover` is unreachable —
   game-over can never fire. `saveGameState`/`loadGameState` exist in
   `src/services/localStorage.ts` but are never called (no save/resume).
   game.tsx also re-implements its own BFS (game.tsx:37–68) instead of using
   the engine's `findConnectedGroup` — a fork that must be deleted.
2. **iPad fit bug** — `GameBoard.tsx:39–55` computes `cellSize` from
   `windowHeight * 0.88`, but the board lives in a `flex: 0.6` column
   (game.tsx). Landscape maths: 11" (1194×834) → ~730px board in a ~701px
   column; 12.9" (1366×1024) → ~898px in ~804px; 10.2" → 706px in 632px.
   Overflows/clips on all common iPads (Mini happens to fit). No
   safe-area handling anywhere (`react-native-safe-area-context` installed,
   never used) despite `requireFullScreen` + hidden status bar.
3. **Fonts never load** — every screen styles `fontFamily: Fredoka/Nunito`
   (src/theme/tokens.ts) but there is no `useFonts`/`Font.loadAsync`, no font
   assets in the repo, no config under the `expo-font` plugin. Everything
   renders in the system font. Single biggest "looks nothing like the
   prototype" cause after the dead board.
4. **Animation system built but disconnected** — `AnimatedCell` (clear/spawn/
   shake), `SwapAnimation`, `ScorePopup`, and the orchestration hook
   `useGameAnimations` are implemented and exported, but `GameBoard.tsx:86`
   renders plain `BoardCell` and game.tsx imports none of them. Only the
   highlight bob is live.
5. **Missing prototype surfaces** — no splash screen; onboarding exists as an
   unreachable static placeholder (no first-run routing); settings is
   literally `<Text>Settings — Task 15</Text>`; no pause sheet; no mascot
   (a 230×46 opacity-0.35 rectangle stands in for it on home and in the game
   rail); soil/patch is flat colour vs the prototype's grass-hatch +
   furrowed-soil treatment; no pre-dig score popup, no score counter tween,
   no toasts, no haptics.
6. **Hygiene** — Tamagui is a phantom dependency (installed, never imported);
   `EXPO_PUBLIC_API_URL` throws in local dev without a `.env` (client.ts:29);
   production value in eas.json is the placeholder `SET_AFTER_SST_DEPLOY`.
7. **Spec integrity** — tasks 11.2, 12.1 (wiring half), 13.1 (partially),
   13.2 were checked `[x]` but provably not done. Checkpoint 16 ("Client app
   functional") was honestly left `[ ]` — and then tasks 17–22 proceeded
   anyway. Checkboxes in tasks.md are unreliable until re-verified against
   call sites.

What IS solid: `packages/engine` (pure, well property-tested, matches gospel),
services layer (auth incl. Apple/Game Center/guest, SQLite storage, offline
sync queue — genuinely wired into leaderboard/gameover/signin), backend
(Elysia + DynamoDB + tests), plant SVGs, `useGameInteraction` state machine.
The failure is the **integration + presentation layer**, not the foundations.

---

## Milestones (do in this order)

### M1 — Make the game a game (P0)

Wire `app/game.tsx` to the engine via `useGameSession`:

- On mount: `loadGameState()` → `deserializeState` → resume; else
  `initializeBoard()` (10 random plants, empty board — no full-board intro;
  gospel wins over the prototype's `plantIntro` full fill).
- `onDig` → `executeDig(state, pos)`; `onSwap` → `executeSwap`; push
  `newState` into session state; update score/turns; persist
  (`saveGameState`) after every action; on `isGameOver` → clear saved state,
  `router.replace("/gameover", { score, isBest })`.
- Delete `generateMockBoard` and the duplicated BFS; import
  `findConnectedGroup` from `@spriggle/engine`.
- Keep engine mechanics exactly (adjacent-only swap, different types,
  per-type scoring, +3/+6 refill).
- **New test class:** RTL integration tests that render the game screen and
  simulate tap sequences through to board mutation, score change, and
  game-over navigation. A revert-check must fail against the current stub
  screen.
- Acceptance: play a full run in the simulator — dig, swap, refill, score,
  game over → gameover sheet shows the real score; kill and relaunch mid-run
  → resumes.

### M2 — Fit the iPad (P0)

Adopt the prototype's layout strategy instead of patching the flex maths:
a fixed **1194×834 design frame**, uniformly scaled with
`s = min(windowW/1194, windowH/834)` from `useWindowDimensions`, content
centered. This is how the entire prototype layout system was designed and it
eliminates the board-vs-column class of bug on every iPad size at once.
(Fallback if the scale approach fights RN: constrain `cellSize` by BOTH the
measured `onLayout` column width and height, and clamp.)

- Add `SafeAreaProvider` in `app/_layout.tsx`; apply insets to screen
  containers (frame margin absorbs most of it).
- Acceptance: screenshots on iPad Mini, 11", and 12.9" simulators — board
  fully visible, rail unclipped, no overflow (visual-verify loop, compared
  against the prototype at the same aspect).

### M3 — Look and feel like the prototype (P1)

- **Fonts (do first, trivial+huge):** add Fredoka + Nunito via
  `@expo-google-fonts/fredoka` + `@expo-google-fonts/nunito`, `useFonts` gate
  in root layout. Weights per prototype: Fredoka 400–700, Nunito 400–900.
- **Wire the existing animation system:** `GameBoard` renders `AnimatedCell`;
  game.tsx drives `useGameAnimations` — dig = `clearCell` (0.32s ease-out,
  scale 1.12 → 0.2 + fade), spawn = `spawnIn` (0.42s bounce
  `cubic-bezier(0.34,1.56,0.64,1)`, staggered 60 + i×45ms), invalid =
  `shakeCell` (0.4s, ±5px), swap = `SwapAnimation` cross-slide (250ms),
  score float = `ScorePopup` (1s ease-out popUp). Board intro grow-in:
  diagonal stagger 160 + i×12ms on new game.
- **Score counter tween** (~420ms lerp), **pre-dig popup** ("+N · DIG · n
  <plant>") above the highlighted group, **toasts** (err/ok pill, in 0.26s
  bounce / out at 2100ms) for invalid actions ("Need 5+ — that patch has n",
  "Pick two different plants").
- **Haptics:** `expo-haptics` at the prototype's call sites — light
  (select), medium (swap), success (dig), warning (invalid).
- **Soil/patch treatment:** grass-hatch patch frame + radial speckles,
  furrowed soil bands (92deg, 30px), hole-gradient cells (radius = 26% of
  cellSize), plants at 108% with -5% offset and drop shadow, per
  `Soil Patch.html` / `spriggle.css`. Use react-native-svg or prebaked
  texture assets — screenshot-compare against the prototype.
- **Chunky press affordance:** translateY(2–3px) + shadow collapse on all
  buttons/cards (0.12s).
- Remove the Tamagui phantom deps (styling is StyleSheet; adopting Tamagui
  now would be a rewrite for no benefit).

### M4 — Missing screens and flows (P1)

- **Mascot:** port `mascot.js` (220×240 viewBox sprout character) to
  react-native-svg — dig pose (trowel) + swap pose (two plants + arrows),
  idle sway (3.4s), pose follows selected tool; place on home (210px),
  game rail (with per-tool speech bubble), signin hero, gameover (swap pose
  on new best), leaderboard empty state. Replaces the placeholder rectangle.
- **Splash:** mascot popIn (0.6s bounce) + wordmark + 3 loading dots,
  auto-advance ~1.9s → home (or signin/onboarding on first run).
- **Onboarding:** interactive 3-step tutorial per `onboarding.js` (scripted
  allowed-cells, shake on stray taps, dig step / swap step), routed on first
  run (persisted `onboarded` flag) and from pause sheet "How to play".
- **Pause sheet:** Resume / Restart run / How to play / Settings / Quit to
  garden (sheetIn 0.3s bounce + scrim fade).
- **Settings (real):** Sound/Music/Haptics toggles, Garden/Moonlit theme
  swatches (ThemeContext already supports it — no UI calls `setTheme`
  today), account sign in/out, about/credits.
- **Game over sheet:** gold "New best!" banner, mascot, name prompt when
  best + signed out, Replay / Garden. ("Watch ad" from the prototype is
  post-MVP — no ads SDK in scope.)

### M5 — Production readiness (existing Task 23, unblocked last)

Task 23 was always open and is genuinely not close: prebuild hygiene,
production `sst deploy` + real `EXPO_PUBLIC_API_URL` (currently
`SET_AFTER_SST_DEPLOY`), privacy/compliance, App Store record, Detox run,
device smoke test. Do not start M5 until M1–M4 pass a full visual-verify
sweep and an on-device play test.

## Process guards (so this can't recur)

- A UI task is "done" only with a **screenshot compared against the
  prototype** (visual-verify) and, for interactions, an integration test
  that exercises the real wiring — unit coverage of orphaned modules
  doesn't count.
- Re-verify every remaining `[x]` in tasks.md against actual call sites
  before trusting it. Checkpoint tasks (16, 20, 23) must block: nothing
  downstream starts while a checkpoint is open.
- Each milestone = one branch/PR, Inspector Brad sweep before raising, per
  repo conventions.

## Open decisions for Brad (defaults applied unless overruled)

1. **Swap adjacency** — prototype allows any-two-cells swap; engine/legacy
   requires orthogonal adjacency. Default: **engine/legacy wins** (steering
   doc precedence). Flag if the prototype feel is preferred.
2. **Coins** (+1 per 8+ dig in prototype, coin chip UI) — default:
   **deferred post-MVP** (no economy backend).
3. **Board layout strategy** — default: **design-frame scaling (1194×834)**
   over responsive reflow.
