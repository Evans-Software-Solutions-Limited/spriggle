# Requirements Document

## Introduction

Spriggle is a landscape-only iPad match-3 gardening game built with React Native (Expo). Players interact with an 8×8 grid of SVG-rendered plants, using dig and swap mechanics to score points. The game supports offline play with local leaderboards and syncs to a global leaderboard when online. The standalone backend uses SST, Elysia, and DynamoDB. The architecture cleanly separates game logic from UI for testability and future extensibility (IAP, social features).

## Glossary

- **Game_Board**: An 8×8 grid data structure where each cell holds a Plant or is empty
- **Plant**: One of five plant types (Watermelon, Flower, Aubergine, Tomato, Pumpkin) rendered as SVG
- **Connected_Group**: A set of orthogonally adjacent cells on the Game_Board containing the same Plant type
- **Dig**: A player action that removes a Connected_Group of 5 or more same-type Plants from the Game_Board
- **Swap**: A player action that exchanges two cells (anywhere on the board) containing different Plant types (no adjacency requirement, per the legacy GardenerGame)
- **Refill**: The system action of adding new random Plants to empty cells after a Dig (3 plants) or Swap (6 plants)
- **Game_Over**: The state when the Game_Board is full and no Connected_Group of 5 or more exists
- **Score**: The cumulative points earned by a player during a single game session
- **Local_Leaderboard**: A device-stored ranking of the player's personal best scores
- **Global_Leaderboard**: A server-stored ranking of all authenticated players' top scores
- **Sync_Queue**: A local queue of score submissions waiting to be sent to the backend when connectivity returns
- **Auth_Provider**: A supported authentication method (Apple Sign-In, Game Center, Facebook, Email/Password)
- **Guest_Mode**: A play mode without authentication; scores are stored locally only
- **Game_Engine**: The core logic module responsible for board state, move validation, scoring, and game-over detection
- **Backend_API**: The standalone SST-deployed server providing leaderboard, auth, and profile endpoints

## Requirements

### Requirement 1: Core Game Board Management

**User Story:** As a player, I want a well-structured game board, so that I can clearly see and interact with plants on the grid.

#### Acceptance Criteria

1. WHEN a new game starts, THE Game_Engine SHALL initialize the Game_Board as an empty 8×8 grid and spawn 10 random Plants of 5 types into randomly selected cells
2. WHEN the Game_Board is initialized, THE Game_Engine SHALL place each spawned Plant into a cell that was empty before that Plant was placed (matching the legacy GardenerGame initial spawn; no playable-group guarantee is enforced)
3. THE Game_Engine SHALL represent each cell as either occupied by exactly one Plant type or empty
4. WHEN the Game_Board state changes, THE Game_Engine SHALL validate that the board dimensions remain 8×8

### Requirement 2: Dig Mechanic

**User Story:** As a player, I want to dig up connected groups of same-type plants, so that I can score points and clear space on the board.

#### Acceptance Criteria

1. WHEN a player selects a Connected_Group of 5 or more same-type Plants, THE Game_Engine SHALL remove all Plants in that group from the Game_Board
2. WHEN a player attempts to dig a group of fewer than 5 connected same-type Plants, THE Game_Engine SHALL reject the action and leave the Game_Board unchanged
3. WHEN a successful Dig completes, THE Game_Engine SHALL add the score equal to (points_per_plant_type × number_of_plants_dug) to the player's Score, where points_per_plant_type is the per-type point value (matching the legacy GardenerGame)
4. WHEN a successful Dig completes, THE Game_Engine SHALL trigger a Refill of exactly 3 new random Plants into empty cells
5. WHEN a player selects a group containing different Plant types, THE Game_Engine SHALL reject the action

### Requirement 3: Swap Mechanic

**User Story:** As a player, I want to swap any two plants, so that I can strategically rearrange the board to create diggable groups.

#### Acceptance Criteria

_Matches the legacy GardenerGame `swapPlants` — there is NO adjacency requirement._

1. WHEN a player selects two cells (anywhere on the board) containing different Plant types, THE Game_Engine SHALL exchange the Plants in those two cells
2. WHEN a player attempts to swap two cells containing the same Plant type, THE Game_Engine SHALL reject the action
3. WHEN a successful Swap completes, THE Game_Engine SHALL trigger a Refill of exactly 6 new random Plants into empty cells
4. WHEN a player attempts to swap a cell that is empty, THE Game_Engine SHALL reject the action

### Requirement 4: Board Refill

**User Story:** As a player, I want the board to refill after actions, so that the game continues with new strategic possibilities.

#### Acceptance Criteria

1. WHEN a Refill is triggered after a Dig, THE Game_Engine SHALL place exactly 3 new random Plants into randomly selected empty cells
2. WHEN a Refill is triggered after a Swap, THE Game_Engine SHALL place exactly 6 new random Plants into randomly selected empty cells
3. WHEN a Refill is triggered and the number of empty cells is fewer than the required Refill count, THE Game_Engine SHALL fill all available empty cells
4. WHEN a Refill completes, THE Game_Engine SHALL only place Plants into cells that were empty before the Refill began

