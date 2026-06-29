import { Board, Position, PLANT_TYPES, PlantType } from "./types";
import { getEmptyCells } from "./board";

/**
 * Returns a random plant type.
 */
function randomPlant(): PlantType {
  return PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)];
}

/**
 * Refills the board by placing `count` random plants into empty cells.
 * If fewer empty cells exist than `count`, fills all available empty cells.
 * Does NOT mutate the input board — returns a new board.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function refillBoard(
  board: Board,
  count: number,
): { board: Board; filledPositions: Position[] } {
  const newBoard = board.map((row) => [...row]);
  const emptyCells = getEmptyCells(newBoard);
  const toFill = Math.min(count, emptyCells.length);
  const filledPositions: Position[] = [];

  for (let i = 0; i < toFill; i++) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const cell = emptyCells[randomIndex];
    newBoard[cell.row][cell.col] = randomPlant();
    filledPositions.push({ row: cell.row, col: cell.col });
    emptyCells.splice(randomIndex, 1);
  }

  return { board: newBoard, filledPositions };
}
