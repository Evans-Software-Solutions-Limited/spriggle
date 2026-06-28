import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidDig, executeDig, calculateDigScore } from "./dig";
import {
  Board,
  GameState,
  Position,
  PlantType,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
  POINTS_PER_PLANT_TYPE,
} from "./types";

/** A horizontal run of 5–8 same-type cells. */
const arbHorizontal: fc.Arbitrary<Position[]> = fc
  .integer({ min: 5, max: BOARD_SIZE })
  .chain((n) =>
    fc
      .record({
        row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
        startCol: fc.integer({ min: 0, max: BOARD_SIZE - n }),
      })
      .map(({ row, startCol }) =>
        Array.from({ length: n }, (_, i) => ({ row, col: startCol + i })),
      ),
  );

/** A vertical run of 5–8 same-type cells. */
const arbVertical: fc.Arbitrary<Position[]> = fc
  .integer({ min: 5, max: BOARD_SIZE })
  .chain((n) =>
    fc
      .record({
        col: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
        startRow: fc.integer({ min: 0, max: BOARD_SIZE - n }),
      })
      .map(({ col, startRow }) =>
        Array.from({ length: n }, (_, i) => ({ row: startRow + i, col })),
      ),
  );

/** An L-shape: vertical arm (≥3) + horizontal foot (≥3), sharing the corner. */
const arbLShape: fc.Arbitrary<Position[]> = fc
  .record({
    arm: fc.integer({ min: 3, max: 6 }),
    foot: fc.integer({ min: 3, max: 6 }),
  })
  .chain(({ arm, foot }) =>
    fc
      .record({
        arm: fc.constant(arm),
        foot: fc.constant(foot),
        top: fc.integer({ min: 0, max: BOARD_SIZE - arm }),
        left: fc.integer({ min: 0, max: BOARD_SIZE - foot }),
      })
      .map(({ top, left }) => {
        const cells: Position[] = [];
        for (let i = 0; i < arm; i++) cells.push({ row: top + i, col: left });
        for (let j = 1; j < foot; j++)
          cells.push({ row: top + arm - 1, col: left + j });
        return cells;
      }),
  );

/**
 * Generates a board with a single KNOWN maximal connected group of varied
 * shape (horizontal, vertical, or L). The board is filled with a different
 * background type so the group of any group cell is exactly the placed shape.
 * Also returns a randomly-chosen clicked cell within the group.
 */
const arbValidDig = fc
  .record({
    cells: fc.oneof(arbHorizontal, arbVertical, arbLShape),
    types: fc.uniqueArray(fc.constantFrom(...PLANT_TYPES), {
      minLength: 2,
      maxLength: 2,
    }),
    clickSeed: fc.nat(),
  })
  .map(({ cells, types, clickSeed }) => {
    const [lineType, bgType] = types;
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(bgType),
    );
    for (const c of cells) board[c.row][c.col] = lineType;
    const clicked = cells[clickSeed % cells.length];
    return { board, group: cells, clicked, lineType, length: cells.length };
  });

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

describe("Feature: spriggle-ipad-game, Property 3: Valid dig removes exactly the connected group", () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For any board containing a connected group of 5+ same-type plants,
   * digging at any cell in that group removes the ENTIRE maximal group (all
   * those positions become null) AND no other cells are modified.
   */
  it("nulls exactly the maximal connected group and leaves all other cells unchanged", () => {
    fc.assert(
      fc.property(arbValidDig, ({ board, group, clicked }) => {
        const state = makeState(board);
        const result = executeDig(state, clicked);

        expect(result.success).toBe(true);
        expect(result.removedPositions.length).toBe(group.length);

        const dug = new Set(group.map((p) => `${p.row},${p.col}`));
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (dug.has(`${row},${col}`)) {
              expect(result.newState.board[row][col]).toBeNull();
            } else {
              expect(result.newState.board[row][col]).toBe(board[row][col]);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 4: Invalid dig leaves board unchanged", () => {
  /**
   * **Validates: Requirements 2.2, 2.5**
   *
   * Digging at a cell whose maximal connected group is smaller than 5, or at
   * an empty cell, fails and leaves the board state identical. (Mixed-type
   * groups cannot occur: the engine derives a same-type group by
   * construction.)
   */
  it("rejects a dig whose maximal group is smaller than 5 and leaves state unchanged", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
        (length, row) => {
          const startCol = 0;
          // Distinct line vs background types so the group is exactly `length`.
          const lineType: PlantType = "tomato";
          const bgType: PlantType = "flower";
          const board: Board = Array.from({ length: BOARD_SIZE }, () =>
            new Array<Cell>(BOARD_SIZE).fill(bgType),
          );
          for (let i = 0; i < length; i++) board[row][startCol + i] = lineType;
          const clicked = { row, col: startCol };
          const state = makeState(board, 42);

          expect(isValidDig(board, clicked)).toBe(false);
          const result = executeDig(state, clicked);
          expect(result.success).toBe(false);
          expect(result.newState).toBe(state);
          expect(result.newState.board).toEqual(board);
          expect(result.newState.score).toBe(42);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rejects a dig on an empty cell and leaves state unchanged", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
        fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
        (row, col) => {
          const board: Board = Array.from({ length: BOARD_SIZE }, () =>
            new Array<Cell>(BOARD_SIZE).fill(null),
          );
          const state = makeState(board, 9);

          expect(isValidDig(board, { row, col })).toBe(false);
          const result = executeDig(state, { row, col });
          expect(result.success).toBe(false);
          expect(result.newState).toBe(state);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 5: Dig score formula", () => {
  /**
   * **Validates: Requirements 2.3, 6.1**
   *
   * For any valid dig of a group of N plants of a given type, the score
   * increases by exactly (points_per_plant_for_that_type × N).
   */
  it("increases the score by POINTS_PER_PLANT_TYPE[type] × group size", () => {
    fc.assert(
      fc.property(
        arbValidDig,
        fc.nat(),
        ({ board, clicked, lineType, length }, startScore) => {
          const state = makeState(board, startScore);
          const result = executeDig(state, clicked);

          const expectedIncrement = POINTS_PER_PLANT_TYPE[lineType] * length;
          expect(result.success).toBe(true);
          expect(result.newState.score).toBe(startScore + expectedIncrement);
          expect(calculateDigScore(lineType, length)).toBe(expectedIncrement);
        },
      ),
      { numRuns: 100 },
    );
  });
});
