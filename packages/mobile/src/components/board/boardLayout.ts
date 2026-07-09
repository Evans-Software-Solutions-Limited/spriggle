/**
 * Pure board layout maths — no React / React Native imports, so it can be unit
 * tested without the native (reanimated/worklets) render stack.
 */

export const BOARD_SIZE = 8;
export const CELL_GAP = 6;
export const PATCH_PADDING = 18;
export const SOIL_PADDING = 14;

/** Chrome around the 8×8 grid: patch padding + soil padding + inter-cell gaps. */
export const BOARD_CHROME =
  PATCH_PADDING * 2 + SOIL_PADDING * 2 + CELL_GAP * (BOARD_SIZE - 1);

/** Minimum cell edge (design px) before the board is considered too cramped. */
export const MIN_CELL_SIZE = 32;

/**
 * Cell edge length for a given square board area. `floor` guarantees the full
 * board footprint (`cellSizeFor(a) * BOARD_SIZE + BOARD_CHROME`) never exceeds
 * `a`, so the board can't overflow the space its container gives it.
 */
export function cellSizeFor(availableSize: number): number {
  return Math.max(
    MIN_CELL_SIZE,
    Math.floor((availableSize - BOARD_CHROME) / BOARD_SIZE),
  );
}
