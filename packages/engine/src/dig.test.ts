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
  it("accepts a horizontal group of exactly 5 same-type plants", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 5; c++) {
      board[2][c] = "tomato";
      group.push({ row: 2, col: c });
    }
    expect(isValidDig(board, group)).toBe(true);
  });

  it("accepts a connected L-shaped group of 5", () => {
    const board = emptyBoard();
    // vertical arm + horizontal foot
    board[0][0] = "flower";
    board[1][0] = "flower";
    board[2][0] = "flower";
    board[2][1] = "flower";
    board[2][2] = "flower";
    const group = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ];
    expect(isValidDig(board, group)).toBe(true);
  });

  it("accepts a group at the board edge", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = BOARD_SIZE - 5; c < BOARD_SIZE; c++) {
      board[BOARD_SIZE - 1][c] = "pumpkin";
      group.push({ row: BOARD_SIZE - 1, col: c });
    }
    expect(isValidDig(board, group)).toBe(true);
  });

  it("rejects a group of 4", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 4; c++) {
      board[0][c] = "aubergine";
      group.push({ row: 0, col: c });
    }
    expect(isValidDig(board, group)).toBe(false);
  });

  it("rejects a selection of mixed types", () => {
    const board = emptyBoard();
    for (let c = 0; c < 5; c++) board[0][c] = "watermelon";
    board[0][4] = "flower"; // one different
    const group = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ];
    expect(isValidDig(board, group)).toBe(false);
  });

  it("rejects a selection that is not connected", () => {
    const board = emptyBoard();
    // two separate runs of the same type, total 5 but disconnected
    board[0][0] = "tomato";
    board[0][1] = "tomato";
    board[0][2] = "tomato";
    board[5][5] = "tomato";
    board[5][6] = "tomato";
    const group = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 5, col: 5 },
      { row: 5, col: 6 },
    ];
    expect(isValidDig(board, group)).toBe(false);
  });

  it("rejects a selection touching an empty cell", () => {
    const board = emptyBoard();
    const group = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ];
    // leave board cells null (empty)
    expect(isValidDig(board, group)).toBe(false);
  });
});

describe("executeDig", () => {
  it("removes exactly 5 plants and scores them", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 5; c++) {
      board[3][c] = "flower";
      group.push({ row: 3, col: c });
    }
    const result = executeDig(stateOf(board, 0), group);

    expect(result.success).toBe(true);
    expect(result.removedPositions).toHaveLength(5);
    expect(result.newState.score).toBe(30); // flower=6 × 5
    expect(result.newState.turns).toBe(1);
    for (const pos of group) {
      expect(result.newState.board[pos.row][pos.col]).toBeNull();
    }
  });

  it("scores a large group correctly", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 8; c++) {
      board[0][c] = "tomato";
      group.push({ row: 0, col: c });
    }
    const result = executeDig(stateOf(board, 100), group);
    expect(result.success).toBe(true);
    expect(result.newState.score).toBe(100 + 40); // tomato=5 × 8
  });

  it("returns unchanged state for an invalid dig (group of 4)", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 4; c++) {
      board[0][c] = "pumpkin";
      group.push({ row: 0, col: c });
    }
    const state = stateOf(board, 50);
    const result = executeDig(state, group);

    expect(result.success).toBe(false);
    expect(result.newState).toBe(state);
    expect(result.newState.score).toBe(50);
  });

  it("does not mutate the input board on a successful dig", () => {
    const board = emptyBoard();
    const group = [];
    for (let c = 0; c < 5; c++) {
      board[1][c] = "watermelon";
      group.push({ row: 1, col: c });
    }
    executeDig(stateOf(board, 0), group);
    // original board must still hold the plants
    for (const pos of group) {
      expect(board[pos.row][pos.col]).toBe("watermelon");
    }
  });
});
