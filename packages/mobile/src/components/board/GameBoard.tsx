import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { BoardCell } from "./BoardCell";
import { GrassTuft } from "./GrassTuft";
import type { PlantTypeName } from "../plants";

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
}

const BOARD_SIZE = 8;
const GAP = 6;

/**
 * Game board grid presenter — renders the soil-patch with 8×8 grid of cells.
 * Matches the prototype's .patch > .soil > .grid structure.
 *
 * Responsive: calculates cell size from the constraining dimension.
 * - Landscape iPad (primary): uses height as constraint (~88% of viewport)
 * - Portrait / smaller screens: uses width as constraint (~92% of viewport)
 * Works across iPad Mini (1024×768) through iPad Pro 12.9" (2732×2048).
 */
export function GameBoard({
  board,
  highlightedCells,
  selectedCell,
  onCellPress,
}: GameBoardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  // Calculate cell size from the constraining dimension
  // Account for patch padding (18*2), soil padding (14*2), gaps between cells
  const patchPadding = 18 * 2;
  const soilPadding = 14 * 2;
  const totalGaps = GAP * (BOARD_SIZE - 1);

  // In landscape, height constrains. In portrait, width constrains.
  const constrainingDimension = isLandscape
    ? windowHeight * 0.88
    : windowWidth * 0.92;

  const availableForCells =
    constrainingDimension - patchPadding - soilPadding - totalGaps;
  const cellSize = Math.max(32, Math.floor(availableForCells / BOARD_SIZE));

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
                  <View key={key} style={{ marginRight: c < 7 ? GAP : 0 }}>
                    <BoardCell
                      plant={cell}
                      highlighted={highlightedCells?.has(key) ?? false}
                      selected={selectedCell === key}
                      onPress={() => onCellPress?.(r, c)}
                      size={cellSize}
                    />
                  </View>
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
    padding: 18,
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
    padding: 14,
    backgroundColor: "#4e3623",
    // Inset shadow approximation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: "row",
  },
  // Tuft positions matching prototype
  tuftPos1: { position: "absolute", top: -14, left: "6%" },
  tuftPos2: { position: "absolute", top: -18, left: "34%" },
  tuftPos3: { position: "absolute", top: -13, right: "10%" },
  tuftPos4: { position: "absolute", bottom: -12, left: "14%" },
  tuftPos5: { position: "absolute", bottom: -15, right: "20%" },
});
