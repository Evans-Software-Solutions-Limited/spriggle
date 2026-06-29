import { describe, it, expect } from "vitest";
import { isValidDig, executeDig, calculateDigScore } from "./dig";
import { Board, GameState, BOARD_SIZE } from "./types";

/** Builds an empty 8×8 board (all null). */
function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array(BOARD_SIZE).fill(null),
  ) as Board;
}

function stateOf(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

describe("calculateDigScore", () => {
  it("multiplies the per-type points by the plant count (legacy values)", () => {
    expect(calculateDigScore("watermelon", 5)).toBe(15); // 3 × 5
    expect(calculateDigScore("flower", 5)).toBe(30); // 6 × 5
    expect(calculateDigScore("aubergine", 6)).toBe(24); // 4 × 6
    expect(calculateDigScore("tomato", 7)).toBe(35); // 5 × 7
    expect(calculateDigScore("pumpkin", 8)).toBe(16); // 2 × 8
  });
});

describe("isValidDig", () => {
  it("accepts a click on a horizontal group of exactly 5 same-type plants", () => {
    const board = emptyBoard();
    for (let c = 0; c < 5; c++) board[2][c] = "tomato";
    expect(isValidDig(board, { row: 2, col: 0 })).toBe(true);
    expect(isValidDig(board, { row: 2, col: 4 })).toBe(true);
  });

  it("accepts a click anywhere on a connected L-shaped group of 5", () => {
    const board = emptyBoard();
    board[0][0] = "flower";
    board[1][0] = "flower";
    board[2][0] = "flower";
    board[2][1] = "flower";
    board[2][2] = "flower";
    expect(isValidDig(board, { row: 0, col: 0 })).toBe(true);
    expect(isValidDig(board, { row: 2, col: 2 })).toBe(true);
  });

  it("accepts a click on a group at the board edge", () => {
    const board = emptyBoard();
    for (let c = BOARD_SIZE - 5; c < BOARD_SIZE; c++) {
      board[BOARD_SIZE - 1][c] = "pumpkin";
    }
    expect(
      isValidDig(board, { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 }),
    ).toBe(true);
  });

  it("rejects a click on a group of only 4", () => {
    const board = emptyBoard();
    for (let c = 0; c < 4; c++) board[0][c] = "aubergine";
    expect(isValidDig(board, { row: 0, col: 0 })).toBe(false);
  });

  it("rejects a click on an empty cell", () => {
    const board = emptyBoard();
    expect(isValidDig(board, { row: 0, col: 0 })).toBe(false);
  });

  it("rejects an out-of-bounds position", () => {
    const board = emptyBoard();
    expect(isValidDig(board, { row: -1, col: 0 })).toBe(false);
    expect(isValidDig(board, { row: 0, col: BOARD_SIZE })).toBe(false);
  });

  it("does not count diagonally-adjacent same-type cells toward the group", () => {
    const board = emptyBoard();
    // 4 in a row + 1 diagonal (not orthogonally connected) => max group is 4
    board[0][0] = "tomato";
    board[0][1] = "tomato";
    board[0][2] = "tomato";
    board[0][3] = "tomato";
    board[1][4] = "tomato"; // diagonal to (0,3)
    expect(isValidDig(board, { row: 0, col: 0 })).toBe(false);
  });
});

describe("executeDig", () => {
  it("removes the whole group, scores it, and refills 3 plants (exactly 5)", () => {
    const board = emptyBoard();
    for (let c = 0; c < 5; c++) board[3][c] = "flower";
    const result = executeDig(stateOf(board, 0), { row: 3, col: 2 });

    expect(result.success).toBe(true);
    expect(result.removedPositions).toHaveLength(5);
    expect(result.newState.score).toBe(30); // flower=6 × 5
    expect(result.newState.turns).toBe(1);
    // After dig, 5 cells cleared → 59 empty. Refill adds 3 plants.
    expect(result.refillPositions).toHaveLength(3);
  });

  it("digs the ENTIRE maximal group when clicking any cell in it (legacy gospel)", () => {
    const board = emptyBoard();
    // A 10-cell group spanning two rows.
    for (let c = 0; c < 5; c++) {
      board[0][c] = "tomato";
      board[1][c] = "tomato";
    }
    // Click one cell — the whole 10-cell group must be removed.
    const result = executeDig(stateOf(board, 0), { row: 0, col: 0 });
    expect(result.success).toBe(true);
    expect(result.removedPositions).toHaveLength(10);
    expect(result.newState.score).toBe(50); // tomato=5 × 10
    // Refill adds 3 plants into the now-empty board
    expect(result.refillPositions).toHaveLength(3);
  });

  it("returns unchanged state for an invalid dig (group of 4)", () => {
    const board = emptyBoard();
    for (let c = 0; c < 4; c++) board[0][c] = "pumpkin";
    const state = stateOf(board, 50);
    const result = executeDig(state, { row: 0, col: 0 });

    expect(result.success).toBe(false);
    expect(result.newState).toBe(state);
    expect(result.newState.score).toBe(50);
  });

  it("does not mutate the input board on a successful dig", () => {
    const board = emptyBoard();
    for (let c = 0; c < 5; c++) board[1][c] = "watermelon";
    executeDig(stateOf(board, 0), { row: 1, col: 0 });
    for (let c = 0; c < 5; c++) {
      expect(board[1][c]).toBe("watermelon");
    }
  });
});
