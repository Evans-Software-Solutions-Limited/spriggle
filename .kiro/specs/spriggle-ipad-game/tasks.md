# Implementation Plan: Spriggle iPad Game

## Overview

Incremental implementation starting with the pure game engine (fully testable without UI), then building the client app layer, and finally the standalone backend. Each step builds on the previous, with property tests placed close to the code they validate.

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
  - [x] 11.1 Implement game board grid component
    - Create `src/components/GameBoard.tsx` rendering 8×8 grid with plant SVGs
    - Implement responsive layout for iPad screen sizes (Mini through Pro 12.9")
    - Handle touch/tap for cell selection
    - _Requirements: 7.2, 7.3_
  - [x] 11.2 Implement game action handling (dig and swap gestures)
    - Map single-tap to select cell, second tap to confirm dig group or swap target
    - Connect touch handlers to game engine functions
    - Display visual feedback for invalid actions
    - _Requirements: 9.4_

- [x] 12. Game animations
  - [x] 12.1 Implement dig, swap, and refill animations
    - Animate plant removal on dig (fade/shrink)
    - Animate plant exchange on swap (slide)
    - Animate new plants appearing on refill (grow/fade-in)
    - Use React Native Reanimated for smooth 60fps animations
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 13. Screen navigation and game flow
  - [x] 13.1 Implement screen navigation with Expo Router
    - Create screens: Main Menu, Game, Game Over, Leaderboard, Settings, Onboarding
    - Wire navigation between screens per design state diagram
    - _Requirements: 7.1_
  - [x] 13.2 Implement game session lifecycle
    - New game start → play loop → game over → score display
    - Resume interrupted game from serialized state
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
    - Providers: Apple (expo-apple-authentication), Email (Supabase Auth GoTrue
      REST → Supabase JWT verified by existing api-utils JWKS verifier), Game
      Center (expo-game-center; client-side only, null token — see design.md
      note and Task 18.2). Facebook deferred (not in MVP) — guest covers those
      users; "facebook" retained in the AuthProvider union for the backend model.
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
  - [x] 18.1 Initialize standalone SST v4 backend project (based on persistence-backend-sst template)
    - Scaffold from persistence-backend-sst SST v4 patterns (infra/, microservices/, packages/db structure)
    - Set up Elysia server framework matching persistence repo's microservice pattern
    - Configure Drizzle ORM with PostgreSQL schema (users, scores tables) following persistence repo's packages/db conventions
    - Create database migrations using Drizzle Kit (same workflow as persistence repo)
    - Added `drizzle.config.ts` + generated initial migration (`drizzle/0000_*.sql`);
      `db:generate`/`db:migrate` scripts already present; drizzle output prettier-ignored
    - Reuse persistence repo's api-utils patterns for shared auth/JWT utilities
    - _Requirements: 14.1_
  - [x] 18.2 Implement auth middleware (following persistence-backend-sst auth patterns)
    - JWT verification supporting Apple + Email (Supabase) tokens for MVP
      (multi-issuer verifier extending the jose/JWKS pattern). Game Center is
      deferred (no server-verifiable token) and Facebook is out of MVP, so
      neither is verified server-side.
    - Rate limiting middleware on score submission endpoint (in-memory fixed
      window; per-container caveat documented — needs a shared store for a
      global limit)
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
      the Drizzle `ScoreRepository` lives in `packages/db`; Elysia/Lambda wiring
      in `src/api.ts`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 20. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Client-backend integration
  - [ ] 21.1 Wire client to backend API
    - Configure TanStack React Query for API calls
    - Connect sync queue to real backend endpoints
    - Connect leaderboard screen to fetch global leaderboard
    - _Requirements: 12.1, 12.2, 13.2_
  - [ ] 21.2 Write integration tests for client-backend communication
    - Test score submission flow (online and offline paths)
    - Test leaderboard data fetching and display
    - _Requirements: 12.1, 12.2, 13.1, 13.2_

- [ ] 22. E2E tests for critical flows
  - [ ] 22.1 Write E2E tests with Detox
    - Test full game flow: start → play → game over → score displayed
    - Test auth flow: sign in → play → score on global leaderboard
    - Test offline flow: play offline → reconnect → scores sync
    - Test guest mode: play → local leaderboard only
    - _Requirements: All_

- [ ] 23. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required for MVP
- Game engine (tasks 1-8) is pure TypeScript with no UI dependencies — fully testable in isolation
- Property tests use fast-check with minimum 100 iterations per property
- Each property test references its design document property number
- Backend scaffolds from persistence-backend-sst SST v4 patterns (Elysia microservices, Drizzle ORM, packages/db, infra/ structure)
- Client uses Expo Router for file-based navigation (matching persistence repo's mobile package conventions)
- Auth patterns (JWT/jose, token verification) reuse persistence repo's api-utils approach
