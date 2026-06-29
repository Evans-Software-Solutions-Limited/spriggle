import { Board, MIN_DIG_GROUP_SIZE } from "./types";
import { getEmptyCells } from "./board";
import { findAllConnectedGroups } from "./connected-groups";

/**
 * Determines whether the game is over.
 *
 * Game over occurs when:
 * 1. The board is completely full (no empty cells), AND
 * 2. No connected group of 5 or more same-type plants exists.
 *
 * If the board has at least one empty cell, the game is never over
 * (players can still act via swaps to trigger refills that create groups).
 *
 * Requirements: 5.1, 5.3, 5.4
 */
export function isGameOver(board: Board): boolean {
  // If any empty cell exists, the game is not over
  if (getEmptyCells(board).length > 0) return false;

  // Board is full — check if any group of MIN_DIG_GROUP_SIZE+ exists
  const groups = findAllConnectedGroups(board);
  for (const group of groups) {
    if (group.length >= MIN_DIG_GROUP_SIZE) {
      return false;
    }
  }

  return true;
}
