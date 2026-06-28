import { describe, it, expect } from "vitest";
import { findConnectedGroup, findAllConnectedGroups } from "./connected-groups";
import { Board, BOARD_SIZE } from "./types";

/** Helper to create an 8×8 board filled with null. */
function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

describe("findConnectedGroup", () => {
  it("returns empty array for an empty cell", () => {
    const board = emptyBoard();
    expect(findConnectedGroup(board, { row: 0, col: 0 })).toEqual([]);
  });

  it("returns a single cell when surrounded by different types", () => {
    const board = emptyBoard();
    board[3][3] = "tomato";
    board[3][2] = "flower";
    board[3][4] = "flower";
    board[2][3] = "flower";
    board[4][3] = "flower";

    const group = findConnectedGroup(board, { row: 3, col: 3 });
    expect(group).toHaveLength(1);
    expect(group[0]).toEqual({ row: 3, col: 3 });
  });

  it("finds a horizontal line of 5 same-type plants", () => {
    const board = emptyBoard();
    for (let col = 0; col < 5; col++) {
      board[0][col] = "watermelon";
    }

    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(5);
  });

  it("finds a vertical line of 5 same-type plants", () => {
    const board = emptyBoard();
    for (let row = 0; row < 5; row++) {
      board[row][0] = "pumpkin";
    }

    const group = findConnectedGroup(board, { row: 2, col: 0 });
    expect(group).toHaveLength(5);
  });

  it("does not include diagonally adjacent same-type cells", () => {
    const board = emptyBoard();
    board[0][0] = "tomato";
    board[1][1] = "tomato"; // diagonal only

    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(1);
  });

  it("finds an L-shaped group", () => {
    const board = emptyBoard();
    // Vertical part
    board[0][0] = "aubergine";
    board[1][0] = "aubergine";
    board[2][0] = "aubergine";
    // Horizontal part
    board[2][1] = "aubergine";
    board[2][2] = "aubergine";

    const group = findConnectedGroup(board, { row: 0, col: 0 });
    expect(group).toHaveLength(5);
  });
});

describe("findAllConnectedGroups", () => {
  it("returns no groups for an empty board", () => {
    const board = emptyBoard();
    const groups = findAllConnectedGroups(board);
    expect(groups).toHaveLength(0);
  });

  it("returns one group when entire board is the same type", () => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill("flower")
    );
    const groups = findAllConnectedGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(BOARD_SIZE * BOARD_SIZE);
  });

  it("correctly separates groups of different types", () => {
    const board = emptyBoard();
    // Two separate groups
    board[0][0] = "tomato";
    board[0][1] = "tomato";

    board[2][2] = "flower";
    board[2][3] = "flower";

    const groups = findAllConnectedGroups(board);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.length === 2 && g.some((p) => p.row === 0 && p.col === 0))).toBeDefined();
    expect(groups.find((g) => g.length === 2 && g.some((p) => p.row === 2 && p.col === 2))).toBeDefined();
  });

  it("identifies that no groups of 5+ exist on a checkerboard", () => {
    const board: Board = Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_, col) =>
        (row + col) % 2 === 0 ? "tomato" : "flower"
      )
    );
    const groups = findAllConnectedGroups(board);
    // On a checkerboard, each cell is its own group of size 1
    for (const group of groups) {
      expect(group.length).toBe(1);
    }
  });
});
