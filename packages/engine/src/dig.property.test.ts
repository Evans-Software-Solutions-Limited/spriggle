import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidDig, executeDig, calculateDigScore } from "./dig";
import { findConnectedGroup } from "./connected-groups";
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

/**
 * Generates a board with a single KNOWN maximal connected group: a
 * horizontal line of `length` cells of `lineType`, on a background filled
 * entirely with a different `bgType`. Because every cell orthogonally
 * adjacent to the line is the background type, the maximal connected group
 * of any line cell is exactly the line.
 */
const arbValidDig = fc
  .integer({ min: 5, max: BOARD_SIZE })
  .chain((length) =>
    fc.record({
      length: fc.constant(length),
      row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
      startCol: fc.integer({ min: 0, max: BOARD_SIZE - length }),
      types: fc
        .uniqueArray(fc.constantFrom(...PLANT_TYPES), {
          minLength: 2,
          maxLength: 2,
        })
        .map(([lineType, bgType]) => ({ lineType, bgType })),
    }),
  )
  .map(({ length, row, startCol, types }) => {
    const { lineType, bgType } = types;
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(bgType),
    );
    const group: Position[] = [];
    for (let i = 0; i < length; i++) {
      board[row][startCol + i] = lineType;
      group.push({ row, col: startCol + i });
    }
    // Click any cell within the line.
    const clickIndex = startCol; // first cell is deterministic & in-group
    return {
      board,
      group,
      clicked: { row, col: clickIndex },
      lineType,
      length,
    };
  });

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

describe("Feature: spriggle-ipad-game, Property 3: Valid dig removes exactly the connected group", () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For any board containing a connected group of 5+ same-type plants,
   * digging at a cell in that group removes the ENTIRE maximal group (all
   * those positions become null) AND no other cells are modified.
   */
  it("nulls exactly the maximal connected group and leaves all other cells unchanged", () => {
    fc.assert(
      fc.property(arbValidDig, ({ board, group, clicked }) => {
        const state = makeState(board);
        const result = executeDig(state, clicked);

        expect(result.success).toBe(true);

        const dug = new Set(group.map((p) => `${p.row},${p.col}`));
        // The removed set must equal the maximal group exactly.
        expect(result.removedPositions.length).toBe(group.length);

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
          // Empty board.
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
        ({ board, clicked, lineType }, startScore) => {
          const state = makeState(board, startScore);
          const groupSize = findConnectedGroup(board, clicked).length;
          const result = executeDig(state, clicked);

          const expectedIncrement = POINTS_PER_PLANT_TYPE[lineType] * groupSize;
          expect(result.success).toBe(true);
          expect(result.newState.score).toBe(startScore + expectedIncrement);
          expect(calculateDigScore(lineType, groupSize)).toBe(
            expectedIncrement,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
