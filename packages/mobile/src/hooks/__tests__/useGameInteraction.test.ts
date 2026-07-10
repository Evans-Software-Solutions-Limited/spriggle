import { renderHook, act } from "@testing-library/react-native";
import { useGameInteraction } from "../useGameInteraction";
import type { PlantTypeName } from "../../components/plants";

type Board = (PlantTypeName | null)[][];

/** Create a board with a known 5-cell watermelon group at (0,0)-(0,4). */
function boardWithGroup(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  for (let c = 0; c < 5; c++) board[0][c] = "watermelon";
  board[2][2] = "tomato";
  board[2][3] = "flower";
  return board;
}

/** Simple findConnectedGroup that finds same-type orthogonal groups. */
function findGroup(
  board: Board,
  row: number,
  col: number,
): { row: number; col: number }[] {
  const type = board[row]?.[col];
  if (!type) return [];
  const seen = new Set<string>();
  const stack = [{ row, col }];
  const result: { row: number; col: number }[] = [];
  while (stack.length) {
    const p = stack.pop()!;
    const key = `${p.row}-${p.col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (board[p.row]?.[p.col] !== type) continue;
    result.push(p);
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = p.row + dr;
      const nc = p.col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        stack.push({ row: nr, col: nc });
      }
    }
  }
  return result;
}

describe("useGameInteraction", () => {
  it("starts in dig mode with no swap selection", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() => useGameInteraction(board, findGroup));
    expect(result.current.tool).toBe("dig");
    expect(result.current.selectedCell).toBeNull();
  });

  it("digs a valid group on a SINGLE tap (no confirm step)", () => {
    const board = boardWithGroup();
    const onDig = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onDig }),
    );
    act(() => result.current.handleCellPress(0, 2));
    expect(onDig).toHaveBeenCalledTimes(1);
    expect(onDig).toHaveBeenCalledWith(0, 2);
  });

  it("calls onInvalidAction for a group < 5", () => {
    const board = boardWithGroup();
    const onInvalidAction = jest.fn();
    const onDig = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onInvalidAction, onDig }),
    );
    act(() => result.current.handleCellPress(2, 2)); // tomato alone
    expect(onInvalidAction).toHaveBeenCalledWith(
      2,
      2,
      expect.stringContaining("1"),
    );
    expect(onDig).not.toHaveBeenCalled();
  });

  it("ignores taps on empty cells in dig mode", () => {
    const board = boardWithGroup();
    const onDig = jest.fn();
    const onInvalidAction = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onDig, onInvalidAction }),
    );
    act(() => result.current.handleCellPress(4, 4)); // empty
    expect(onDig).not.toHaveBeenCalled();
    expect(onInvalidAction).not.toHaveBeenCalled();
  });

  it("switches to swap mode and swaps two selected cells", () => {
    const board = boardWithGroup();
    const onSwap = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onSwap }),
    );
    act(() => result.current.setTool("swap"));
    expect(result.current.tool).toBe("swap");

    act(() => result.current.handleCellPress(2, 2)); // select tomato
    expect(result.current.selectedCell).toBe("2-2");

    act(() => result.current.handleCellPress(2, 3)); // select flower
    expect(onSwap).toHaveBeenCalledWith(2, 2, 2, 3);
    expect(result.current.selectedCell).toBeNull();
  });

  it("deselects on tapping the same cell in swap mode", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() => useGameInteraction(board, findGroup));
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(2, 2));
    expect(result.current.selectedCell).toBe("2-2");
    act(() => result.current.handleCellPress(2, 2));
    expect(result.current.selectedCell).toBeNull();
  });

  it("clears the swap selection when switching tools", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() => useGameInteraction(board, findGroup));
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(2, 2));
    expect(result.current.selectedCell).toBe("2-2");
    act(() => result.current.setTool("dig"));
    expect(result.current.selectedCell).toBeNull();
  });

  it("rejects a swap of same-type plants with onInvalidAction", () => {
    const board = boardWithGroup();
    board[4][0] = "tomato";
    board[4][1] = "tomato";
    const onInvalidAction = jest.fn();
    const onSwap = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onInvalidAction, onSwap }),
    );
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(4, 0));
    act(() => result.current.handleCellPress(4, 1));
    expect(onInvalidAction).toHaveBeenCalledWith(
      4,
      1,
      expect.stringContaining("different"),
    );
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("ALLOWS swapping non-adjacent different-type cells (no adjacency rule)", () => {
    const board = boardWithGroup();
    board[0][7] = "flower";
    const onSwap = jest.fn();
    const onInvalidAction = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onSwap, onInvalidAction }),
    );
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(2, 2)); // tomato at (2,2)
    act(() => result.current.handleCellPress(0, 7)); // flower at (0,7) — far away
    expect(onSwap).toHaveBeenCalledWith(2, 2, 0, 7);
    expect(onInvalidAction).not.toHaveBeenCalled();
  });
});
