import { Board, Position, BOARD_SIZE } from "./types";

/** Orthogonal direction offsets (up, down, left, right). */
const DIRECTIONS: readonly Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/**
 * Returns true if the position is within board bounds.
 */
function isInBounds(pos: Position): boolean {
  return (
    pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE
  );
}

/**
 * Converts a position to a unique string key for set lookups.
 */
function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

/**
 * Finds the connected group containing the given position using BFS.
 * Only considers orthogonal adjacency (up, down, left, right).
 * Returns all positions in the connected group that share the same plant type.
 * Returns an empty array if the cell is empty (null).
 */
export function findConnectedGroup(
  board: Board,
  position: Position,
): Position[] {
  const plantType = board[position.row][position.col];
  if (plantType === null) return [];

  const visited = new Set<string>();
  const group: Position[] = [];
  const queue: Position[] = [position];
  visited.add(posKey(position));

  while (queue.length > 0) {
    const current = queue.shift()!;
    group.push(current);

    for (const dir of DIRECTIONS) {
      const neighbor: Position = {
        row: current.row + dir.row,
        col: current.col + dir.col,
      };

      if (!isInBounds(neighbor)) continue;

      const key = posKey(neighbor);
      if (visited.has(key)) continue;

      if (board[neighbor.row][neighbor.col] === plantType) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return group;
}

/**
 * Finds all connected groups on the board.
 * Each cell belongs to exactly one group.
 * Empty cells are not included in any group.
 * Returns an array of groups, where each group is an array of positions.
 */
export function findAllConnectedGroups(board: Board): Position[][] {
  const visited = new Set<string>();
  const groups: Position[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = posKey({ row, col });
      if (visited.has(key)) continue;
      if (board[row][col] === null) continue;

      const group = findConnectedGroup(board, { row, col });
      for (const pos of group) {
        visited.add(posKey(pos));
      }
      groups.push(group);
    }
  }

  return groups;
}
