import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { GameBoard } from "../GameBoard";
import type { BoardData } from "../GameBoard";

// react-native-reanimated is mocked via __mocks__/react-native-reanimated.js.

/** Create an 8×8 board filled with a mix of plants and empty cells. */
function createMockBoard(): BoardData {
  const types = [
    "watermelon",
    "flower",
    "aubergine",
    "tomato",
    "pumpkin",
  ] as const;
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      // Scatter some plants, leave some empty
      if ((r + c) % 3 === 0) return null;
      return types[(r * 8 + c) % 5];
    }),
  );
}

/** Create a fully empty 8×8 board. */
function createEmptyBoard(): BoardData {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

describe("GameBoard", () => {
  it("renders 64 cells for an 8×8 board", () => {
    const board = createMockBoard();
    const { getAllByRole } = render(<GameBoard board={board} />);
    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(64);
  });

  it("renders empty cells with correct accessibility label", () => {
    const board = createEmptyBoard();
    const { getAllByLabelText } = render(<GameBoard board={board} />);
    const emptyCells = getAllByLabelText("Empty cell");
    expect(emptyCells).toHaveLength(64);
  });

  it("renders plant cells with accessibility labels", () => {
    const board = createMockBoard();
    const { getAllByLabelText } = render(<GameBoard board={board} />);
    // There should be some watermelon cells
    const watermelonCells = getAllByLabelText(/watermelon at cell/i);
    expect(watermelonCells.length).toBeGreaterThan(0);
  });

  it("calls onCellPress with correct row and col", () => {
    const board = createMockBoard();
    const onCellPress = jest.fn();
    const { getAllByRole } = render(
      <GameBoard board={board} onCellPress={onCellPress} />,
    );
    const buttons = getAllByRole("button");
    // Press the cell at row 0, col 1 (second cell)
    fireEvent.press(buttons[1]);
    expect(onCellPress).toHaveBeenCalledWith(0, 1);
  });

  it("applies highlight state to specified cells", () => {
    const board = createMockBoard();
    const highlighted = new Set(["0-0", "0-1", "1-0"]);
    const { getAllByRole } = render(
      <GameBoard board={board} highlightedCells={highlighted} />,
    );
    // Cells render — we just verify no crash with highlights applied
    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(64);
  });

  it("applies selected state to specified cell", () => {
    const board = createMockBoard();
    const { getAllByRole } = render(
      <GameBoard board={board} selectedCell="2-3" />,
    );
    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(64);
  });
});
