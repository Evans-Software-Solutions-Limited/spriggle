import {
  Board,
  GameState,
  BOARD_SIZE,
  PLANT_TYPES,
  PlantType,
} from "./types";

/** Number of plants spawned on the board at game start. */
export const INITIAL_SPAWN_COUNT = 10;

/**
 * Returns a random plant type.
 */
function randomPlant(): PlantType {
  return PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)];
}

/**
 * Creates an empty 8×8 board (all cells null).
 */
function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board.push(new Array(BOARD_SIZE).fill(null));
  }
  return board;
}

/**
 * Returns all empty cell positions on the board.
 */
export function getEmptyCells(board: Board): { row: number; col: number }[] {
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

/**
 * Spawns a given number of random plants into empty cells on the board.
 * Mutates and returns the board. If fewer empty cells exist than count,
 * fills all available cells.
 */
export function spawnPlants(board: Board, count: number): Board {
  const emptyCells = getEmptyCells(board);
  const toSpawn = Math.min(count, emptyCells.length);

  for (let i = 0; i < toSpawn; i++) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const cell = emptyCells[randomIndex];
    board[cell.row][cell.col] = randomPlant();
    // Remove used cell from available list
    emptyCells.splice(randomIndex, 1);
  }

  return board;
}

/**
 * Initializes a new game state.
 * Creates an empty 8×8 board and spawns 10 random plants into it.
 */
export function initializeBoard(): GameState {
  const board = createEmptyBoard();
  spawnPlants(board, INITIAL_SPAWN_COUNT);

  return {
    board,
    score: 0,
    turns: 0,
    isGameOver: false,
  };
}
