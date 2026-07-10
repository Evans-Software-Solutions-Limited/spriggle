import {
  findConnectedGroup,
  findAllConnectedGroups,
  type Board,
} from "@spriggle/engine";
import {
  buildDigBoard,
  buildSwapBoard,
  swapCells,
  DIG_GROUP,
  SWAP_PAIR,
  SWAP_CONNECTOR,
  cellKey,
} from "../tutorialData";
import type { BoardData } from "../../components/board";

const asBoard = (b: BoardData) => b as Board;

describe("tutorial dig board (beat 1)", () => {
  const board = buildDigBoard();

  it("has exactly one 5-group — the scripted DIG_GROUP", () => {
    const groups = findAllConnectedGroups(asBoard(board));
    const large = groups.filter((g) => g.length >= 5);
    expect(large).toHaveLength(1);
    expect(large[0]).toHaveLength(5);
  });

  it("connects the full DIG_GROUP from any of its cells", () => {
    for (const cell of DIG_GROUP) {
      const group = findConnectedGroup(asBoard(board), cell);
      expect(new Set(group.map(cellKey))).toEqual(
        new Set(DIG_GROUP.map(cellKey)),
      );
    }
  });

  it("leaves the checkerboard filler as singletons (no accidental groups)", () => {
    const groups = findAllConnectedGroups(asBoard(board));
    const maxSize = Math.max(...groups.map((g) => g.length));
    expect(maxSize).toBe(5);
  });
});

describe("tutorial swap board (beat 2 → 3)", () => {
  const board = buildSwapBoard();

  it("starts with only a 4-group (one short of a dig)", () => {
    const groups = findAllConnectedGroups(asBoard(board));
    const maxSize = Math.max(...groups.map((g) => g.length));
    expect(maxSize).toBe(4);
  });

  it("forms a 5-group at the connector after swapping the ringed pair", () => {
    const swapped = swapCells(board, SWAP_PAIR[0], SWAP_PAIR[1]);
    const group = findConnectedGroup(asBoard(swapped), SWAP_CONNECTOR);
    expect(group).toHaveLength(5);
  });

  it("swap is order-independent (same 5-group either way)", () => {
    const a = swapCells(board, SWAP_PAIR[0], SWAP_PAIR[1]);
    const b = swapCells(board, SWAP_PAIR[1], SWAP_PAIR[0]);
    const ga = findConnectedGroup(asBoard(a), SWAP_CONNECTOR).map(cellKey);
    const gb = findConnectedGroup(asBoard(b), SWAP_CONNECTOR).map(cellKey);
    expect(new Set(ga)).toEqual(new Set(gb));
    expect(ga).toHaveLength(5);
  });
});
