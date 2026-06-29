import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { serializeState, deserializeState } from "./serialization";
import { BOARD_SIZE, PLANT_TYPES, Cell, Board, GameState } from "./types";

/**
 * Arbitrary for generating a valid GameState.
 */
const arbGameState: fc.Arbitrary<GameState> = fc
  .array(
    fc.array(
      fc.oneof(
        fc.constantFrom(...PLANT_TYPES) as fc.Arbitrary<Cell>,
        fc.constant(null) as fc.Arbitrary<Cell>,
      ),
      { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
    ),
    { minLength: BOARD_SIZE, maxLength: BOARD_SIZE },
  )
  .chain((board) =>
    fc.record({
      board: fc.constant(board as Board),
      score: fc.nat(),
      turns: fc.nat(),
      isGameOver: fc.boolean(),
    }),
  );

describe("Feature: spriggle-ipad-game, Property 16: Game state serialization round-trip", () => {
  /**
   * **Validates: Requirements 16.3**
   *
   * For any valid game state (board, score, turns, isGameOver),
   * serializing then deserializing SHALL produce a game state that is deeply equal to the original.
   */
  it("serialize then deserialize produces an equivalent game state", () => {
    fc.assert(
      fc.property(arbGameState, (state) => {
        const json = serializeState(state);
        const restored = deserializeState(json);

        expect(restored).not.toBeNull();
        expect(restored).toEqual(state);
      }),
      { numRuns: 100 },
    );
  });
});
