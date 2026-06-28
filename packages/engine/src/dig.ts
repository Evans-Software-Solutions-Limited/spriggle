import {
  Board,
  GameState,
  Position,
  DigResult,
  PlantType,
  BOARD_SIZE,
  MIN_DIG_GROUP_SIZE,
  POINTS_PER_PLANT_TYPE,
} from "./types";

/** Orthogonal direction offsets (up, down, left, right). */
const DIRECTIONS: readonly Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function isInBounds(pos: Position): boolean {
  return (
    pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE
  );
}

function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

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
 * Validates a dig selection. A valid dig is a set of positions that:
 *  - contains at least MIN_DIG_GROUP_SIZE (5) cells,
 *  - are all in bounds and distinct,
 *  - all hold the same non-empty plant type, and
 *  - form a single orthogonally-connected group.
 */
export function isValidDig(board: Board, positions: Position[]): boolean {
  if (positions.length < MIN_DIG_GROUP_SIZE) return false;

  const first = positions[0];
  if (!isInBounds(first)) return false;

  const plantType = board[first.row][first.col];
  if (plantType === null) return false;

  // All positions must be in bounds, distinct, and the same plant type.
  const selection = new Set<string>();
  for (const pos of positions) {
    if (!isInBounds(pos)) return false;
    if (board[pos.row][pos.col] !== plantType) return false;
    const key = posKey(pos);
    if (selection.has(key)) return false; // duplicate
    selection.add(key);
  }

  // The selection must form a single connected component (orthogonal),
  // checked by BFS restricted to the selected cells.
  const visited = new Set<string>();
  const queue: Position[] = [first];
  visited.add(posKey(first));

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dir of DIRECTIONS) {
      const neighbor: Position = {
        row: current.row + dir.row,
        col: current.col + dir.col,
      };
      const key = posKey(neighbor);
      if (selection.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === selection.size;
}

/**
 * Executes a dig on the given positions.
 *
 * On a valid dig: removes every selected plant (sets the cells to null),
 * adds the dig score to the player's score, and increments the turn count.
 * On an invalid dig: returns the state unchanged with success: false.
 *
 * NOTE: Refill (3 new plants) and game-over detection are wired into the
 * dig flow in later tasks (refill = task 6, game-over = task 7), so
 * `refillPositions` is empty here.
 */
export function executeDig(state: GameState, positions: Position[]): DigResult {
  if (!isValidDig(state.board, positions)) {
    return {
      success: false,
      newState: state,
      removedPositions: [],
      refillPositions: [],
    };
  }

  const plantType = state.board[positions[0].row][
    positions[0].col
  ] as PlantType;
  const board = cloneBoard(state.board);

  for (const pos of positions) {
    board[pos.row][pos.col] = null;
  }

  const newState: GameState = {
    board,
    score: state.score + calculateDigScore(plantType, positions.length),
    turns: state.turns + 1,
    isGameOver: state.isGameOver,
  };

  return {
    success: true,
    newState,
    removedPositions: [...positions],
    refillPositions: [],
  };
}
