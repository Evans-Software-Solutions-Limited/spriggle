import { Position, BOARD_SIZE } from "./types";

/** Orthogonal direction offsets (up, down, left, right). */
export const DIRECTIONS: readonly Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Returns true if the position is within board bounds. */
export function isInBounds(pos: Position): boolean {
  return (
    pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE
  );
}

/** Converts a position to a unique string key for set lookups. */
export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}
