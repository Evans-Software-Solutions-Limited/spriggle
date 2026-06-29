import { describe, it, expect } from "vitest";
import { refillBoard } from "./refill";
import { Board, BOARD_SIZE, PLANT_TYPES } from "./types";

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array(BOARD_SIZE).fill(null),
  ) as Board;
}

describe("refillBoard", () => {
  it("places exactly count plants when many empty cells are available", () => {
    const board = emptyBoard();
    const { board: refilled, filledPositions } = refillBoard(board, 6);

    expect(filledPositions).toHaveLength(6);
    for (const pos of filledPositions) {
      expect(PLANT_TYPES).toContain(refilled[pos.row][pos.col]);
    }
  });

  it("places exactly N plants when exactly N empty cells exist", () => {
    // Fill the board completely except for 3 cells
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array(BOARD_SIZE).fill("tomato"),
    );
    board[0][0] = null;
    board[0][1] = null;
    board[0][2] = null;

    const { board: refilled, filledPositions } = refillBoard(board, 3);

    expect(filledPositions).toHaveLength(3);
    expect(refilled[0][0]).not.toBeNull();
    expect(refilled[0][1]).not.toBeNull();
    expect(refilled[0][2]).not.toBeNull();
  });

  it("fills all available cells when fewer empty cells than count", () => {
    // Only 2 empty cells, requesting 6
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array(BOARD_SIZE).fill("flower"),
    );
    board[7][6] = null;
    board[7][7] = null;

    const { board: refilled, filledPositions } = refillBoard(board, 6);

    expect(filledPositions).toHaveLength(2);
    expect(refilled[7][6]).not.toBeNull();
    expect(refilled[7][7]).not.toBeNull();
  });

  it("returns 0 filled positions when the board is completely full", () => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array(BOARD_SIZE).fill("pumpkin"),
    );

    const { board: refilled, filledPositions } = refillBoard(board, 3);

    expect(filledPositions).toHaveLength(0);
    expect(refilled).toEqual(board);
  });

  it("does not mutate the input board", () => {
    const board = emptyBoard();
    board[0][0] = "watermelon";
    refillBoard(board, 5);

    // Original board should still have only one plant
    let count = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== null) count++;
      }
    }
    expect(count).toBe(1);
  });
});
