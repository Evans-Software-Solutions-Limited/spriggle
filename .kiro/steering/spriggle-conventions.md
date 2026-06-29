# Spriggle — Working Conventions

Durable context for anyone (human or agent) working on the Spriggle iPad game.
The active spec lives in `.kiro/specs/spriggle-ipad-game/`
(`requirements.md`, `design.md`, `tasks.md`). Implement tasks in order.

## Source of truth: the legacy GardenerGame is GOSPEL

There is a legacy implementation of this game called **GardenerGame** (a
separate React/Recoil web app). Its game logic is the **authoritative
reference** for all mechanics — board init, dig, swap, refill, scoring,
game-over. When a spec detail is ambiguous or seems to conflict with the
legacy, **the legacy behaviour wins** and the spec should be reconciled to match.

- GardenerGame is a **separate repository / workspace folder**, not part of
  this repo. If it isn't in your workspace, ask the user to add it before
  implementing game-logic tasks.
- Key legacy files to consult:
  - `src/hooks/useGameLogic.ts` — matching/dig/swap/scoring helpers
  - `src/hooks/useSpawnLogic.ts` — spawn/refill logic
  - `src/page/Gardener.tsx` — game loop wiring (initial spawn of 10, refill 3 after dig / 6 after swap)
  - `src/components/gameboard/BoardCell.tsx` — dig/swap interaction wiring
  - `src/components/plantables/plantables.ts` — per-plant-type point values

### Mechanics already settled (from the legacy)

- **Board init:** start with an **empty** 8×8 board, spawn **10 random** plants.
  No "guarantee a 5+ group" / no retry logic.
- **Scoring is per-plant-type**, not a flat rate:
  watermelon 3, flower 6, aubergine 4, tomato 5, pumpkin 2
  (`POINTS_PER_PLANT_TYPE` in `packages/engine/src/types.ts`).
  Dig score = `pointsPerType × groupSize`.
- **Dig digs the entire MAXIMAL connected group** from a single tapped cell —
  a partial subset can never be dug. `executeDig(state, position)` takes one
  cell and expands via `findConnectedGroup`.
- **Refill:** 3 plants after a dig, 6 after a swap (wired in task 6).
- **Game over:** board full AND no connected group of 5+ (task 7).

## Engine code conventions (`packages/engine`)

- **Pure functions, no side effects.** Engine functions never mutate inputs.
  Clone the board (`board.map(row => [...row])`) before edits.
- On an **invalid action**, return `{ success: false, newState: state, ... }` —
  the SAME state reference, unchanged.
- Reuse shared grid helpers from `grid-utils.ts` (`DIRECTIONS`, `isInBounds`,
  `posKey`) rather than re-declaring them.
- Export new modules from `src/index.ts`.

## Testing

- **Vitest** for unit + property tests; **fast-check** for property-based tests.
- Run from the engine package: `npx vitest run` (or `bun run test:unit` at the
  root, which runs all packages with coverage via Turbo).
- Property tests: minimum **100 runs** each; name the `describe` block
  `Feature: spriggle-ipad-game, Property {N}: {title}` and reference the
  validated requirements in a docstring. Each property number maps to
  `design.md`'s Correctness Properties section.
- Keep unit tests (`*.test.ts`) and property tests (`*.property.test.ts`)
  in separate files alongside the module they cover.
- Coverage gate is enforced in CI (core has a 90% branch threshold). Don't drop
  below it — add generic tests if a refactor removes covered branches.

## CI gates (must pass before merge)

CI (`.github/workflows/ci.yml`) runs, via Turbo across all packages:
`prettier:check`, `lint`, `typecheck`, and `test:unit` with coverage.
Before pushing, run from the repo root:

```
bun run prettier:write   # then prettier:check is clean
bun run lint
bun run typecheck
bun run test:unit
```

## Git / PR workflow

- One **feature branch per task** (e.g. `feat/swap-mechanic`), branched from
  an up-to-date `main`. Never commit directly to `main`.
- Open a PR, wait for CI green, then **squash-merge** and delete the branch.
- After opening a PR, a focused **"Inspector Brad" code review** (via a
  sub-agent) is run against the diff — correctness, alignment with the legacy
  gospel, test coverage, edge cases. Resolve must-fix items before merging.
- Keep the spec (`requirements.md` / `design.md` / `tasks.md`) in sync when an
  implementation decision changes behaviour or an API signature.

## Package manager

Use **Bun** (`bun install`, `bun run <script>`). Do not use npm or yarn.
