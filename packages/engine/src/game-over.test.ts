import { describe, it, expect } from "vitest";
import { isRefillStarved } from "./game-over";
import { executeDig } from "./dig";
import { executeSwap } from "./swap";
import { Board, GameState, BOARD_SIZE, PlantType } from "./types";

/** Builds an empty 8×8 board (all null). */
function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array(BOARD_SIZE).fill(null),
  ) as Board;
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

function makeState(board: Board): GameState {
  return { board, score: 0, turns: 0, isGameOver: false };
}

/** Null out `k` cells starting from the bottom, leaving row 0 intact. */
function withEmpties(board: Board, k: number): Board {
  let nulled = 0;
  for (let r = BOARD_SIZE - 1; r >= 1 && nulled < k; r--) {
    for (let c = 0; c < BOARD_SIZE && nulled < k; c++) {
      board[r][c] = null;
      nulled++;
    }
  }
  return board;
}

describe("isRefillStarved (legacy spawn-starvation game-over rule)", () => {
  it("is true iff fewer plants were placed than the refill requested", () => {
    expect(isRefillStarved(3, 3)).toBe(false);
    expect(isRefillStarved(2, 3)).toBe(true);
    expect(isRefillStarved(6, 6)).toBe(false);
    expect(isRefillStarved(5, 6)).toBe(true);
    expect(isRefillStarved(0, 6)).toBe(true);
  });
});

describe("game over via actions", () => {
  it("a swap ends the game when fewer than 6 empty cells remain", () => {
    // 3 empty cells; a swap's 6-plant refill can only place 3 → starved.
    const board = withEmpties(fullBoardNoGroups(), 3);
    const result = executeSwap(
      makeState(board),
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    );
    expect(result.success).toBe(true);
    expect(result.newState.isGameOver).toBe(true);
  });

  it("a swap does NOT end the game when at least 6 empty cells remain", () => {
    const board = withEmpties(fullBoardNoGroups(), 6);
    const result = executeSwap(
      makeState(board),
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    );
    expect(result.success).toBe(true);
    expect(result.newState.isGameOver).toBe(false);
  });

  it("a dig never ends the game (it frees ≥5 cells for a 3-plant refill)", () => {
    const board = emptyBoard();
    for (let c = 0; c < 5; c++) board[0][c] = "tomato";
    const result = executeDig(makeState(board), { row: 0, col: 0 });
    expect(result.success).toBe(true);
    expect(result.newState.isGameOver).toBe(false);
  });
});
