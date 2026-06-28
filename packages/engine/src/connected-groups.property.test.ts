import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { findConnectedGroup, findAllConnectedGroups } from "./connected-groups";
import { Board, BOARD_SIZE, PLANT_TYPES, Cell } from "./types";

/**
 * Arbitrary for generating a valid board (8×8 grid with random plants, some nulls).
 */
const arbBoard: fc.Arbitrary<Board> = fc.array(
  fc.array(
    fc.oneof(
      fc.constantFrom(...PLANT_TYPES) as fc.Arbitrary<Cell>,
      fc.constant(null) as fc.Arbitrary<Cell>,
    ),
    { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
  ),
  { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
);

/**
 * Arbitrary for a fully populated board (no null cells).
 */
const arbFullBoard: fc.Arbitrary<Board> = fc.array(
  fc.array(fc.constantFrom(...PLANT_TYPES) as fc.Arbitrary<Cell>, {
    minLength: BOARD_SIZE,
    maxLength: BOARD_SIZE,
  }),
  { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
);

/**
 * Arbitrary for a valid board position.
 */
const arbPosition = fc.record({
  row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
  col: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
});

describe("Feature: spriggle-ipad-game, Property 14: Orthogonal adjacency only", () => {
  /**
   * **Validates: Requirements 15.1, 15.2, 15.3**
   *
   * For any board and any computed connected group, every pair of adjacent
   * cells in that group SHALL be orthogonally adjacent (sharing an edge),
   * and no two cells connected only diagonally SHALL appear in the same group.
   */
  it("every pair of consecutive BFS neighbors in a group must be reachable via orthogonal steps only", () => {
    fc.assert(
      fc.property(arbFullBoard, (board) => {
        const groups = findAllConnectedGroups(board);

        for (const group of groups) {
          // For each cell in the group, verify it has at least one orthogonal
          // neighbor also in the group (unless it's the only cell).
          if (group.length <= 1) continue;

          const posSet = new Set(group.map((p) => `${p.row},${p.col}`));

          for (const pos of group) {
            // Check that this position can reach at least one other group member
            // via orthogonal adjacency
            const hasOrthogonalNeighborInGroup = [
              { row: pos.row - 1, col: pos.col },
              { row: pos.row + 1, col: pos.col },
              { row: pos.row, col: pos.col - 1 },
              { row: pos.row, col: pos.col + 1 },
            ].some((n) => posSet.has(`${n.row},${n.col}`));

            expect(hasOrthogonalNeighborInGroup).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("diagonal-only connections do not form groups", () => {
    fc.assert(
      fc.property(arbBoard, arbPosition, (board, pos) => {
        if (board[pos.row][pos.col] === null) return;

        const group = findConnectedGroup(board, pos);
        const posSet = new Set(group.map((p) => `${p.row},${p.col}`));

        // Check all diagonal neighbors of `pos`
        const diagonals = [
          { row: pos.row - 1, col: pos.col - 1 },
          { row: pos.row - 1, col: pos.col + 1 },
          { row: pos.row + 1, col: pos.col - 1 },
          { row: pos.row + 1, col: pos.col + 1 },
        ];

        for (const diag of diagonals) {
          if (
            diag.row < 0 ||
            diag.row >= BOARD_SIZE ||
            diag.col < 0 ||
            diag.col >= BOARD_SIZE
          )
            continue;

          // If a diagonal has the same plant type but is NOT in the group,
          // it confirms diagonal adjacency doesn't count.
          // If it IS in the group, it must be reachable via orthogonal path.
          if (posSet.has(`${diag.row},${diag.col}`)) {
            // Verify the diagonal cell is reachable orthogonally from pos
            // (it must share an orthogonal neighbor that's also in the group)
            const sharedOrthogonal = [
              { row: pos.row, col: diag.col },
              { row: diag.row, col: pos.col },
            ].some((n) => posSet.has(`${n.row},${n.col}`));
            expect(sharedOrthogonal).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 15: Connected group detection correctness", () => {
  /**
   * **Validates: Requirements 15.1, 15.2, 15.3**
   *
   * For any valid board state, the set of all connected groups returned by
   * findAllConnectedGroups SHALL be exhaustive (every occupied cell belongs
   * to exactly one group) and correct (no group contains cells of different
   * plant types or non-adjacent cells).
   */
  it("every occupied cell belongs to exactly one group", () => {
    fc.assert(
      fc.property(arbBoard, (board) => {
        const groups = findAllConnectedGroups(board);

        // Collect all positions in groups
        const allPositions = new Map<string, number>();
        for (let i = 0; i < groups.length; i++) {
          for (const pos of groups[i]) {
            const key = `${pos.row},${pos.col}`;
            expect(allPositions.has(key)).toBe(false); // no duplicates
            allPositions.set(key, i);
          }
        }

        // Every occupied cell must be in some group
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] !== null) {
              expect(allPositions.has(`${row},${col}`)).toBe(true);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("no group contains cells of different plant types", () => {
    fc.assert(
      fc.property(arbBoard, (board) => {
        const groups = findAllConnectedGroups(board);

        for (const group of groups) {
          if (group.length === 0) continue;
          const type = board[group[0].row][group[0].col];
          for (const pos of group) {
            expect(board[pos.row][pos.col]).toBe(type);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("each group is internally connected via orthogonal adjacency", () => {
    fc.assert(
      fc.property(arbFullBoard, (board) => {
        const groups = findAllConnectedGroups(board);

        for (const group of groups) {
          if (group.length <= 1) continue;

          // BFS from first element should reach all others
          const posSet = new Set(group.map((p) => `${p.row},${p.col}`));
          const visited = new Set<string>();
          const queue = [group[0]];
          visited.add(`${group[0].row},${group[0].col}`);

          while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = [
              { row: current.row - 1, col: current.col },
              { row: current.row + 1, col: current.col },
              { row: current.row, col: current.col - 1 },
              { row: current.row, col: current.col + 1 },
            ];

            for (const n of neighbors) {
              const key = `${n.row},${n.col}`;
              if (posSet.has(key) && !visited.has(key)) {
                visited.add(key);
                queue.push(n);
              }
            }
          }

          expect(visited.size).toBe(group.length);
        }
      }),
      { numRuns: 100 },
    );
  });
});
