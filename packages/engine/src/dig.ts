import {
  Board,
  GameState,
  Position,
  DigResult,
  PlantType,
  MIN_DIG_GROUP_SIZE,
  POINTS_PER_PLANT_TYPE,
} from "./types";
import { findConnectedGroup } from "./connected-groups";
import { isInBounds } from "./grid-utils";

/**
 * Deep-clones a board so dig execution stays pure (no input mutation).
 */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Calculates the score for digging up `plantCount` plants of `plantType`.
 * Mirrors the legacy GardenerGame: score = pointsPerDig(plantType) × count,
 * where pointsPerDig is the per-plant-type value (POINTS_PER_PLANT_TYPE).
 */
export function calculateDigScore(
  plantType: PlantType,
  plantCount: number,
): number {
  return POINTS_PER_PLANT_TYPE[plantType] * plantCount;
}

/**
 * Validates a dig at the given position.
 *
 * Mirrors the legacy GardenerGame: the player taps a single cell, and the
 * engine expands it to the MAXIMAL orthogonally-connected group of the same
 * plant type. A dig is valid when that group has at least
 * MIN_DIG_GROUP_SIZE (5) plants. Digging a partial subset of a group is not
 * possible — the whole connected group is always dug.
 */
export function isValidDig(board: Board, position: Position): boolean {
  if (!isInBounds(position)) return false;
  if (board[position.row][position.col] === null) return false;
  return findConnectedGroup(board, position).length >= MIN_DIG_GROUP_SIZE;
}

/**
 * Executes a dig at the given position.
 *
 * On a valid dig: removes the ENTIRE maximal connected group of same-type
 * plants containing `position` (sets those cells to null), adds the dig
 * score (per-plant-type points × group size) to the player's score, and
 * increments the turn count.
 * On an invalid dig: returns the state unchanged with success: false.
 *
 * NOTE: Refill (3 new plants) and game-over detection are wired into the
 * dig flow in later tasks (refill = task 6, game-over = task 7), so
 * `refillPositions` is empty here.
 */
export function executeDig(state: GameState, position: Position): DigResult {
  if (
    !isInBounds(position) ||
    state.board[position.row][position.col] === null
  ) {
    return {
      success: false,
      newState: state,
      removedPositions: [],
      refillPositions: [],
    };
  }

  const plantType = state.board[position.row][position.col] as PlantType;
  // Compute the maximal connected group once and reuse it for the size
  // check, scoring, and removal (avoids a second BFS via isValidDig).
  const group = findConnectedGroup(state.board, position);

  if (group.length < MIN_DIG_GROUP_SIZE) {
    return {
      success: false,
      newState: state,
      removedPositions: [],
      refillPositions: [],
    };
  }

  const board = cloneBoard(state.board);
  for (const pos of group) {
    board[pos.row][pos.col] = null;
  }

  const newState: GameState = {
    board,
    score: state.score + calculateDigScore(plantType, group.length),
    turns: state.turns + 1,
    isGameOver: state.isGameOver,
  };

  return {
    success: true,
    newState,
    removedPositions: group,
    refillPositions: [],
  };
}
