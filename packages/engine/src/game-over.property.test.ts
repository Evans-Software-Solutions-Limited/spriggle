import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { executeDig } from "./dig";
import { executeSwap } from "./swap";
import {
  Board,
  GameState,
  Cell,
  BOARD_SIZE,
  PlantType,
  REFILL_AFTER_SWAP,
} from "./types";
import { getEmptyCells } from "./board";

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

/** A full board whose cycling pattern contains no connected group of 5+. */
function fullBoardNoGroups(): Board {
  const types: PlantType[] = ["watermelon", "flower", "aubergine", "tomato"];
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const r: PlantType[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      r.push(types[(col + row * 2) % types.length]);
    }
    board.push(r);
  }
  return board;
}

describe("Feature: spriggle-ipad-game, Property 11: Game over when a refill cannot place its full spawn count", () => {
  /**
   * **Validates: Requirements 5.1, 5.3, 5.4**
   *
   * Ports the legacy GardenerGame's spawn-starvation rule: after an action,
   * the game is over iff the refill could not place all its plants (there were
   * fewer empty cells than the spawn count). A swap requests 6, so it ends the
   * game exactly when fewer than 6 empty cells were available before it.
   */
  it("a swap reports game over iff fewer than 6 empty cells were available", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 12 }), (k) => {
        // Full no-group board with k empty cells (row 0 kept intact so the
        // (0,0)/(0,1) swap pair is always present and different-type).
        const board = fullBoardNoGroups();
        let nulled = 0;
        for (let r = BOARD_SIZE - 1; r >= 1 && nulled < k; r--) {
          for (let c = 0; c < BOARD_SIZE && nulled < k; c++) {
            board[r][c] = null;
            nulled++;
          }
        }
        const emptiesBefore = getEmptyCells(board).length;
        const result = executeSwap(
          makeState(board),
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        );
        expect(result.success).toBe(true);
        expect(result.newState.isGameOver).toBe(
          emptiesBefore < REFILL_AFTER_SWAP,
        );
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
   * the score never decreases.
   */
  it("score never decreases across a sequence of digs and swaps", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (numDigs) => {
        const board: Board = Array.from({ length: BOARD_SIZE }, () =>
          new Array<Cell>(BOARD_SIZE).fill(null),
        );

        const type: PlantType = "tomato";
        for (let i = 0; i < Math.min(numDigs, BOARD_SIZE); i++) {
          for (let c = 0; c < 5; c++) {
            board[i][c] = type;
          }
        }

        let state = makeState(board);
        let previousScore = state.score;

        for (let i = 0; i < Math.min(numDigs, BOARD_SIZE); i++) {
          const result = executeDig(state, { row: i, col: 0 });
          if (result.success) {
            state = result.newState;
            expect(state.score).toBeGreaterThanOrEqual(previousScore);
            previousScore = state.score;
          }
        }

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
                return;
              }
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
