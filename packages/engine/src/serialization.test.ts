import { describe, it, expect } from "vitest";
import { serializeState, deserializeState } from "./serialization";
import { GameState, Board } from "./types";

describe("serializeState", () => {
  it("serializes a known game state to JSON", () => {
    const board: Board = Array.from({ length: 8 }, () =>
      new Array(8).fill(null),
    );
    board[0][0] = "watermelon";
    board[1][1] = "flower";
    board[2][2] = "tomato";

    const state: GameState = {
      board,
      score: 42,
      turns: 7,
      isGameOver: false,
    };

    const json = serializeState(state);
    const parsed = JSON.parse(json);

    expect(parsed.board[0][0]).toBe("watermelon");
    expect(parsed.board[1][1]).toBe("flower");
    expect(parsed.board[2][2]).toBe("tomato");
    expect(parsed.score).toBe(42);
    expect(parsed.turns).toBe(7);
    expect(parsed.isGameOver).toBe(false);
  });
});

describe("deserializeState", () => {
  it("deserializes a valid JSON string back to a GameState", () => {
    const board: Board = Array.from({ length: 8 }, () =>
      new Array(8).fill(null),
    );
    board[3][4] = "pumpkin";

    const state: GameState = {
      board,
      score: 100,
      turns: 15,
      isGameOver: true,
    };

    const json = serializeState(state);
    const restored = deserializeState(json);

    expect(restored).toEqual(state);
  });

  it("returns null for invalid JSON", () => {
    expect(deserializeState("not json at all")).toBeNull();
    expect(deserializeState("{broken")).toBeNull();
  });

  it("returns null for valid JSON with wrong structure", () => {
    expect(deserializeState(JSON.stringify({ foo: "bar" }))).toBeNull();
    expect(deserializeState(JSON.stringify(42))).toBeNull();
    expect(deserializeState(JSON.stringify(null))).toBeNull();
  });

  it("returns null when board has wrong dimensions", () => {
    const tooSmall = {
      board: [[null, null]],
      score: 0,
      turns: 0,
      isGameOver: false,
    };
    expect(deserializeState(JSON.stringify(tooSmall))).toBeNull();
  });

  it("returns null when board contains invalid cell values", () => {
    const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    board[0][0] = "banana"; // invalid plant type
    const state = { board, score: 0, turns: 0, isGameOver: false };
    expect(deserializeState(JSON.stringify(state))).toBeNull();
  });

  it("returns null when score is negative", () => {
    const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    const state = { board, score: -5, turns: 0, isGameOver: false };
    expect(deserializeState(JSON.stringify(state))).toBeNull();
  });

  it("returns null when score is not an integer", () => {
    const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    const state = { board, score: 3.14, turns: 0, isGameOver: false };
    expect(deserializeState(JSON.stringify(state))).toBeNull();
  });

  it("returns null when isGameOver is not a boolean", () => {
    const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    const state = { board, score: 0, turns: 0, isGameOver: "yes" };
    expect(deserializeState(JSON.stringify(state))).toBeNull();
  });
});
