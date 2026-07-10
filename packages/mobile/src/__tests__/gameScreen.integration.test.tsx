import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as engine from "@spriggle/engine";
import type { Board, GameState, PlantType } from "@spriggle/engine";

import GameScreen from "../../app/game";
import { ThemeProvider } from "../theme";

/**
 * Integration test for the game screen ↔ engine wiring (remediation M1).
 *
 * These tests would FAIL against the pre-M1 screen, which rendered a random
 * mock board and had no-op dig/swap handlers: no engine call, no score change,
 * no game-over navigation, no resume. That is the point — they lock the wiring
 * that unit tests (engine + hooks in isolation) never covered.
 */

// react-native-reanimated is mocked via __mocks__/react-native-reanimated.js.

// Wrap the engine so board init / dig / swap can be steered per test while all
// other functions (findConnectedGroup, scoring, game-over) stay real. The
// engine's babel-transpiled exports are non-configurable, so jest.spyOn can't
// redefine them — a mock factory is the supported path.
jest.mock("@spriggle/engine", () => {
  const actual = jest.requireActual("@spriggle/engine");
  return {
    ...actual,
    initializeBoard: jest.fn(actual.initializeBoard),
    executeDig: jest.fn(actual.executeDig),
    executeSwap: jest.fn(actual.executeSwap),
  };
});

const actualEngine = jest.requireActual<typeof engine>("@spriggle/engine");
const mockInit = engine.initializeBoard as jest.Mock;
const mockDig = engine.executeDig as jest.Mock;
const mockSwap = engine.executeSwap as jest.Mock;

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
}));

// In-memory persistence fake — isolates each test from the real SQLite
// singleton while still exercising the container's load/save/clear/leaderboard
// calls. The real store is unit-tested in services/__tests__/localStorage.
const store: { saved: GameState | null; leaderboard: { score: number }[] } = {
  saved: null,
  leaderboard: [],
};
jest.mock("../services/localStorage", () => ({
  getLocalStorageService: jest.fn(async () => ({
    loadGameState: async () => store.saved,
    saveGameState: async (s: GameState) => {
      store.saved = s;
    },
    clearGameState: async () => {
      store.saved = null;
    },
    getLeaderboard: async () => store.leaderboard,
  })),
}));

function boardWith(cells: Record<string, PlantType>): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  for (const [key, value] of Object.entries(cells)) {
    const [r, c] = key.split("-").map(Number);
    board[r][c] = value;
  }
  return board;
}

/** A board with a horizontal run of 5 watermelons in row 0 (a valid dig). */
function fiveWatermelonRow(): GameState {
  return {
    board: boardWith({
      "0-0": "watermelon",
      "0-1": "watermelon",
      "0-2": "watermelon",
      "0-3": "watermelon",
      "0-4": "watermelon",
    }),
    score: 0,
    turns: 0,
    isGameOver: false,
  };
}

const FIVE_TYPES: PlantType[] = [
  "watermelon",
  "flower",
  "aubergine",
  "tomato",
  "pumpkin",
];

/**
 * A completely FULL board on a diagonal (r+c)%5 pattern: every cell's four
 * orthogonal neighbours are a different type, so every connected group is a
 * singleton — no group ≥ 5 anywhere. A valid swap keeps it full (0 empty cells
 * → refill is a no-op) and creates at most a pair, so `executeSwap` reports a
 * genuine game-over. This is the ONLY action that can end the game: a dig nets
 * +2 empty cells (removes ≥5, refills 3), so it can never fill the board.
 */
function fullNoGroupBoard(score: number): GameState {
  const board: Board = Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => FIVE_TYPES[(r + c) % 5]),
  );
  return { board, score, turns: 0, isGameOver: false };
}

function renderGame() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1194, height: 834 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <GameScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockInit.mockReset().mockImplementation(actualEngine.initializeBoard);
  mockDig.mockReset().mockImplementation(actualEngine.executeDig);
  mockSwap.mockReset().mockImplementation(actualEngine.executeSwap);
  mockReplace.mockReset();
  store.saved = null;
  store.leaderboard = [];
});

