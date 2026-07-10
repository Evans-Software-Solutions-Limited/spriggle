import React from "react";
import { View, StyleSheet } from "react-native";
import { BoardCell } from "./BoardCell";
import { GrassTuft } from "./GrassTuft";
import type { PlantTypeName } from "../plants";
import {
  CELL_GAP,
  PATCH_PADDING,
  SOIL_PADDING,
  cellSizeFor,
} from "./boardLayout";

/** Board data: 8×8 grid where each cell is a PlantTypeName or null. */
export type BoardData = (PlantTypeName | null)[][];

export interface GameBoardProps {
  /** 8×8 board state. board[row][col]. */
  board: BoardData;
  /** Set of "row-col" keys for cells in the highlighted pre-dig group. */
  highlightedCells?: Set<string>;
  /** "row-col" key of the currently selected cell (for swap). */
  selectedCell?: string | null;
  /** Called when a cell is tapped. Receives (row, col). */
  onCellPress?: (row: number, col: number) => void;
  /**
   * The square edge length (in design px) the patch may occupy — the smaller
   * of the board column's width and height. The container (game.tsx) owns this
   * measurement; the board is a pure presenter that fills the space it's given.
   * Defaults to a sensible size for standalone rendering / tests.
   */
  availableSize?: number;
}

const GAP = CELL_GAP;
const DEFAULT_AVAILABLE_SIZE = 600;

/**
 * Game board grid presenter — renders the soil-patch with 8×8 grid of cells.
 * Matches the prototype's .patch > .soil > .grid structure.
 *
 * Sizing is driven entirely by `availableSize` (the square space the container
 * allots), so the board can never be wider than its column — the previous bug,
 * where the cell size was derived from the full window height while the board
 * lived in a 60%-width column, clipped the board on every iPad except the Mini.
 */
export function GameBoard({
  board,
  highlightedCells,
  selectedCell,
  onCellPress,
  availableSize = DEFAULT_AVAILABLE_SIZE,
}: GameBoardProps) {
  const cellSize = cellSizeFor(availableSize);

  return (
    <View style={styles.patch}>
      {/* Grass tufts overlapping edges */}
      <View style={[styles.tuftPos1]}>
        <GrassTuft scale={0.95} />
      </View>
      <View style={[styles.tuftPos2]}>
        <GrassTuft scale={1.15} />
      </View>
      <View style={[styles.tuftPos3]}>
        <GrassTuft scale={0.9} flip />
      </View>
      <View style={[styles.tuftPos4]}>
        <GrassTuft scale={0.82} flip />
      </View>
      <View style={[styles.tuftPos5]}>
        <GrassTuft scale={1.0} />
      </View>

      {/* Soil area */}
      <View style={styles.soil}>
        {/* Grid */}
        <View style={styles.grid}>
          {board.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((cell, c) => {
                const key = `${r}-${c}`;
                return (
                  <BoardCell
                    key={key}
                    plant={cell}
                    highlighted={highlightedCells?.has(key) ?? false}
                    selected={selectedCell === key}
                    onPress={() => onCellPress?.(r, c)}
                    size={cellSize}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  patch: {
    position: "relative",
    borderRadius: 30,
    padding: PATCH_PADDING,
    // Grass gradient background
    backgroundColor: "#6aa64b",
    // Card shadow matching prototype
    shadowColor: "rgba(40,30,12,1)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
  },
  soil: {
    borderRadius: 22,
    padding: SOIL_PADDING,
    backgroundColor: "#4e3623",
    // Inset shadow approximation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  grid: {
    gap: GAP, // vertical spacing between rows
  },
  row: {
    flexDirection: "row",
    gap: GAP, // horizontal spacing between cells (single gap mechanism)
  },
  // Tuft positions matching prototype
  tuftPos1: { position: "absolute", top: -14, left: "6%" },
  tuftPos2: { position: "absolute", top: -18, left: "34%" },
  tuftPos3: { position: "absolute", top: -13, right: "10%" },
  tuftPos4: { position: "absolute", bottom: -12, left: "14%" },
  tuftPos5: { position: "absolute", bottom: -15, right: "20%" },
});
