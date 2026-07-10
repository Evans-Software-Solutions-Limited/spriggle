import { useState, useCallback } from "react";
import type { PlantTypeName } from "../components/plants";

/** Tool mode the player is currently using. */
export type ToolMode = "dig" | "swap";

/** Callback signatures for game actions. */
export interface GameActionCallbacks {
  /** Called when a dig is attempted at (row, col). */
  onDig?: (row: number, col: number) => void;
  /** Called when a swap is attempted between two cells. */
  onSwap?: (row1: number, col1: number, row2: number, col2: number) => void;
  /** Called when an invalid action is attempted (for visual feedback). */
  onInvalidAction?: (row: number, col: number, reason: string) => void;
}

export interface GameInteractionState {
  /** Currently active tool. */
  tool: ToolMode;
  /** "row-col" of the first swap selection, or null. */
  selectedCell: string | null;
  /** Switch the active tool. */
  setTool: (tool: ToolMode) => void;
  /** Handle a cell press — a single-tap dig, or a two-tap swap selection. */
  handleCellPress: (row: number, col: number) => void;
  /** Clear the swap selection. */
  clearSelection: () => void;
}

const MIN_DIG_GROUP_SIZE = 5;

/**
 * Hook managing dig/swap interaction state, faithful to the legacy
 * GardenerGame / prototype:
 *
 * - Dig mode: a SINGLE tap digs the maximal connected group under the tapped
 *   cell if it's ≥ 5 same-type plants; otherwise it's an invalid action. There
 *   is no tap-to-highlight-then-confirm step.
 * - Swap mode: first tap selects a cell, second tap swaps with ANY other
 *   non-empty cell of a DIFFERENT type — there is NO adjacency requirement
 *   (legacy `swapPlants` rejects only empty/same-type).
 */
export function useGameInteraction(
  board: (PlantTypeName | null)[][],
  findConnectedGroup: (
    board: (PlantTypeName | null)[][],
    row: number,
    col: number,
  ) => { row: number; col: number }[],
  callbacks: GameActionCallbacks = {},
): GameInteractionState {
  const [tool, setToolState] = useState<ToolMode>("dig");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedCell(null);
  }, []);

  const setTool = useCallback((newTool: ToolMode) => {
    setToolState(newTool);
    setSelectedCell(null);
  }, []);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;
      const cell = board[row]?.[col];

      if (tool === "dig") {
        // Tapping an empty cell does nothing.
        if (cell === null || cell === undefined) return;

        // Single tap digs the maximal same-type group if large enough.
        const group = findConnectedGroup(board, row, col);
        if (group.length < MIN_DIG_GROUP_SIZE) {
          callbacks.onInvalidAction?.(
            row,
            col,
            `Need 5+ — that patch has ${group.length}`,
          );
          return;
        }
        callbacks.onDig?.(row, col);
        return;
      }

      // Swap mode.
      if (cell === null || cell === undefined) return;

      // First selection.
      if (selectedCell === null) {
        setSelectedCell(key);
        return;
      }

      // Tapping the same cell deselects.
      if (selectedCell === key) {
        setSelectedCell(null);
        return;
      }

      const [r1, c1] = selectedCell.split("-").map(Number);
      const cellA = board[r1]?.[c1];

      // Same-type rejection (legacy: "Cannot swap the same type of plant").
      if (cellA === cell) {
        callbacks.onInvalidAction?.(row, col, "Pick two different plants");
        setSelectedCell(null);
        return;
      }

      // No adjacency check — any two different-type plants can be swapped.
      callbacks.onSwap?.(r1, c1, row, col);
      setSelectedCell(null);
    },
    [tool, board, selectedCell, findConnectedGroup, callbacks],
  );

  return {
    tool,
    selectedCell,
    setTool,
    handleCellPress,
    clearSelection,
  };
}
