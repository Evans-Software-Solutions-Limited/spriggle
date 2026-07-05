import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";

import LeaderboardScreen from "../../app/leaderboard";
import { ThemeProvider } from "../theme";
import { useGlobalLeaderboard } from "../hooks/useGlobalLeaderboard";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("../hooks/useGlobalLeaderboard");

const mockUseGlobal = useGlobalLeaderboard as jest.Mock;
const netinfoAddListener = NetInfo.addEventListener as jest.Mock;

function setConnectivity(isConnected: boolean) {
  netinfoAddListener.mockImplementation(
    (cb: (s: { isConnected: boolean }) => void) => {
      cb({ isConnected });
      return () => {};
    },
  );
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <LeaderboardScreen />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe("LeaderboardScreen", () => {
  it("renders the global board (entries in server order) when online + Global tab", async () => {
    setConnectivity(true);
    mockUseGlobal.mockReturnValue({
      data: {
        entries: [
          { position: 1, score: 900, playerName: "Ada", date: "2026-01-01" },
          { position: 2, score: 500, playerName: "Bea", date: "2026-01-02" },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const screen = renderScreen();
    fireEvent.press(screen.getByLabelText("Global leaderboard"));

    expect(await screen.findByText("Ada")).toBeTruthy();
    expect(screen.getByText("Bea")).toBeTruthy();
    expect(screen.getByText("900")).toBeTruthy();
  });

  it("falls back to the local leaderboard when offline (Requirement 11.3)", async () => {
    setConnectivity(false);
    mockUseGlobal.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const screen = renderScreen();
    // Local store is empty in the test DB → empty-state copy.
    expect(await screen.findByText("No scores yet")).toBeTruthy();
  });

  it("shows an error state when the global request fails", async () => {
    setConnectivity(true);
    mockUseGlobal.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const screen = renderScreen();
    fireEvent.press(screen.getByLabelText("Global leaderboard"));

    await waitFor(() =>
      expect(
        screen.getByText("Couldn't load the global leaderboard"),
      ).toBeTruthy(),
    );
  });
});
