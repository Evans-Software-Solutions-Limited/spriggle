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
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
  it("starts in dig mode with no selections", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup),
    );
    expect(result.current.tool).toBe("dig");
    expect(result.current.highlightedCells.size).toBe(0);
    expect(result.current.selectedCell).toBeNull();
  });

  it("highlights a valid dig group on first tap", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup),
    );
    act(() => result.current.handleCellPress(0, 0));
    expect(result.current.highlightedCells.size).toBe(5);
    expect(result.current.highlightedCells.has("0-0")).toBe(true);
    expect(result.current.highlightedCells.has("0-4")).toBe(true);
  });

  it("calls onDig on second tap of highlighted group", () => {
    const board = boardWithGroup();
    const onDig = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onDig }),
    );
    act(() => result.current.handleCellPress(0, 2)); // highlight
    act(() => result.current.handleCellPress(0, 2)); // confirm
    expect(onDig).toHaveBeenCalledWith(0, 2);
  });

  it("calls onInvalidAction for group < 5", () => {
    const board = boardWithGroup();
    const onInvalidAction = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onInvalidAction }),
    );
    act(() => result.current.handleCellPress(2, 2)); // tomato alone
    expect(onInvalidAction).toHaveBeenCalledWith(2, 2, expect.stringContaining("1"));
  });

  it("ignores taps on empty cells in dig mode", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup),
    );
    act(() => result.current.handleCellPress(4, 4)); // empty
    expect(result.current.highlightedCells.size).toBe(0);
  });

  it("switches to swap mode and selects cells", () => {
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

  it("deselects on tapping same cell in swap mode", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup),
    );
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(2, 2));
    expect(result.current.selectedCell).toBe("2-2");
    act(() => result.current.handleCellPress(2, 2));
    expect(result.current.selectedCell).toBeNull();
  });

  it("clears selection when switching tools", () => {
    const board = boardWithGroup();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup),
    );
    act(() => result.current.handleCellPress(0, 0)); // highlight in dig
    expect(result.current.highlightedCells.size).toBe(5);
    act(() => result.current.setTool("swap"));
    expect(result.current.highlightedCells.size).toBe(0);
  });

  it("rejects swap of same-type plants with onInvalidAction", () => {
    const board = boardWithGroup();
    // Place two adjacent watermelons that aren't in the row-0 group
    board[4][0] = "tomato";
    board[4][1] = "tomato";
    const onInvalidAction = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onInvalidAction }),
    );
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(4, 0));
    act(() => result.current.handleCellPress(4, 1));
    expect(onInvalidAction).toHaveBeenCalledWith(4, 1, expect.stringContaining("different"));
  });

  it("rejects swap of non-adjacent cells with onInvalidAction", () => {
    const board = boardWithGroup();
    board[0][7] = "flower";
    const onInvalidAction = jest.fn();
    const { result } = renderHook(() =>
      useGameInteraction(board, findGroup, { onInvalidAction }),
    );
    act(() => result.current.setTool("swap"));
    act(() => result.current.handleCellPress(2, 2)); // tomato at (2,2)
    act(() => result.current.handleCellPress(0, 7)); // flower at (0,7) — not adjacent
    expect(onInvalidAction).toHaveBeenCalledWith(0, 7, expect.stringContaining("next to"));
  });
});