### Requirement 5: Game Over Detection

**User Story:** As a player, I want to know when the game ends, so that I can see my final score and submit it to the leaderboard.

#### Acceptance Criteria

_Matches the legacy GardenerGame `spawnPlants` game-over: the game ends when a
Refill cannot place its full spawn count (the board runs out of empty cells
mid-spawn). A Dig frees ≥5 cells so its 3-plant Refill always fits; a Swap ends
the game when fewer than 6 empty cells remain. A full board with no diggable
group forces a Swap, whose Refill then can't place all 6 → Game_Over._

1. WHEN a Refill cannot place all of its requested Plants because fewer empty cells were available than the spawn count, THE Game_Engine SHALL declare Game_Over
2. WHEN Game_Over is declared, THE Game_Engine SHALL preserve the final Score for leaderboard submission
3. WHILE any Refill can place its full spawn count, THE Game_Engine SHALL allow continued play
4. WHEN a Refill completes (or fails to fully place), THE Game_Engine SHALL evaluate whether Game_Over conditions are met

### Requirement 6: Score Calculation

**User Story:** As a player, I want accurate score tracking, so that I can see my progress and compete on the leaderboard.

#### Acceptance Criteria

1. WHEN a Dig action succeeds, THE Game_Engine SHALL increase the Score by (points_per_plant_type × number_of_plants_dug), where points_per_plant_type is the per-type point value of the dug plant
2. THE Game_Engine SHALL maintain the Score as a non-negative integer that never decreases during a game session
3. WHEN a new game starts, THE Game_Engine SHALL initialize the Score to zero
4. WHEN a Swap action succeeds, THE Game_Engine SHALL not modify the Score

### Requirement 7: iPad Platform and Orientation

**User Story:** As a player, I want the game optimized for my iPad in landscape, so that I have the best visual and interactive experience.

#### Acceptance Criteria

1. THE Application SHALL lock the display orientation to landscape mode
2. THE Application SHALL adapt the game layout to iPad screen sizes (Mini, Air, Pro 11-inch, Pro 12.9-inch)
3. WHEN the application launches, THE Application SHALL render the Game_Board and UI elements within the landscape viewport without cropping or overflow

### Requirement 8: Plant Rendering and Accessibility

**User Story:** As a player, I want visually distinct and accessible plant representations, so that I can differentiate plants regardless of visual ability.

#### Acceptance Criteria

1. THE Application SHALL render each of the 5 Plant types as distinct SVG graphics
2. THE Application SHALL differentiate Plants using three independent channels: unique silhouette shape, unique color, and unique pattern
3. WHEN a Plant is displayed, THE Application SHALL ensure the SVG graphic includes an accessible label identifying the Plant type
4. THE Application SHALL maintain a minimum color contrast ratio of 3:1 between adjacent Plant types on the Game_Board

### Requirement 9: Game Animations

**User Story:** As a player, I want smooth visual feedback for game actions, so that I understand what is happening on the board.

#### Acceptance Criteria

1. WHEN a Dig action succeeds, THE Application SHALL animate the removal of Plants from the Game_Board
2. WHEN a Swap action succeeds, THE Application SHALL animate the exchange of the two Plants
3. WHEN a Refill occurs, THE Application SHALL animate new Plants appearing in empty cells
4. WHEN an invalid action is attempted, THE Application SHALL provide visual feedback indicating the action was rejected

### Requirement 10: Authentication

**User Story:** As a player, I want to sign in with my preferred method, so that my scores are linked to my identity for global leaderboard participation.

#### Acceptance Criteria

1. WHEN a player chooses Apple Sign-In, THE Application SHALL authenticate via Apple's identity provider and create or retrieve the player profile
2. WHEN a player chooses Game Center, THE Application SHALL authenticate via Game Center and create or retrieve the player profile
3. WHEN a player chooses Facebook login, THE Application SHALL authenticate via Facebook's identity provider and create or retrieve the player profile _(Deferred — not in MVP. Facebook is not offered as a client sign-in option; guest mode covers these users. The "facebook" provider value is retained in the backend user model for future support.)_
4. WHEN a player chooses Email/Password, THE Application SHALL authenticate via email and password credentials and create or retrieve the player profile _(Removed — not in MVP. Email/password relied on Supabase, which was dropped when the backend moved to DynamoDB. Apple Sign-In and Guest are the MVP paths.)_
5. WHEN a player chooses Guest_Mode, THE Application SHALL allow full gameplay without authentication
6. WHILE in Guest_Mode, THE Application SHALL restrict leaderboard functionality to the Local_Leaderboard only

### Requirement 11: Local Leaderboard

**User Story:** As a player, I want to see my personal best scores stored on my device, so that I can track my progress even without internet.

#### Acceptance Criteria

