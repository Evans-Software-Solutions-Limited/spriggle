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
  /** Set of "row-col" keys currently highlighted (pre-dig preview). */
  highlightedCells: Set<string>;
  /** "row-col" of the first swap selection, or null. */
  selectedCell: string | null;
  /** Switch the active tool. */
  setTool: (tool: ToolMode) => void;
  /** Handle a cell press — routes to dig preview/confirm or swap selection. */
  handleCellPress: (row: number, col: number) => void;
  /** Clear all highlights and selections. */
  clearSelection: () => void;
}

/**
 * Hook managing dig/swap interaction state.
 * This is the "container logic" for touch interactions on the board.
 *
 * - Dig mode: first tap highlights the connected group (caller provides findGroup),
 *   second tap on same group confirms the dig.
 * - Swap mode: first tap selects a cell, second tap on a different cell does the swap.
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
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  // Track which cell initiated the current highlight
  const [highlightOrigin, setHighlightOrigin] = useState<string | null>(null);

  const clearSelection = useCallback(() => {
    setHighlightedCells(new Set());
    setSelectedCell(null);
    setHighlightOrigin(null);
  }, []);

  const setTool = useCallback(
    (newTool: ToolMode) => {
      setToolState(newTool);
      clearSelection();
    },
    [clearSelection],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;
      const cell = board[row]?.[col];

      if (tool === "dig") {
        // Dig mode: tap empty cell = ignore
        if (cell === null) return;

        // If this cell is in the current highlight, confirm the dig
        if (highlightedCells.has(key) && highlightOrigin !== null) {
          callbacks.onDig?.(row, col);
          clearSelection();
          return;
        }

        // Otherwise, find the connected group and highlight it
        const group = findConnectedGroup(board, row, col);
        if (group.length < 5) {
          callbacks.onInvalidAction?.(
            row,
            col,
            `Need 5+ — that patch has ${group.length}`,
          );
          clearSelection();
          return;
        }

        // Highlight the group
        const newHighlight = new Set(group.map((p) => `${p.row}-${p.col}`));
        setHighlightedCells(newHighlight);
        setHighlightOrigin(key);
      } else {
        // Swap mode: tap empty cell = ignore
        if (cell === null) return;

        // First selection
        if (selectedCell === null) {
          setSelectedCell(key);
          return;
        }

        // Tap same cell = deselect
        if (selectedCell === key) {
          setSelectedCell(null);
          return;
        }

        // Second selection — validate and attempt swap
        const [r1, c1] = selectedCell.split("-").map(Number);
        const cellA = board[r1]?.[c1];

        // Same type rejection (matching prototype's doSwap behaviour)
        if (cellA === cell) {
          callbacks.onInvalidAction?.(row, col, "Pick two different plants");
          setSelectedCell(null);
          return;
        }

        // Adjacency check (orthogonal only)
        const isAdjacent =
          (Math.abs(r1 - row) === 1 && c1 === col) ||
          (Math.abs(c1 - col) === 1 && r1 === row);
        if (!isAdjacent) {
          callbacks.onInvalidAction?.(
            row,
            col,
            "Plants must be next to each other",
          );
          setSelectedCell(null);
          return;
        }

        callbacks.onSwap?.(r1, c1, row, col);
        setSelectedCell(null);
      }
    },
    [
      tool,
      board,
      highlightedCells,
      highlightOrigin,
      selectedCell,
      findConnectedGroup,
      callbacks,
      clearSelection,
    ],
  );

  return {
    tool,
    highlightedCells,
    selectedCell,
    setTool,
    handleCellPress,
    clearSelection,
  };
}
