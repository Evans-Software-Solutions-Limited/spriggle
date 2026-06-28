/**
 * Core game types for the Spriggle engine.
 * These are framework-agnostic — no React Native or UI dependencies.
 */

export type PlantType =
  | "watermelon"
  | "flower"
  | "aubergine"
  | "tomato"
  | "pumpkin";

export const PLANT_TYPES: PlantType[] = [
  "watermelon",
  "flower",
  "aubergine",
  "tomato",
  "pumpkin",
];

/** A cell is either occupied by a plant or empty (null). */
export type Cell = PlantType | null;

/** 8×8 grid. board[row][col]. */
export type Board = Cell[][];

export const BOARD_SIZE = 8;

/** Zero-indexed position on the board. */
export interface Position {
  row: number;
  col: number;
}

/** Points awarded per plant dug (flat rate, kept for backward compatibility). */
export const POINTS_PER_PLANT = 10;

/**
 * Points awarded per plant type when dug.
 * Matches the legacy GardenerGame scoring system.
 */
export const POINTS_PER_PLANT_TYPE: Record<PlantType, number> = {
  watermelon: 3,
  flower: 6,
  aubergine: 4,
  tomato: 5,
  pumpkin: 2,
};

/** Number of plants refilled after a dig action. */
export const REFILL_AFTER_DIG = 3;

/** Number of plants refilled after a swap action. */
export const REFILL_AFTER_SWAP = 6;

/** Minimum connected group size required for a valid dig. */
export const MIN_DIG_GROUP_SIZE = 5;

export interface GameState {
  board: Board;
  score: number;
  turns: number;
  isGameOver: boolean;
}

export interface DigResult {
  success: boolean;
  newState: GameState;
  removedPositions: Position[];
  refillPositions: Position[];
}

export interface SwapResult {
  success: boolean;
  newState: GameState;
  refillPositions: Position[];
}