1. WHEN a game ends, THE Application SHALL persist the final Score, player name, and date to the Local_Leaderboard using device storage
2. THE Application SHALL display the Local_Leaderboard showing position, score, player name, and date for each entry
3. WHEN the device has no network connectivity, THE Application SHALL display the Local_Leaderboard as the primary leaderboard view
4. THE Application SHALL retain Local_Leaderboard data across app restarts

### Requirement 12: Global Leaderboard

**User Story:** As a player, I want to compete with other players worldwide, so that I can see how my scores rank globally.

#### Acceptance Criteria

1. WHEN an authenticated player's game ends and the device is online, THE Application SHALL submit the final Score to the Backend_API for the Global_Leaderboard
2. WHEN the device is online, THE Application SHALL fetch and display the Global_Leaderboard showing position, score, player name, and date
3. WHEN the Backend_API returns the Global_Leaderboard data, THE Application SHALL sort entries by score in descending order

### Requirement 13: Offline-First Score Synchronization

**User Story:** As a player, I want my scores saved even when offline, so that they sync to the global leaderboard when I reconnect.

#### Acceptance Criteria

1. WHEN an authenticated player's game ends and the device is offline, THE Application SHALL add the score submission to the Sync_Queue
2. WHEN network connectivity is restored, THE Application SHALL process all entries in the Sync_Queue by submitting them to the Backend_API
3. WHEN a Sync_Queue entry is successfully submitted, THE Application SHALL remove it from the queue
4. IF a Sync_Queue submission fails due to a server error, THEN THE Application SHALL retain the entry in the queue for retry
5. THE Application SHALL persist the Sync_Queue across app restarts

### Requirement 14: Backend API

**User Story:** As a system operator, I want a standalone backend service, so that the game has reliable server-side leaderboard and profile management.

#### Acceptance Criteria

1. WHEN a score submission request is received with a valid auth token, THE Backend_API SHALL persist the score to the DynamoDB database
2. WHEN a leaderboard request is received, THE Backend_API SHALL return the top scores sorted by score descending
3. WHEN a request is received with an invalid or expired auth token, THE Backend_API SHALL reject the request with an appropriate error
4. THE Backend_API SHALL enforce rate limiting on score submission endpoints to prevent abuse
5. WHEN a profile request is received with a valid auth token, THE Backend_API SHALL return the player's profile information

### Requirement 15: Connected Group Detection

**User Story:** As the game system, I want reliable connected group detection, so that dig validity and game-over conditions are always correctly determined.

#### Acceptance Criteria

1. THE Game_Engine SHALL identify Connected_Groups using orthogonal adjacency (up, down, left, right) only
2. THE Game_Engine SHALL not consider diagonal adjacency when computing Connected_Groups
3. FOR ALL valid Game_Board states, THE Game_Engine SHALL correctly identify every Connected_Group and its size
4. WHEN the Game_Board state changes, THE Game_Engine SHALL recompute Connected_Groups to reflect the current state

### Requirement 16: Game State Serialization

**User Story:** As a player, I want my in-progress game saved, so that I can resume if the app is interrupted.

#### Acceptance Criteria

1. WHEN the application moves to the background, THE Application SHALL serialize the current game state (Game_Board, Score, turn count) to device storage
2. WHEN the application resumes, THE Application SHALL deserialize the saved game state and restore play from the exact saved position
3. FOR ALL valid game states, serializing then deserializing SHALL produce an equivalent game state (round-trip property)

### Requirement 17: First-Run Onboarding Tutorial

**User Story:** As a first-time player, I want a short interactive tutorial, so that I learn the dig and swap mechanics before playing.

Authoritative reference: the prototype's `onboarding.js` (a scripted 3-beat tutorial) and its `finish()`/`done()` routing. See phase-2-corrections.md C5.

#### Acceptance Criteria

1. THE Application SHALL persist an `onboarded` flag in device storage that records whether the tutorial has been completed
2. WHEN the application launches AND the player has not completed the tutorial, THE Application SHALL route the player through sign-in and then the tutorial before the home screen
3. WHEN the application launches AND the player has completed the tutorial, THE Application SHALL NOT show the tutorial and SHALL proceed to the home screen
4. THE Tutorial SHALL present three scripted beats on the real game board — (a) dig a seeded 5-group, (b) swap two ringed cells to line up a 5-group, (c) dig the newly formed group — advancing only when the scripted cell is tapped
5. WHEN the player taps a cell that is not part of the current beat's scripted target, THE Tutorial SHALL give a shake/haptic rejection and SHALL NOT advance
6. WHEN the tutorial is completed or skipped, THE Application SHALL set the `onboarded` flag and route into the game
7. WHEN a first-run sign-in (guest included) succeeds, THE Application SHALL route into the tutorial rather than dismissing to the home screen
8. THE Tutorial SHALL remain reachable after first run from the in-game pause sheet ("How to play"), and completing it from there SHALL return to the game without restarting it
