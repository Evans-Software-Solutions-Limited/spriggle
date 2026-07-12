import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../../src/theme";
import OnboardingScreen from "../onboarding";

// react-native-reanimated is mocked via __mocks__/react-native-reanimated.js;
// the tutorial's own setTimeout pacing is driven by jest fake timers below.

const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

// Stub the onboarding context synchronously. The real provider hydrates from
// AsyncStorage in an effect; awaiting that flush via `act(async () => {})` under
// fake timers is a known hang (React's async-act waits on a faked timer). The
// screen only needs `setOnboarded`, so a synchronous stub keeps these tests
// deterministic and fully sync. tutorialData is imported directly (not via this
// barrel), so it stays real.
jest.mock("../../src/onboarding", () => ({
  useOnboarding: () => ({
    isOnboarded: false,
    isHydrating: false,
    setOnboarded: jest.fn(),
  }),
  OnboardingProvider: ({ children }: { children?: unknown }) => children,
}));

// Timings mirror app/onboarding.tsx.
const DIG_CLEAR_MS = 480;
const SWAP_SETTLE_MS = 520;
const SHAKE_MS = 420;

const STEP0 = /Tap a patch of 5/;
const STEP1 = /Only got four/;
const STEP2 = /dig your big patch/;

function renderTutorial() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1194, height: 834 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <OnboardingScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

/** Board cells in row-major order (accessibility labels "<plant> at cell" / "Empty cell"). */
const cells = () => screen.getAllByLabelText(/at cell|Empty cell/);
const tap = (row: number, col: number) =>
  fireEvent.press(cells()[row * 8 + col]);
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers();
  mockReplace.mockClear();
  mockBack.mockClear();
  mockParams = {};
});

afterEach(() => {
  jest.useRealTimers();
});

describe("interactive onboarding — tap gating", () => {
  it("ignores a tap on a non-scripted cell (wrong cell shakes, no advance)", () => {
    renderTutorial();
    expect(screen.getByText(STEP0)).toBeTruthy();

    // (0,0) is filler, not part of the dig group.
    tap(0, 0);
    advance(SHAKE_MS);

    expect(screen.getByText(STEP0)).toBeTruthy();
    expect(screen.queryByText(STEP1)).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("advances to the swap beat when the scripted dig cell is tapped", () => {
    renderTutorial();

    // (2,2) is the centre of the seeded dig group.
    tap(2, 2);
    advance(DIG_CLEAR_MS);

    expect(screen.getByText(STEP1)).toBeTruthy();
    expect(screen.queryByText(STEP0)).toBeNull();
  });

  it("ignores Skip while a dig animation is still settling", () => {
    renderTutorial();

    // Start the dig (locks interaction) then hit Skip mid-animation.
    tap(2, 2);
    fireEvent.press(screen.getByLabelText("Skip tutorial"));
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    // The dig still completes normally.
    advance(DIG_CLEAR_MS);
    expect(screen.getByText(STEP1)).toBeTruthy();
  });
});

describe("interactive onboarding — full flow", () => {
  it("completes all three beats and routes into the game (first-run)", () => {
    renderTutorial();

    // Beat 1: dig the seeded group.
    tap(2, 2);
    advance(DIG_CLEAR_MS);
    expect(screen.getByText(STEP1)).toBeTruthy();

    // Beat 2: swap the two ringed cells (connector {3,3} + lone {5,5}).
    tap(3, 3);
    tap(5, 5);
    advance(SWAP_SETTLE_MS);
    expect(screen.getByText(STEP2)).toBeTruthy();

    // Beat 3: dig the newly formed 5-group (contains {2,3}).
    tap(2, 3);
    advance(DIG_CLEAR_MS);

    expect(mockReplace).toHaveBeenCalledWith("/game");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("returns to the game (not /game) when opened from the pause sheet", () => {
    mockParams = { from: "game" };
    renderTutorial();

    fireEvent.press(screen.getByLabelText("Skip tutorial"));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
