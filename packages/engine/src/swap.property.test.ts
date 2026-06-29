import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidSwap, executeSwap } from "./swap";
import {
  Board,
  GameState,
  Position,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
} from "./types";
import { DIRECTIONS } from "./grid-utils";

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

/**
 * Generates a board filled with a background type, then places two DIFFERENT
 * plant types in two orthogonally adjacent cells. Returns the board, the two
 * positions, and their plant types.
 */
const arbValidSwap = fc
  .record({
    row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    dirIdx: fc.integer({ min: 0, max: 3 }),
    types: fc.uniqueArray(fc.constantFrom(...PLANT_TYPES), {
      minLength: 3,
      maxLength: 3,
    }),
    score: fc.nat({ max: 100000 }),
  })
  .filter(({ row, col, dirIdx }) => {
    const dir = DIRECTIONS[dirIdx];
    const r2 = row + dir.row;
    const c2 = col + dir.col;
    return r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE;
  })
  .map(({ row, col, dirIdx, types, score }) => {
    const dir = DIRECTIONS[dirIdx];
    const pos1: Position = { row, col };
    const pos2: Position = { row: row + dir.row, col: col + dir.col };
    const [type1, type2, bgType] = types;
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(bgType),
    );
    board[pos1.row][pos1.col] = type1;
    board[pos2.row][pos2.col] = type2;
    return { board, pos1, pos2, type1, type2, score };
  });

/**
 * Generates an invalid swap scenario: one of
 * (a) non-adjacent positions, (b) same plant type, or (c) one empty cell.
 */
const arbInvalidSwapNonAdjacent = fc
  .record({
    row1: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col1: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    row2: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col2: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    type1: fc.constantFrom(...PLANT_TYPES),
    type2: fc.constantFrom(...PLANT_TYPES),
    score: fc.nat({ max: 100000 }),
  })
  .filter(({ row1, col1, row2, col2, type1, type2 }) => {
    // Ensure non-adjacent (Manhattan distance > 1)
    const dist = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    return dist > 1 && type1 !== type2;
  })
  .map(({ row1, col1, row2, col2, type1, type2, score }) => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(null),
    );
    board[row1][col1] = type1;
    board[row2][col2] = type2;
    const pos1: Position = { row: row1, col: col1 };
    const pos2: Position = { row: row2, col: col2 };
    return { board, pos1, pos2, score };
  });

const arbInvalidSwapSameType = fc
  .record({
    row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col: fc.integer({ min: 0, max: BOARD_SIZE - 2 }),
    plantType: fc.constantFrom(...PLANT_TYPES),
    score: fc.nat({ max: 100000 }),
  })
  .map(({ row, col, plantType, score }) => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(null),
    );
    board[row][col] = plantType;
    board[row][col + 1] = plantType;
    const pos1: Position = { row, col };
    const pos2: Position = { row, col: col + 1 };
    return { board, pos1, pos2, score };
  });

const arbInvalidSwapEmptyCell = fc
  .record({
    row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col: fc.integer({ min: 0, max: BOARD_SIZE - 2 }),
    plantType: fc.constantFrom(...PLANT_TYPES),
    score: fc.nat({ max: 100000 }),
  })
  .map(({ row, col, plantType, score }) => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(null),
    );
    board[row][col] = plantType;
    // board[row][col+1] stays null
    const pos1: Position = { row, col };
    const pos2: Position = { row, col: col + 1 };
    return { board, pos1, pos2, score };
  });

describe("Feature: spriggle-ipad-game, Property 7: Valid swap exchanges exactly two cells", () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * For any board and two orthogonally adjacent cells containing different
   * plant types, executing a swap results in the plants in those two cells
   * being exchanged AND no other previously-occupied cells being modified.
   * (Refill may fill previously-empty cells.)
   */
  it("exchanges exactly the two targeted cells and leaves all other occupied cells unchanged", () => {
    fc.assert(
      fc.property(arbValidSwap, ({ board, pos1, pos2, type1, type2, score }) => {
        const state = makeState(board, score);
        const result = executeSwap(state, pos1, pos2);

        expect(result.success).toBe(true);

        // The two cells are exchanged
        expect(result.newState.board[pos1.row][pos1.col]).toBe(type2);
        expect(result.newState.board[pos2.row][pos2.col]).toBe(type1);

        const refilled = new Set(
          result.refillPositions.map((p) => `${p.row},${p.col}`),
        );

        // All other non-refilled cells unchanged
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (
              (row === pos1.row && col === pos1.col) ||
              (row === pos2.row && col === pos2.col)
            ) {
              continue;
            }
            const key = `${row},${col}`;
            if (!refilled.has(key)) {
              expect(result.newState.board[row][col]).toBe(board[row][col]);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 8: Invalid swap leaves board unchanged", () => {
  /**
   * **Validates: Requirements 3.2, 3.3, 3.5**
   *
   * For any swap attempt where the cells are (a) not orthogonally adjacent,
   * (b) contain the same plant type, or (c) involve an empty cell, the action
   * fails and the board state remains identical.
   */
  it("rejects non-adjacent swap and leaves state unchanged", () => {
    fc.assert(
      fc.property(arbInvalidSwapNonAdjacent, ({ board, pos1, pos2, score }) => {
        const state = makeState(board, score);

        expect(isValidSwap(board, pos1, pos2)).toBe(false);
        const result = executeSwap(state, pos1, pos2);
        expect(result.success).toBe(false);
        expect(result.newState).toBe(state);
      }),
      { numRuns: 100 },
    );
  });

  it("rejects same-type swap and leaves state unchanged", () => {
    fc.assert(
      fc.property(arbInvalidSwapSameType, ({ board, pos1, pos2, score }) => {
        const state = makeState(board, score);

        expect(isValidSwap(board, pos1, pos2)).toBe(false);
        const result = executeSwap(state, pos1, pos2);
        expect(result.success).toBe(false);
        expect(result.newState).toBe(state);
      }),
      { numRuns: 100 },
    );
  });

  it("rejects swap involving an empty cell and leaves state unchanged", () => {
    fc.assert(
      fc.property(arbInvalidSwapEmptyCell, ({ board, pos1, pos2, score }) => {
        const state = makeState(board, score);

        expect(isValidSwap(board, pos1, pos2)).toBe(false);
        const result = executeSwap(state, pos1, pos2);
        expect(result.success).toBe(false);
        expect(result.newState).toBe(state);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 13: Swap does not modify score", () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any successful swap, the score before and after the swap is identical.
   */
  it("preserves the score exactly on a valid swap", () => {
    fc.assert(
      fc.property(arbValidSwap, ({ board, pos1, pos2, score }) => {
        const state = makeState(board, score);
        const result = executeSwap(state, pos1, pos2);

        expect(result.success).toBe(true);
        expect(result.newState.score).toBe(score);
      }),
      { numRuns: 100 },
    );
  });
});
