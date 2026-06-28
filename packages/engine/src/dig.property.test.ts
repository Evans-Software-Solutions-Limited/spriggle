import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidDig, executeDig, calculateDigScore } from "./dig";
import {
  Board,
  GameState,
  Position,
  PlantType,
  Cell,
  BOARD_SIZE,
  PLANT_TYPES,
  POINTS_PER_PLANT_TYPE,
} from "./types";

/** A fully-populated random board. */
const arbFullBoard: fc.Arbitrary<Board> = fc.array(
  fc.array(fc.constantFrom(...PLANT_TYPES) as fc.Arbitrary<Cell>, {
    minLength: BOARD_SIZE,
    maxLength: BOARD_SIZE,
  }),
  { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
);

/**
 * Generates a board containing a known horizontal connected group of
 * `length` same-type plants, plus the exact group positions.
 */
const arbValidDig = fc
  .integer({ min: 5, max: BOARD_SIZE })
  .chain((length) =>
    fc.record({
      length: fc.constant(length),
      row: fc.integer({ min: 0, max: BOARD_SIZE - 1 }),
      startCol: fc.integer({ min: 0, max: BOARD_SIZE - length }),
      plantType: fc.constantFrom(...PLANT_TYPES),
      baseBoard: arbFullBoard,
    }),
  )
  .map(({ length, row, startCol, plantType, baseBoard }) => {
    const board = baseBoard.map((r) => [...r]);
    const group: Position[] = [];
    for (let i = 0; i < length; i++) {
      board[row][startCol + i] = plantType;
      group.push({ row, col: startCol + i });
    }
    return { board, group, plantType, length };
  });

function makeState(board: Board, score = 0): GameState {
  return { board, score, turns: 0, isGameOver: false };
}

describe("Feature: spriggle-ipad-game, Property 3: Valid dig removes exactly the connected group", () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For any board containing a connected group of 5+ same-type plants,
   * executing a dig on that group results in all those positions becoming
   * null AND no other cells being modified.
   */
  it("nulls exactly the dug positions and leaves all other cells unchanged", () => {
    fc.assert(
      fc.property(arbValidDig, ({ board, group }) => {
        const state = makeState(board);
        const result = executeDig(state, group);

        expect(result.success).toBe(true);

        const dug = new Set(group.map((p) => `${p.row},${p.col}`));
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (dug.has(`${row},${col}`)) {
              expect(result.newState.board[row][col]).toBeNull();
            } else {
              expect(result.newState.board[row][col]).toBe(board[row][col]);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 4: Invalid dig leaves board unchanged", () => {
  /**
   * **Validates: Requirements 2.2, 2.5**
   *
   * For any selection that is either (a) fewer than 5 connected same-type
   * plants, or (b) contains mixed plant types, executing a dig fails and the
   * board state remains identical to the pre-action state.
   */
  it("rejects selections with fewer than 5 plants and leaves state unchanged", () => {
    fc.assert(
      fc.property(
        arbValidDig,
        fc.integer({ min: 1, max: 4 }),
        ({ board, group }, takeCount) => {
          const selection = group.slice(0, takeCount);
          const state = makeState(board, 42);

          expect(isValidDig(board, selection)).toBe(false);

          const result = executeDig(state, selection);
          expect(result.success).toBe(false);
          expect(result.newState).toBe(state);
          expect(result.newState.board).toEqual(board);
          expect(result.newState.score).toBe(42);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rejects selections containing mixed plant types and leaves state unchanged", () => {
    fc.assert(
      fc.property(arbValidDig, ({ board, group, plantType }) => {
        // Corrupt one cell in the selection to a different plant type.
        const otherType: PlantType =
          PLANT_TYPES.find((p) => p !== plantType) ?? plantType;
        const corrupted = group[group.length - 1];
        const mixedBoard = board.map((r) => [...r]);
        mixedBoard[corrupted.row][corrupted.col] = otherType;
        const state = makeState(mixedBoard, 7);

        expect(isValidDig(mixedBoard, group)).toBe(false);

        const result = executeDig(state, group);
        expect(result.success).toBe(false);
        expect(result.newState).toBe(state);
        expect(result.newState.board).toEqual(mixedBoard);
        expect(result.newState.score).toBe(7);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Feature: spriggle-ipad-game, Property 5: Dig score formula", () => {
  /**
   * **Validates: Requirements 2.3, 6.1**
   *
   * For any valid dig of N plants of a given type, the score increases by
   * exactly (points_per_plant_for_that_type × N).
   */
  it("increases the score by POINTS_PER_PLANT_TYPE[type] × N", () => {
    fc.assert(
      fc.property(
        arbValidDig,
        fc.nat(),
        ({ board, group, plantType, length }, startScore) => {
          const state = makeState(board, startScore);
          const result = executeDig(state, group);

          const expectedIncrement = POINTS_PER_PLANT_TYPE[plantType] * length;
          expect(result.success).toBe(true);
          expect(result.newState.score).toBe(startScore + expectedIncrement);
          expect(calculateDigScore(plantType, length)).toBe(expectedIncrement);
        },
      ),
      { numRuns: 100 },
    );
  });
});
