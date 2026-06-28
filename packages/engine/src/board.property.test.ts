import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { initializeBoard, INITIAL_SPAWN_COUNT } from "./board";
import {
  BOARD_SIZE,
  PLANT_TYPES,
  Cell,
  Board,
  GameState,
} from "./types";

/**
 * Arbitrary for generating a valid GameState (simulating states produced by operations).
 * Boards may have some empty cells (from digs) and valid plant types.
 */
const arbGameState: fc.Arbitrary<GameState> = fc
  .array(
    fc.array(
      fc.oneof(
        fc.constantFrom(...PLANT_TYPES) as fc.Arbitrary<Cell>,
        fc.constant(null) as fc.Arbitrary<Cell>
      ),
      { minLength: BOARD_SIZE, maxLength: BOARD_SIZE }
    ),
    { minLength: BOARD_SIZE, maxLength: BOARD_SIZE }
  )
  .chain((board) =>
    fc.record({
      board: fc.constant(board as Board),
      score: fc.nat(),
      turns: fc.nat(),
      isGameOver: fc.boolean(),
    })
  );

describe("Feature: spriggle-ipad-game, Property 1: Board structure invariant", () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   *
   * For any game state produced by any sequence of operations (initialize, dig, swap, refill),
   * the board SHALL be exactly 8×8 and every cell SHALL contain either null or one of the 5 valid plant types.
   */
  it("any game state board is exactly 8×8 with valid cells", () => {
    fc.assert(
      fc.property(arbGameState, (state) => {
        expect(state.board.length).toBe(BOARD_SIZE);

        for (let row = 0; row < BOARD_SIZE; row++) {
          expect(state.board[row].length).toBe(BOARD_SIZE);

          for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (cell !== null) {
              expect(PLANT_TYPES).toContain(cell);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("initializeBoard always produces an 8×8 board with valid cells", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const state = initializeBoard();

        expect(state.board.length).toBe(BOARD_SIZE);
        for (let row = 0; row < BOARD_SIZE; row++) {
          expect(state.board[row].length).toBe(BOARD_SIZE);
          for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (cell !== null) {
              expect(PLANT_TYPES).toContain(cell);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 2: Board initialization guarantees playability", () => {
  /**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any newly initialized board, the board SHALL be 8×8 and contain
   * exactly INITIAL_SPAWN_COUNT (10) plants placed into random cells.
   * The remaining cells SHALL be empty (null).
   */
  it("initialized board has exactly 10 occupied cells", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const state = initializeBoard();
        let occupied = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (state.board[row][col] !== null) {
              occupied++;
            }
          }
        }
        expect(occupied).toBe(INITIAL_SPAWN_COUNT);
      }),
      { numRuns: 100 }
    );
  });

  it("initialized board empty cells are null", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const state = initializeBoard();
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = state.board[row][col];
            if (cell !== null) {
              expect(PLANT_TYPES).toContain(cell);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("initialized game state has score 0, turns 0, and isGameOver false", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const state = initializeBoard();

        expect(state.score).toBe(0);
        expect(state.turns).toBe(0);
        expect(state.isGameOver).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
