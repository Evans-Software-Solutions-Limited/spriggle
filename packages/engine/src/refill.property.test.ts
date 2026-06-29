import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { executeDig } from "./dig";
import { executeSwap } from "./swap";
import { refillBoard } from "./refill";
import {
  Board,
  GameState,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
  PlantType,
} from "./types";
import { DIRECTIONS } from "./grid-utils";

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

/** Counts non-null cells on a board. */
function countOccupied(board: Board): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}

/**
 * Generates a board with a known horizontal group of 5–8 same-type plants
 * on a background of a different type. The background is placed sparsely so
 * there are plenty of empty cells for refill.
 */
const arbBoardWithDiggableGroup = fc
  .record({
    groupLen: fc.integer({ min: 5, max: BOARD_SIZE }),
    row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    types: fc.uniqueArray(fc.constantFrom(...PLANT_TYPES), {
      minLength: 2,
      maxLength: 2,
    }),
  })
  .filter(({ groupLen }) => {
    // Ensure group fits horizontally
    return groupLen <= BOARD_SIZE;
  })
  .map(({ groupLen, row, types }) => {
    const [lineType] = types;
    // Start with an empty board, place only the group
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(null),
    );
    const startCol = 0;
    for (let c = startCol; c < startCol + groupLen; c++) {
      board[row][c] = lineType;
    }
    const clicked = { row, col: startCol };
    return { board, clicked, groupLen };
  });

/**
 * Generates a valid swap scenario: two adjacent cells with different types,
 * rest of board mostly empty so refill has room.
 */
const arbBoardWithValidSwap = fc
  .record({
    row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    col: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    dirIdx: fc.integer({ min: 0, max: 3 }),
    types: fc.uniqueArray(fc.constantFrom(...PLANT_TYPES), {
      minLength: 2,
      maxLength: 2,
    }),
  })
  .filter(({ row, col, dirIdx }) => {
    const dir = DIRECTIONS[dirIdx];
    const r2 = row + dir.row;
    const c2 = col + dir.col;
    return r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE;
  })
  .map(({ row, col, dirIdx, types }) => {
    const dir = DIRECTIONS[dirIdx];
    const pos1 = { row, col };
    const pos2 = { row: row + dir.row, col: col + dir.col };
    const [type1, type2] = types;
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array<Cell>(BOARD_SIZE).fill(null),
    );
    board[pos1.row][pos1.col] = type1;
    board[pos2.row][pos2.col] = type2;
    return { board, pos1, pos2 };
  });

describe("Feature: spriggle-ipad-game, Property 6: Dig triggers exactly 3 refills", () => {
  /**
   * **Validates: Requirements 2.4, 4.1**
   *
   * For any successful dig where at least 3 empty cells exist after removal,
   * exactly 3 new plants are placed into previously empty cells.
   */
  it("places exactly 3 new plants after a successful dig", () => {
    fc.assert(
      fc.property(arbBoardWithDiggableGroup, ({ board, clicked, groupLen }) => {
        const state = makeState(board);
        const occupiedBefore = countOccupied(board);
        const result = executeDig(state, clicked);

        expect(result.success).toBe(true);
        // After dig: occupied = before - groupLen + 3 (refill)
        const occupiedAfter = countOccupied(result.newState.board);
        expect(occupiedAfter).toBe(occupiedBefore - groupLen + 3);
        expect(result.refillPositions).toHaveLength(3);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 9: Swap triggers exactly 6 refills", () => {
  /**
   * **Validates: Requirements 3.4, 4.2**
   *
   * For any successful swap where at least 6 empty cells exist,
   * exactly 6 new plants are placed into previously empty cells.
   */
  it("places exactly 6 new plants after a successful swap", () => {
    fc.assert(
      fc.property(arbBoardWithValidSwap, ({ board, pos1, pos2 }) => {
        const state = makeState(board);
        const occupiedBefore = countOccupied(board);
        const result = executeSwap(state, pos1, pos2);

        expect(result.success).toBe(true);
        // After swap: occupied = before + 6 (refill), swap doesn't change count
        const occupiedAfter = countOccupied(result.newState.board);
        expect(occupiedAfter).toBe(occupiedBefore + 6);
        expect(result.refillPositions).toHaveLength(6);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 10: Refill only fills empty cells", () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any refill operation, all cells that were occupied before the refill
   * remain unchanged after the refill.
   */
  it("never overwrites a previously occupied cell", () => {
    // Generate a random board with some occupied and some empty cells
    const arbBoard = fc
      .array(
        fc.array(
          fc.oneof(
            fc.constant(null as Cell),
            fc.constantFrom(...(PLANT_TYPES as unknown as PlantType[])),
          ),
          { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
        ),
        { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
      )
      .map((b) => b as Board);

    fc.assert(
      fc.property(arbBoard, fc.integer({ min: 1, max: 10 }), (board, count) => {
        const { board: refilled } = refillBoard(board, count);

        // Every occupied cell before must remain the same after
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) {
              expect(refilled[row][col]).toBe(board[row][col]);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
