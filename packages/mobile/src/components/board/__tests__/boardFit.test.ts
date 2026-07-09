import {
  cellSizeFor,
  BOARD_CHROME,
  MIN_CELL_SIZE,
  BOARD_SIZE,
} from "../boardLayout";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "../../layout/DesignFrame";

/**
 * Regression guard for the iPad-fit bug (remediation M2).
 *
 * The board previously derived its cell size from the full window HEIGHT while
 * living in a ~60%-width column, so on every iPad except the Mini the board was
 * wider than its column and clipped / shoved the rail off-screen. All layout is
 * now authored on the fixed DESIGN_WIDTH×DESIGN_HEIGHT canvas (DesignFrame
 * scales the whole thing to the device), so these are constant checks: if
 * someone reintroduces height-based or window-relative sizing, they break.
 */

// Must mirror game.tsx's COLUMN_GAP / BOARD_COL_FLEX.
const COLUMN_GAP = 26;
const BOARD_COL_FLEX = 0.6;

function boardFootprint(availableSize: number): number {
  return cellSizeFor(availableSize) * BOARD_SIZE + BOARD_CHROME;
}

describe("board fit (M2)", () => {
  const boardColWidth = (DESIGN_WIDTH - COLUMN_GAP) * BOARD_COL_FLEX;
  const availableSize = Math.min(boardColWidth, DESIGN_HEIGHT);

  it("never renders a board wider than its column", () => {
    expect(availableSize).toBeLessThanOrEqual(boardColWidth);
    expect(boardFootprint(availableSize)).toBeLessThanOrEqual(boardColWidth);
  });

  // Above the min-cell clamp threshold (all realistic board areas), the board
  // footprint always fits the space it's given. Real areas are ~700px, far
  // above the clamp floor.
  const clampFloor = MIN_CELL_SIZE * BOARD_SIZE + BOARD_CHROME;

  it("keeps the board footprint within the space it is given, for realistic sizes", () => {
    for (const size of [480, 600, availableSize, 834, 1000]) {
      expect(size).toBeGreaterThanOrEqual(clampFloor);
      expect(boardFootprint(size)).toBeLessThanOrEqual(size);
    }
  });

  it("clamps to a minimum playable cell size when the space is tiny", () => {
    // Below the clamp floor the cell can't shrink further; footprint holds at
    // the floor rather than following `size` down. No real iPad hits this.
    expect(cellSizeFor(0)).toBe(MIN_CELL_SIZE);
    expect(cellSizeFor(BOARD_CHROME)).toBe(MIN_CELL_SIZE);
    expect(boardFootprint(300)).toBe(clampFloor);
  });

  it("produces a comfortably large cell on the design canvas", () => {
    // Sanity: the 8×8 board should use a chunky cell, not the min clamp.
    expect(cellSizeFor(availableSize)).toBeGreaterThan(60);
  });
});
