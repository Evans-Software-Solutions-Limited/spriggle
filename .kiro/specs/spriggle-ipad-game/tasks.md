# Implementation Plan: Spriggle iPad Game

## Overview

Incremental implementation starting with the pure game engine (fully testable without UI), then building the client app layer, and finally the standalone backend. Each step builds on the previous, with property tests placed close to the code they validate.

## Remediation status (2026-07-10)

A 2026-07-09 audit found the "complete" app was broken (engine never wired to
the UI, board didn't fit the iPad, fonts/animations/mascot never shipped) —
see [`remediation.md`](./remediation.md). The fix landed as a stacked PR chain:

- **M1** — wire the engine into the play screen (dig/swap/score/game-over/
  resume). Restores tasks 11.2, 13.2.
- **M2** — fit every iPad via a fixed design-frame scaled per screen.
  Restores task 11.1.
- **M3** — load real fonts, wire the built animation system, haptics, soil
  gradient. Restores task 12.
- **M4** — mascot, real settings (theme switch), pause sheet, how-to-play.
- **M5** — production-readiness config + handoff, see
  [`production-readiness.md`](./production-readiness.md).

Tasks 11–13 below are therefore complete again (via M1–M3). Task 23 is the
remaining App Store work; its `[agent]` items are done (M5), `[manual]` items
are tracked in `production-readiness.md`.

## Tasks

- [x] 1. Project scaffolding and core types
  - [x] 1.1 Initialize Expo 55 project with React Native 0.83, TypeScript, and landscape-only iPad configuration
    - Create Expo project with `expo-router` file-based routing
    - Configure `app.json` for iPad-only, landscape orientation lock
    - Install core dependencies: Tamagui, TanStack React Query, expo-sqlite, AsyncStorage, @react-native-community/netinfo
    - Set up Vitest and fast-check for testing
    - _Requirements: 7.1_
  - [x] 1.2 Define core game types and interfaces
    - Create `src/engine/types.ts` with PlantType, Cell, Board, Position, GameState, DigResult, SwapResult
    - Create `src/engine/index.ts` exporting the GameEngine interface
    - _Requirements: 1.3_

- [x] 2. Connected group detection
  - [x] 2.1 Implement BFS-based connected group detection
    - Implement `findConnectedGroup(board, position)` using BFS with orthogonal adjacency only
    - Implement `findAllConnectedGroups(board)` to find all groups on the board
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [x] 2.2 Write property tests for connected group detection
    - **Property 14: Orthogonal adjacency only**
    - **Property 15: Connected group detection correctness**
    - **Validates: Requirements 15.1, 15.2, 15.3**
  - [x] 2.3 Write unit tests for connected group detection
    - Test known board configurations with expected groups
    - Test edge cases: single cell, entire board same type, no groups of 5+
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 3. Board initialization and structure
  - [x] 3.1 Implement board initialization
    - Implement `initializeBoard()` that creates an empty 8×8 grid and spawns 10 random plants
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Write property tests for board initialization and structure
    - **Property 1: Board structure invariant**
    - **Property 2: Board initialization guarantees playability**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - [x] 3.3 Write unit tests for board initialization
    - Verify board dimensions and cell validity
    - Test retry logic when initial generation has no valid group
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Dig mechanic
  - [x] 4.1 Implement dig validation and execution
    - Implement `isValidDig(board, position)` checking the maximal connected group at the tapped cell is ≥ 5 same-type plants
    - Implement `executeDig(state, position)` that removes the entire maximal group and updates score
    - Implement `calculateDigScore(plantType, plantCount)` with formula (points_per_plant_type × count)
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - [x] 4.2 Write property tests for dig mechanic
    - **Property 3: Valid dig removes exactly the connected group**
    - **Property 4: Invalid dig leaves board unchanged**
    - **Property 5: Dig score formula**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
  - [x] 4.3 Write unit tests for dig mechanic
    - Test dig with exactly 5 plants, large groups, groups at board edges
    - Test rejection: group of 4, mixed types
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 5. Swap mechanic
  - [x] 5.1 Implement swap validation and execution
    - Implement `isValidSwap(board, pos1, pos2)` checking adjacency, different types, non-empty
    - Implement `executeSwap(state, pos1, pos2)` that exchanges plants
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [x] 5.2 Write property tests for swap mechanic
    - **Property 7: Valid swap exchanges exactly two cells**
    - **Property 8: Invalid swap leaves board unchanged**
    - **Property 13: Swap does not modify score**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 6.4**
  - [x] 5.3 Write unit tests for swap mechanic
    - Test valid swaps in all directions
    - Test rejection: diagonal, same type, empty cell
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 6. Board refill logic
  - [x] 6.1 Implement board refill
    - Implement `refillBoard(board, count)` placing plants into random empty cells
    - Handle edge case where fewer empty cells than refill count
    - Wire refill into executeDig (3 plants) and executeSwap (6 plants)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 6.2 Write property tests for refill
    - **Property 6: Dig triggers exactly 3 refills**
    - **Property 9: Swap triggers exactly 6 refills**
    - **Property 10: Refill only fills empty cells**
    - **Validates: Requirements 2.4, 3.4, 4.1, 4.2, 4.4**
  - [x] 6.3 Write unit tests for refill
    - Test refill with many empty cells, exactly N empty cells, fewer than N empty cells
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Game over detection and scoring invariants
  - [x] 7.1 Implement game over detection
    - Implement `isGameOver(board)` checking full board AND no 5+ group
    - Wire game-over check after every refill
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 7.2 Write property tests for game over and scoring
    - **Property 11: Game over if and only if full board with no valid group**
    - **Property 12: Score monotonicity**
    - **Validates: Requirements 5.1, 5.3, 6.2**
  - [x] 7.3 Write unit tests for game over
    - Test full board with no groups (game over), full board with one group (not game over)
    - Test partially filled board (never game over)
    - _Requirements: 5.1, 5.3_

- [x] 8. Game state serialization
  - [x] 8.1 Implement game state serialization and deserialization
    - Implement `serializeState(state)` converting GameState to JSON string
    - Implement `deserializeState(json)` with validation and error handling
    - _Requirements: 16.1, 16.2, 16.3_
  - [x] 8.2 Write property test for serialization round-trip
    - **Property 16: Game state serialization round-trip**
    - **Validates: Requirements 16.3**
  - [x] 8.3 Write unit tests for serialization
    - Test with known game states, corrupted JSON handling
    - _Requirements: 16.1, 16.2_

- [x] 9. Checkpoint - Game engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. SVG plant components and accessibility
  - [x] 10.1 Create SVG plant components for all 5 plant types
    - Create `src/components/plants/` with Watermelon, Flower, Aubergine, Tomato, Pumpkin SVG components
    - Each plant uses unique silhouette, color, and pattern
    - Add `accessibilityLabel` to each SVG component
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 10.2 Write unit tests for plant component accessibility
    - Verify each component renders with correct accessibility label
    - **Property (example-based): Accessibility labels on plant SVGs**
    - **Validates: Requirements 8.3**

- [x] 11. Game board UI and touch interactions
      _AUDIT 2026-07-09: was marked [x] but incomplete — see remediation.md._
  - [x] 11.1 Implement game board grid component
    - Create `src/components/GameBoard.tsx` rendering 8×8 grid with plant SVGs
    - Implement responsive layout for iPad screen sizes (Mini through Pro 12.9")
    - Handle touch/tap for cell selection
    - _AUDIT: grid renders, but sizing uses window height in a 60%-width
      column — board overflows/clips on 10.2"/11"/12.9" iPads; no safe-area
      handling. Layout requirement NOT met (remediation M2)._
    - _Requirements: 7.2, 7.3_
  - [x] 11.2 Implement game action handling (dig and swap gestures)
    - Map single-tap to select cell, second tap to confirm dig group or swap target
    - Connect touch handlers to game engine functions
    - Display visual feedback for invalid actions
    - _AUDIT: selection state machine exists, but `onDig`/`onSwap` in
      app/game.tsx are no-op stubs; the engine is never called anywhere in
      the app; board is a static mock. NOT done (remediation M1)._
    - _Requirements: 9.4_

- [x] 12. Game animations
      _AUDIT 2026-07-09: was marked [x] but animations never run — see remediation.md._
  - [x] 12.1 Implement dig, swap, and refill animations
    - Animate plant removal on dig (fade/shrink)
    - Animate plant exchange on swap (slide)
    - Animate new plants appearing on refill (grow/fade-in)
    - Use React Native Reanimated for smooth 60fps animations
    - _AUDIT: AnimatedCell/SwapAnimation/ScorePopup/useGameAnimations are
      built and exported but GameBoard renders plain BoardCell and game.tsx
      imports none of them — no animation is reachable in the live app
      except the highlight bob (remediation M3)._
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 13. Screen navigation and game flow
      _AUDIT 2026-07-09: was marked [x] but flow is broken — see remediation.md._
  - [x] 13.1 Implement screen navigation with Expo Router
    - Create screens: Main Menu, Game, Game Over, Leaderboard, Settings, Onboarding
    - Wire navigation between screens per design state diagram
    - _AUDIT: screens exist as files, but Onboarding is unreachable (no
      first-run routing), Settings is a literal placeholder Text, and
      /gameover is never navigated to from gameplay. Partially done
      (remediation M1/M4)._
    - _Requirements: 7.1_
  - [x] 13.2 Implement game session lifecycle
    - New game start → play loop → game over → score display
    - Resume interrupted game from serialized state
    - _AUDIT: useGameSession is dead code (zero imports); no play loop, no
      game-over transition, saveGameState/loadGameState never called — no
      resume. NOT done (remediation M1)._
    - _Requirements: 16.1, 16.2_

- [x] 14. Local storage and leaderboard persistence
  - [x] 14.1 Implement local storage service with expo-sqlite
    - Create SQLite schema (local_leaderboard, sync_queue, game_state tables)
    - Implement LocalStorageService interface methods
    - _Requirements: 11.1, 11.4, 13.5_
  - [x] 14.2 Write property tests for local persistence
    - **Property 18: Score persisted to local leaderboard**
    - **Property 19: Local leaderboard entries contain all required fields**
    - **Property 20: Sync queue persistence round-trip**
    - **Validates: Requirements 11.1, 11.2, 11.4, 13.5**
  - [x] 14.3 Implement leaderboard display screen
    - Show local leaderboard with position, score, player name, date
    - Toggle between local and global view based on connectivity
    - _Requirements: 11.2, 11.3_

- [x] 15. Authentication module
  - [x] 15.1 Implement multi-provider authentication
    - Implement AuthService with Apple Sign-In, Game Center, Facebook, Email/Password
    - Implement guest mode (no auth, local-only)
    - Store auth tokens securely with expo-secure-store
    - Providers: Apple (expo-apple-authentication) and Game Center
      (expo-game-center; client-side only, null token). Email/Supabase and
      Facebook were dropped for MVP (the backend moved to DynamoDB); guest mode
      covers users who don't sign in.
    - AuthContext/useAuth hook; home identity chip + gameover name use the real
      display name; sign-in screen (app/signin.tsx)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - [x] 15.2 Write unit tests for auth module
    - Test guest mode restrictions
    - Test auth token storage/retrieval
    - **Property 25: Guest mode restricted to local leaderboard**
    - **Validates: Requirements 10.6**

- [ ] 16. Checkpoint - Client app functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Offline-first sync queue
  - [x] 17.1 Implement sync queue and connectivity detection
    - Implement SyncService with queue processing logic
    - Wire @react-native-community/netinfo for connectivity changes
    - Auto-process queue when connectivity returns
    - Handle success (remove from queue) and failure (retain with retry count)
    - Added `incrementSyncRetry(id)` to LocalStorageService (design.md updated);
      submitScore returns true/false/throws for 2xx/4xx/5xx respectively.
      queueScore (offline-first producer) enqueues + best-effort drains; wired
      into gameover for authenticated players (Requirement 13.1)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [x] 17.2 Write property tests for sync queue behavior
    - **Property 21: Successful sync removes entry from queue**
    - **Property 22: Failed sync retains entry in queue**
    - **Validates: Requirements 13.3, 13.4**
  - [x] 17.3 Write unit tests for sync queue
    - Test enqueue on offline, process on reconnect, retry on server error
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 18. Backend API - Project setup and database
  - [x] 18.1 Initialize standalone SST v4 backend project
    - SST v4 wiring (infra/, microservices/, packages/db structure)
    - Elysia server framework (microservice pattern)
    - **DynamoDB** single table + leaderboard GSI (packages/db); the data store
      moved from Postgres/Supabase to DynamoDB — no Drizzle/migrations, no
      connection pooling to manage from Lambda
    - Reuse api-utils patterns for shared auth/JWT utilities
    - _Requirements: 14.1_
  - [x] 18.2 Implement auth middleware
    - JWT verification for **Apple** tokens (multi-issuer verifier extending the
      jose/JWKS pattern; RS256 pinned). Game Center is client-side only and
      email/Facebook are out of MVP, so none are verified server-side.
    - Rate limiting middleware on score submission (in-memory fixed window;
      per-container caveat documented — needs a shared store for a global limit)
    - _Requirements: 14.3, 14.4_

- [x] 19. Backend API - Endpoints
  - [x] 19.1 Implement score submission endpoint
    - POST /api/scores — validates auth, persists score to database
    - Input validation for score payload
    - _Requirements: 14.1_
  - [x] 19.2 Implement leaderboard endpoint
    - GET /api/leaderboard — returns top scores sorted descending
    - Pagination support
    - _Requirements: 14.2_
  - [x] 19.3 Implement profile endpoint
    - GET /api/profile — returns player profile with best score and total games
    - _Requirements: 14.5_
  - [x] 19.4 Write property tests for backend API
    - **Property 17: Leaderboard entries sorted descending**
    - **Property 23: Invalid auth tokens rejected**
    - **Property 24: Valid score submissions persisted**
    - Driven through Elysia via `app.handle(new Request(...))`
    - **Validates: Requirements 14.1, 14.2, 14.3**
  - [x] 19.5 Write integration tests for backend API
    - Test full auth flow with mock providers
    - Test rate limiting behavior
    - Test leaderboard retrieval with various data sets
    - Handlers live in `src/application/scoreService.ts` (≥90% branch coverage);
      the DynamoDB `ScoreRepository` lives in `packages/db`; Elysia/Lambda wiring
      in `src/api.ts`. Leaderboard uses cursor pagination (`nextCursor`).
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 20. Checkpoint - Backend API complete
  - All gates green. Live `sst deploy --stage dev` + endpoint smoke test and
    Supabase-pooler confirmation are superseded (DynamoDB has no pooler);
    real-environment verification is folded into the Task 23 final checkpoint.

- [x] 21. Client-backend integration
  - [x] 21.1 Wire client to backend API
    - TanStack React Query for API calls (`useGlobalLeaderboard`)
    - Sync queue already targets the real `POST /api/scores` (Task 17)
    - Leaderboard Global tab fetches the real global board (cursor-based),
      replacing the placeholder; offline falls back to Local (11.3)
    - _Requirements: 12.1, 12.2, 13.2_
  - [x] 21.2 Write integration tests for client-backend communication
    - Score submission online + offline paths (SyncService against a mock fetch)
    - Leaderboard fetch/display (API client + React Query hook)
    - _Requirements: 12.1, 12.2, 13.1, 13.2_

- [x] 22. E2E tests for critical flows
  - [x] 22.1 Write E2E tests with Detox
    - Detox configured for iPad simulator (`.detoxrc.js`, `e2e/jest.config.js`);
      specs isolated from the unit-test run (`*.e2e.ts` + testPathIgnorePatterns)
    - Flows: full game → game over → score; sign-in options → global tab;
      offline (URL blacklist) → reconnect; guest → local-only. Deterministic
      client paths use expo-router deep links; backend/Apple-dialog-dependent
      assertions are verified against a dev stage at Task 23.
    - Runs on merge to `main` only (`.github/workflows/e2e.yml`), not per-PR,
      given iOS-simulator cost.
    - _Requirements: All_

- [ ] 23. Final checkpoint — App Store submission readiness

  The bar for this task: everything required to build, verify, and ship Spriggle
  to the App Store as an iPad-only game. Owner tags: **[agent]** = code/config I
  can do; **[manual]** = needs your Apple/AWS accounts or a device/simulator.
  - [ ] 23.1 Native project hygiene — shed the persistence-template drift
    - **[manual]** Regenerate the native project from `app.json`:
      `rm -rf packages/mobile/ios && bunx expo prebuild -p ios --clean` (produces
      a `Spriggle`-branded project: correct scheme, `spriggle` URL scheme,
      landscape lock, Game Center entitlement, new icon/splash).
    - **[agent]** After prebuild, confirm the generated `ios/*.xcworkspace` name
      matches `.detoxrc.js` (`Spriggle`); fix if Expo sanitised it differently.
    - **[agent]** Ensure no unused capabilities/usage strings survive
      (persistence leftovers): HealthKit, in-app-payments (merchant), camera /
      microphone / photo-library usage strings, and `aps-environment` (no push).
      These aren't in `app.json`, so `--clean` should drop them — verify the
      regenerated `Info.plist` / entitlements are clean (declaring unused
      sensitive capabilities triggers review friction).
    - **[agent]** Confirm bundle id `com.bradleyevans96.spriggle`, display name
      "Spriggle", and set `ios.buildNumber` / `version` for the release.

  - [ ] 23.2 Assets & presentation
    - **[manual]** Build to a simulator and visually confirm: landscape-only,
      Spriggle app icon (no baked text, spelling "Spriggle"), Spriggle splash
      (light/dark), and that `spriggle://` deep links open the app.
    - **[agent]** 1024×1024 opaque marketing icon (done); verify no alpha.

  - [ ] 23.3 Backend — production stage
    - **[manual]** `bunx sst deploy --stage production` (provisions the DynamoDB
      table + API Gateway + Lambda). Note the API URL.
    - **[agent]** Set `APPLE_CLIENT_ID` (= the app bundle id / Services ID) in
      the production infra env so Apple token verification works; point the
      client's production `EXPO_PUBLIC_API_URL` (eas.json) at the deployed API.
    - **[manual]** Smoke-test the deployed endpoints (health, leaderboard, and an
      authed score submit + profile with a real Apple identity token).
    - Note: the rate limiter is per-container/in-memory — acceptable for launch;
      a shared store (DynamoDB/Redis) is a post-launch hardening item.

  - [ ] 23.4 Privacy & compliance (App Store requirements)
    - **[manual]** Host a Privacy Policy + Support URL (required in App Store
      Connect).
    - **[agent]** Update `PrivacyInfo.xcprivacy` to reflect real data use +
      required-reason APIs (UserDefaults, file timestamp, etc.); remove
      persistence-era entries.
    - **[manual]** App Store Connect "App Privacy": declare collected data —
      identifiers (Apple/Game Center id), coarse profile (display name), and
      gameplay/score data; linkage + purpose. No tracking/ATT (none used).
    - **[agent]** Confirm `ITSAppUsesNonExemptEncryption: false` (set) so no
      export-compliance docs are needed.
    - **[manual]** Sign in with Apple is offered alongside Game Center (satisfies
      guideline 4.8); guest mode is local-only.

  - [ ] 23.5 Apple Developer / capabilities
    - **[manual]** In the Apple Developer portal, enable Sign in with Apple and
      Game Center on the App ID; regenerate the provisioning profile.
    - **[manual]** Create the App Store Connect app record (bundle id, name,
      Games category, age rating questionnaire).

  - [ ] 23.6 Quality gates — all green before build
    - **[agent]** `bun run prettier:check`, `lint`, `typecheck`, `test:unit`
      (engine + core + api-utils + mobile).
    - **[manual]** Detox E2E green on the iPad simulator (first real run needs
      tuning: installed simulator name in `.detoxrc.js`, `pod install`, Release
      config); confirm the four flows.
    - **[manual]** Manual full-loop smoke test on an iPad simulator/device:
      onboarding → play → dig/swap → game over → local + global leaderboard →
      sign in (Apple) → guest → settings.
    - **[agent]** Accessibility spot-check: plant SVGs + interactive controls
      expose labels (Requirement 8.3).

  - [ ] 23.7 Build & submit
    - **[agent]** Confirm `eas.json` has a `production` iOS profile with the
      production `EXPO_PUBLIC_API_URL`.
    - **[manual]** `eas build -p ios --profile production` (distribution cert +
      provisioning via EAS) → `.ipa`.
    - **[manual]** `eas submit -p ios` → App Store Connect.
    - **[manual]** Upload screenshots for the required iPad display sizes (12.9"
      / 13"), description, keywords, promotional text; attach privacy policy +
      support URLs; submit for review.

  - [ ] 23.8 Spec sign-off
    - **[agent]** Reconcile requirements/design/tasks with any last decisions;
      confirm all prior tasks (1–22) checked and their requirements met.

## Notes

- All tasks including tests are required for MVP
- Game engine (tasks 1-8) is pure TypeScript with no UI dependencies — fully testable in isolation
- Property tests use fast-check with minimum 100 iterations per property
- Each property test references its design document property number
- Backend uses SST v4 (Elysia microservices, DynamoDB single table + GSI, infra/ structure)
- Client uses Expo Router for file-based navigation (matching persistence repo's mobile package conventions)
- Auth patterns (JWT/jose, token verification) reuse persistence repo's api-utils approach
