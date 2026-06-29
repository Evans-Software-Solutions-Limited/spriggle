import {
  GameState,
  Board,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
  PlantType,
} from "./types";

/**
 * Serializes a GameState to a JSON string for device storage.
 */
export function serializeState(state: GameState): string {
  return JSON.stringify({
    board: state.board,
    score: state.score,
    turns: state.turns,
    isGameOver: state.isGameOver,
  });
}

/**
 * Validates that a value is a valid Cell (null or a valid PlantType).
 */
function isValidCell(value: unknown): value is Cell {
  return value === null || PLANT_TYPES.includes(value as PlantType);
}

/**
 * Validates that a value is a valid 8×8 Board.
 */
function isValidBoard(value: unknown): value is Board {
  if (!Array.isArray(value) || value.length !== BOARD_SIZE) return false;
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return false;
    for (const cell of row) {
      if (!isValidCell(cell)) return false;
    }
  }
  return true;
}

/**
 * Deserializes a JSON string back into a GameState.
 * Returns null if the JSON is invalid or the data doesn't conform to the expected structure.
 */
export function deserializeState(json: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  if (!isValidBoard(obj.board)) return null;
  if (
    typeof obj.score !== "number" ||
    obj.score < 0 ||
    !Number.isSafeInteger(obj.score)
  )
    return null;
  if (
    typeof obj.turns !== "number" ||
    obj.turns < 0 ||
    !Number.isSafeInteger(obj.turns)
  )
    return null;
  if (typeof obj.isGameOver !== "boolean") return null;

  return {
    board: obj.board as Board,
    score: obj.score as number,
    turns: obj.turns as number,
    isGameOver: obj.isGameOver as boolean,
  };
}
