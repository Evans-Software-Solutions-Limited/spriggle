import { describe, it, expect } from "vitest";
import {
  initializeBoard,
  INITIAL_SPAWN_COUNT,
  getEmptyCells,
  spawnPlants,
} from "./board";
import { BOARD_SIZE, PLANT_TYPES, Board } from "./types";

describe("initializeBoard", () => {
  it("creates an 8×8 board", () => {
    const state = initializeBoard();
    expect(state.board.length).toBe(BOARD_SIZE);
    for (const row of state.board) {
      expect(row.length).toBe(BOARD_SIZE);
    }
  });

  it("spawns exactly 10 plants", () => {
    const state = initializeBoard();
    let occupied = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (state.board[row][col] !== null) occupied++;
      }
    }
    expect(occupied).toBe(INITIAL_SPAWN_COUNT);
  });

  it("all occupied cells contain valid plant types", () => {
    const state = initializeBoard();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = state.board[row][col];
        if (cell !== null) {
          expect(PLANT_TYPES).toContain(cell);
        }
      }
    }
  });

  it("initializes score to 0, turns to 0, isGameOver to false", () => {
    const state = initializeBoard();
    expect(state.score).toBe(0);
    expect(state.turns).toBe(0);
    expect(state.isGameOver).toBe(false);
  });
});

describe("getEmptyCells", () => {
  it("returns all 64 cells on an empty board", () => {
    const state = initializeBoard();
    // Board has 10 plants, so 54 empty
    const empty = getEmptyCells(state.board);
    expect(empty.length).toBe(BOARD_SIZE * BOARD_SIZE - INITIAL_SPAWN_COUNT);
  });

  it("returns empty array on a fully occupied board", () => {
    const state = initializeBoard();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        state.board[row][col] = "tomato";
      }
    }
    const empty = getEmptyCells(state.board);
    expect(empty.length).toBe(0);
  });
});

describe("spawnPlants", () => {
  it("fills fewer cells when board has limited empty space", () => {
    // Fill most of the board
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array(BOARD_SIZE).fill("watermelon"),
    );
    // Leave only 2 empty cells
    board[0][0] = null;
    board[0][1] = null;

    const result = spawnPlants(board, 6);
    const empty = getEmptyCells(result);
    expect(empty.length).toBe(0); // both filled, not 6
  });

  it("spawnPlants(board, 0) is a no-op", () => {
    const state = initializeBoard();
    const before = JSON.stringify(state.board);
    const result = spawnPlants(state.board, 0);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("does not mutate the input board", () => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () =>
      new Array(BOARD_SIZE).fill(null),
    );
    const before = JSON.stringify(board);
    spawnPlants(board, 5);
    expect(JSON.stringify(board)).toBe(before);
  });
});
