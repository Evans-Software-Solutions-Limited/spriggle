import {
  Board,
  GameState,
  Position,
  SwapResult,
  REFILL_AFTER_SWAP,
} from "./types";
import { isInBounds } from "./grid-utils";
import { refillBoard } from "./refill";
import { isRefillStarved } from "./game-over";

/**
 * Deep-clones a board so swap execution stays pure (no input mutation).
 */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Validates a swap between two positions.
 *
 * A swap is valid when:
 * - Both positions are within bounds
 * - Both cells are non-empty (occupied by a plant)
 * - The two cells contain DIFFERENT plant types
 *
 * There is NO adjacency requirement — the legacy GardenerGame (`swapPlants` in
 * `src/hooks/useGameLogic.ts`) rejects only empty cells and same-type; any two
 * different-type plants anywhere on the board may be swapped.
 *
 * Requirements: 3.1, 3.2, 3.3
 */
export function isValidSwap(
  board: Board,
  pos1: Position,
  pos2: Position,
): boolean {
  if (!isInBounds(pos1) || !isInBounds(pos2)) return false;

  // Cannot swap a cell with itself
  if (pos1.row === pos2.row && pos1.col === pos2.col) return false;

  const cell1 = board[pos1.row][pos1.col];
  const cell2 = board[pos2.row][pos2.col];

  // Both must be non-empty
  if (cell1 === null || cell2 === null) return false;

  // Must be different plant types
  return cell1 !== cell2;
}

/**
 * Executes a swap between two positions.
 *
 * On a valid swap: exchanges the plants in the two cells, increments the
 * turn count, leaves the score unchanged, and refills 6 random plants into
 * empty cells.
 * On an invalid swap: returns the state unchanged with success: false.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 6.4
 */
export function executeSwap(
  state: GameState,
  pos1: Position,
  pos2: Position,
): SwapResult {
  if (!isValidSwap(state.board, pos1, pos2)) {
    return {
      success: false,
      newState: state,
      refillPositions: [],
    };
  }

  const board = cloneBoard(state.board);

  // Exchange the two cells
  const temp = board[pos1.row][pos1.col];
  board[pos1.row][pos1.col] = board[pos2.row][pos2.col];
  board[pos2.row][pos2.col] = temp;

  // Refill 6 plants after a successful swap (Requirements 3.4, 4.2)
  const { board: refilledBoard, filledPositions } = refillBoard(
    board,
    REFILL_AFTER_SWAP,
  );

  const newState: GameState = {
    board: refilledBoard,
    score: state.score, // Swap does NOT modify score (Requirement 6.4)
    turns: state.turns + 1,
    // Game over if the 6-plant refill couldn't fully place (fewer than 6 empty
    // cells were available) — the legacy GardenerGame's spawn-starvation rule.
    isGameOver: isRefillStarved(filledPositions.length, REFILL_AFTER_SWAP),
  };

  return {
    success: true,
    newState,
    refillPositions: filledPositions,
  };
}
