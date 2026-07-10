/**
 * Scripted boards + coordinates for the interactive first-run tutorial
 * (`app/onboarding.tsx`), ported from the prototype's `onboarding.js`.
 *
 * Pure data + builders — no React / engine runtime dependency — so the boards
 * can be unit-tested against the engine's real `findConnectedGroup` without the
 * native render stack. The 5×6 prototype mini-board is re-expressed on the real
 * 8×8 grid so the app can drive the actual `GameBoard`/engine (whose bounds and
 * `cellSizeFor` maths assume 8×8) rather than a bespoke tutorial-only board.
 *
 * The filler is a two-type checkerboard: orthogonal neighbours always differ,
 * so every filler cell is a singleton and the ONLY diggable group on each board
 * is the scripted one. That keeps the tutorial deterministic (verified in
 * tutorialData.test.ts) regardless of the seed.
 */
import type { Position } from "@spriggle/engine";
import type { BoardData } from "../components/board";
import type { PlantTypeName } from "../components/plants";

const SIZE = 8;

/** Stable "row-col" key for a position (matches GameBoard's cell keys). */
export const cellKey = (p: Position): string => `${p.row}-${p.col}`;

/**
 * An 8×8 board of two alternating plant types. Because orthogonal neighbours
 * always differ, no two same-type cells touch — every cell is its own group.
 */
function checkerboard(a: PlantTypeName, b: PlantTypeName): BoardData {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => ((r + c) % 2 === 0 ? a : b)),
  );
}

// --- Step 1: DIG --------------------------------------------------------------

/** A plus of tomatoes — exactly five connected cells to dig. */
export const DIG_GROUP: Position[] = [
  { row: 2, col: 2 }, // centre
  { row: 1, col: 2 },
  { row: 3, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 3 },
];

/** Board for beat 1: a diggable 5-group of tomatoes on a checkerboard. */
export function buildDigBoard(): BoardData {
  const board = checkerboard("watermelon", "flower");
  for (const p of DIG_GROUP) board[p.row][p.col] = "tomato";
  return board;
}

// --- Step 2: SWAP -------------------------------------------------------------

/** Four watermelons in a T — one short of a diggable group. */
const WATERMELON_T: Position[] = [
  { row: 2, col: 2 },
  { row: 2, col: 3 },
  { row: 2, col: 4 },
  { row: 1, col: 3 },
];

/**
 * The cell the missing watermelon swaps INTO. It sits directly below the T's
 * stem (adjacent to {2,3}), so once a watermelon lands here the group becomes
 * five. Pre-swap it holds its (non-watermelon) checkerboard type.
 */
export const SWAP_CONNECTOR: Position = { row: 3, col: 3 };

/** The lone watermelon that swaps into the connector. */
const WATERMELON_LONE: Position = { row: 5, col: 5 };

/** The two ringed cells the player swaps in beat 2 (connector first). */
export const SWAP_PAIR: readonly [Position, Position] = [
  SWAP_CONNECTOR,
  WATERMELON_LONE,
];

/**
 * Board for beat 2: a T of four watermelons plus one lone watermelon. Swapping
 * SWAP_PAIR drops the lone watermelon into SWAP_CONNECTOR, forming a 5-group.
 */
export function buildSwapBoard(): BoardData {
  const board = checkerboard("flower", "aubergine");
  for (const p of WATERMELON_T) board[p.row][p.col] = "watermelon";
  board[WATERMELON_LONE.row][WATERMELON_LONE.col] = "watermelon";
  return board;
}

/** Swap two cells' contents, returning a new board (never mutates `board`). */
export function swapCells(
  board: BoardData,
  a: Position,
  b: Position,
): BoardData {
  const next = board.map((row) => row.slice());
  const tmp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = tmp;
  return next;
}
