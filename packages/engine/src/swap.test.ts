import { describe, it, expect } from "vitest";
import { isValidSwap, executeSwap } from "./swap";
import { Board, GameState, BOARD_SIZE } from "./types";

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array(BOARD_SIZE).fill(null),
  ) as Board;
}

function stateOf(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

describe("isValidSwap", () => {
  it("accepts swapping two adjacent cells with different plant types (right)", () => {
    const board = emptyBoard();
    board[3][3] = "tomato";
    board[3][4] = "flower";
    expect(isValidSwap(board, { row: 3, col: 3 }, { row: 3, col: 4 })).toBe(
      true,
    );
  });

  it("accepts swapping two adjacent cells (left)", () => {
    const board = emptyBoard();
    board[0][1] = "watermelon";
    board[0][0] = "pumpkin";
    expect(isValidSwap(board, { row: 0, col: 1 }, { row: 0, col: 0 })).toBe(
      true,
    );
  });

  it("accepts swapping two adjacent cells (down)", () => {
    const board = emptyBoard();
    board[2][5] = "aubergine";
    board[3][5] = "tomato";
    expect(isValidSwap(board, { row: 2, col: 5 }, { row: 3, col: 5 })).toBe(
      true,
    );
  });

  it("accepts swapping two adjacent cells (up)", () => {
    const board = emptyBoard();
    board[7][0] = "flower";
    board[6][0] = "pumpkin";
    expect(isValidSwap(board, { row: 7, col: 0 }, { row: 6, col: 0 })).toBe(
      true,
    );
  });

  it("accepts a diagonal (non-adjacent) swap of different types", () => {
    // No adjacency requirement (legacy GardenerGame): any two different-type
    // non-empty cells may be swapped.
    const board = emptyBoard();
    board[0][0] = "tomato";
    board[1][1] = "flower";
    expect(isValidSwap(board, { row: 0, col: 0 }, { row: 1, col: 1 })).toBe(
      true,
    );
  });

  it("accepts a far-apart swap of different types", () => {
    const board = emptyBoard();
    board[0][0] = "tomato";
    board[7][7] = "pumpkin";
    expect(isValidSwap(board, { row: 0, col: 0 }, { row: 7, col: 7 })).toBe(
      true,
    );
  });

  it("rejects swap of same plant type", () => {
    const board = emptyBoard();
    board[2][2] = "pumpkin";
    board[2][3] = "pumpkin";
    expect(isValidSwap(board, { row: 2, col: 2 }, { row: 2, col: 3 })).toBe(
      false,
    );
  });

  it("rejects swap involving an empty cell (first empty)", () => {
    const board = emptyBoard();
    board[4][5] = "flower";
    expect(isValidSwap(board, { row: 4, col: 4 }, { row: 4, col: 5 })).toBe(
      false,
    );
  });

  it("rejects swap involving an empty cell (second empty)", () => {
    const board = emptyBoard();
    board[4][4] = "flower";
    expect(isValidSwap(board, { row: 4, col: 4 }, { row: 4, col: 5 })).toBe(
      false,
    );
  });

  it("rejects swap with out-of-bounds position", () => {
    const board = emptyBoard();
    board[0][0] = "tomato";
    expect(isValidSwap(board, { row: 0, col: 0 }, { row: -1, col: 0 })).toBe(
      false,
    );
    expect(
      isValidSwap(board, { row: 0, col: 0 }, { row: 0, col: BOARD_SIZE }),
    ).toBe(false);
  });
});

describe("executeSwap", () => {
  it("exchanges the two plants on a valid swap", () => {
    const board = emptyBoard();
    board[1][1] = "watermelon";
    board[1][2] = "aubergine";
    const result = executeSwap(
      stateOf(board, 10),
      {
        row: 1,
        col: 1,
      },
      { row: 1, col: 2 },
    );

    expect(result.success).toBe(true);
    expect(result.newState.board[1][1]).toBe("aubergine");
    expect(result.newState.board[1][2]).toBe("watermelon");
  });

  it("increments the turn count on success", () => {
    const board = emptyBoard();
    board[0][0] = "tomato";
    board[0][1] = "pumpkin";
    const result = executeSwap(
      stateOf(board, 0),
      {
        row: 0,
        col: 0,
      },
      { row: 0, col: 1 },
    );

    expect(result.success).toBe(true);
    expect(result.newState.turns).toBe(1);
  });

  it("does not modify the score", () => {
    const board = emptyBoard();
    board[5][5] = "flower";
    board[5][6] = "tomato";
    const result = executeSwap(
      stateOf(board, 999),
      {
        row: 5,
        col: 5,
      },
      { row: 5, col: 6 },
    );

    expect(result.success).toBe(true);
    expect(result.newState.score).toBe(999);
  });

  it("returns unchanged state for an invalid swap (empty cell)", () => {
    const board = emptyBoard();
    board[2][2] = "tomato";
    // (3,3) is empty → invalid swap.
    const state = stateOf(board, 50);
    const result = executeSwap(state, { row: 2, col: 2 }, { row: 3, col: 3 });

    expect(result.success).toBe(false);
    expect(result.newState).toBe(state);
  });

  it("does not mutate the input board", () => {
    const board = emptyBoard();
    board[0][0] = "watermelon";
    board[0][1] = "flower";
    executeSwap(stateOf(board, 0), { row: 0, col: 0 }, { row: 0, col: 1 });

    expect(board[0][0]).toBe("watermelon");
    expect(board[0][1]).toBe("flower");
  });

  it("returns 6 refillPositions on a valid swap", () => {
    const board = emptyBoard();
    board[4][4] = "pumpkin";
    board[4][5] = "aubergine";
    const result = executeSwap(
      stateOf(board, 0),
      {
        row: 4,
        col: 4,
      },
      { row: 4, col: 5 },
    );

    expect(result.success).toBe(true);
    expect(result.refillPositions).toHaveLength(6);
  });
});