describe("GameScreen ↔ engine integration (M1)", () => {
  it("renders the engine's board and a valid dig removes the group + scores", async () => {
    mockInit.mockReturnValue(fiveWatermelonRow());

    const screen = renderGame();

    // Board comes from the engine (5 watermelons), not the old random mock.
    expect(screen.getAllByLabelText("watermelon at cell")).toHaveLength(5);

    // A SINGLE tap digs the group (no confirm step).
    fireEvent.press(screen.getAllByLabelText("watermelon at cell")[0]);

    // watermelon = 3 pts × 5 = 15. Proves executeDig ran and state advanced.
    await waitFor(() => expect(screen.getByText("15")).toBeTruthy());
    expect(mockDig).toHaveBeenCalledTimes(1);
    // Not a full board → not game over → no navigation.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("routes to /gameover when a real swap ends the game (full board, no group)", async () => {
    // Real engine throughout — no executeSwap mock. A swap on a full board
    // keeps it full with no 5-group, so the engine genuinely reports game-over.
    mockInit.mockReturnValue(fullNoGroupBoard(30));

    const screen = renderGame();
    // Switch to the swap tool, then swap the two adjacent, different-type cells
    // at (0,0)=watermelon and (0,1)=flower (first of each in row-major order).
    fireEvent.press(screen.getByLabelText("Swap tool"));
    fireEvent.press(screen.getAllByLabelText("watermelon at cell")[0]);
    fireEvent.press(screen.getAllByLabelText("flower at cell")[0]);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/gameover",
        // Swap does not change score; leaderboard is empty so 30 is a new best.
        params: { score: "30", isBest: "true" },
      }),
    );
    expect(mockSwap).toHaveBeenCalledTimes(1);
  });

  it("resumes a persisted in-progress game instead of starting fresh", async () => {
    store.saved = {
      board: boardWith({ "3-3": "tomato" }),
      score: 7,
      turns: 4,
      isGameOver: false,
    };
    // Fresh init would score 0; resume must surface the saved score of 7.
    mockInit.mockReturnValue(fiveWatermelonRow());

    const screen = renderGame();

    await waitFor(() => expect(screen.getByText("7")).toBeTruthy());
  });

  it("an invalid dig (group < 5) does not score or navigate", async () => {
    mockInit.mockReturnValue({
      board: boardWith({ "0-0": "tomato", "0-1": "tomato" }),
      score: 0,
      turns: 0,
      isGameOver: false,
    });

    const screen = renderGame();
    fireEvent.press(screen.getAllByLabelText("tomato at cell")[0]);

    // Group of 2 < 5 → interaction rejects before any engine dig call.
    // waitFor also lets the async hydration effect settle inside act().
    await waitFor(() => expect(mockDig).not.toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // M3: animation / feedback wiring. These fail against the pre-M3 screen,
  // whose onDig/onInvalidAction were no-ops (no popup, no toast).
  it("shows a floating score popup on a valid dig", async () => {
    mockInit.mockReturnValue(fiveWatermelonRow());

    const screen = renderGame();
    fireEvent.press(screen.getAllByLabelText("watermelon at cell")[0]);

    // ScorePopup renders "+<delta>" (watermelon ×5 = 15).
    await waitFor(() => expect(screen.getByText("+15")).toBeTruthy());
  });

  it("shows an error toast on an invalid action", async () => {
    mockInit.mockReturnValue({
      board: boardWith({ "0-0": "tomato", "0-1": "tomato" }),
      score: 0,
      turns: 0,
      isGameOver: false,
    });

    const screen = renderGame();
    fireEvent.press(screen.getAllByLabelText("tomato at cell")[0]);

    // useGameInteraction rejects the <5 group with a "Need 5+ …" reason,
    // which the container surfaces as a toast.
    await waitFor(() => expect(screen.getByText(/Need 5\+/)).toBeTruthy());
  });

  // M4: the pause button opens a sheet (it used to just router.back()).
  it("opens the pause sheet from the rail pause button", async () => {
    mockInit.mockReturnValue(fiveWatermelonRow());

    const screen = renderGame();
    fireEvent.press(screen.getByLabelText("Pause"));

    await waitFor(() => expect(screen.getByText("Paused")).toBeTruthy());
    expect(screen.getByLabelText("Resume")).toBeTruthy();
    expect(screen.getByLabelText("Restart run")).toBeTruthy();
    expect(screen.getByLabelText("Quit to garden")).toBeTruthy();
  });
});
