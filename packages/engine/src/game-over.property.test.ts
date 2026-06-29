import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isGameOver } from "./game-over";
import { executeDig } from "./dig";
import { executeSwap } from "./swap";
import {
  Board,
  GameState,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
  PlantType,
  MIN_DIG_GROUP_SIZE,
} from "./types";
import { findAllConnectedGroups } from "./connected-groups";
import { getEmptyCells } from "./board";

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

/**
 * Generates a board with at least one null cell (partially filled).
 */
const arbPartialBoard: fc.Arbitrary<Board> = fc
  .record({
    board: fc.array(
      fc.array(
        fc.oneof(
          fc.constant(null as Cell),
          fc.constantFrom(...(PLANT_TYPES as unknown as PlantType[])),
        ),
        { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
      ),
      { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
    ),
    emptyRow: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
    emptyCol: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
  })
  .map(({ board, emptyRow, emptyCol }) => {
    // Force at least one empty cell
    board[emptyRow][emptyCol] = null;
    return board as Board;
  });

describe("Feature: spriggle-ipad-game, Property 11: Game over if and only if full board with no valid group", () => {
  /**
   * **Validates: Requirements 5.1, 5.3**
   *
   * For any board state, isGameOver returns true if and only if
   * the board is completely full (no null cells) AND no connected
   * group of 5 or more same-type plants exists.
   */
  it("returns true iff board is full and has no group of 5+", () => {
    const arbAnyBoard: fc.Arbitrary<Board> = fc
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
      fc.property(arbAnyBoard, (board) => {
        const result = isGameOver(board);
        const isEmpty = getEmptyCells(board).length > 0;
        const hasLargeGroup = findAllConnectedGroups(board).some(
          (g) => g.length >= MIN_DIG_GROUP_SIZE,
        );

        if (isEmpty) {
          // Board not full → never game over
          expect(result).toBe(false);
        } else if (hasLargeGroup) {
          // Full but has a diggable group → not game over
          expect(result).toBe(false);
        } else {
          // Full and no diggable group → game over
          expect(result).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("a partially filled board is never game over", () => {
    fc.assert(
      fc.property(arbPartialBoard, (board) => {
        expect(isGameOver(board)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 12: Score monotonicity", () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any sequence of game operations within a single session,
   * the score never decreases. We test this by applying random
   * valid digs and swaps and asserting score is non-decreasing.
   */
  it("score never decreases across a sequence of digs and swaps", () => {
    /**
     * Generates a board with a known diggable horizontal group and some
     * room for swaps, then applies a sequence of random actions.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (numDigs) => {
          // Build a board with multiple diggable horizontal groups
          const board: Board = Array.from({ length: BOARD_SIZE }, () =>
            new Array<Cell>(BOARD_SIZE).fill(null),
          );

          // Place diggable groups in different rows
          const type: PlantType = "tomato";
          for (let i = 0; i < Math.min(numDigs, BOARD_SIZE); i++) {
            for (let c = 0; c < 5; c++) {
              board[i][c] = type;
            }
          }

          let state = makeState(board);
          let previousScore = state.score;

          // Execute digs on the placed groups
          for (let i = 0; i < Math.min(numDigs, BOARD_SIZE); i++) {
            const result = executeDig(state, { row: i, col: 0 });
            if (result.success) {
              state = result.newState;
              expect(state.score).toBeGreaterThanOrEqual(previousScore);
              previousScore = state.score;
            }
          }

          // Try a swap if possible (score should stay the same or not decrease)
          // Find two adjacent different-type cells for a swap
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE - 1; c++) {
              const cell1 = state.board[r][c];
              const cell2 = state.board[r][c + 1];
              if (cell1 !== null && cell2 !== null && cell1 !== cell2) {
                const swapResult = executeSwap(
                  state,
                  { row: r, col: c },
                  { row: r, col: c + 1 },
                );
                if (swapResult.success) {
                  expect(swapResult.newState.score).toBeGreaterThanOrEqual(
                    previousScore,
                  );
                  return; // We proved monotonicity for this sequence
                }
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
