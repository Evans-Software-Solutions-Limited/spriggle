import React, { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { fetchGlobalLeaderboard } from "../../services/api/client";
import { useGlobalLeaderboard } from "../useGlobalLeaderboard";

jest.mock("../../services/api/client");
const mockFetch = fetchGlobalLeaderboard as jest.Mock;

function makeWrapper() {
  const client = new QueryClient({
    // retry off + no GC timer so the test doesn't leave an open handle.
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

afterEach(() => jest.clearAllMocks());

describe("useGlobalLeaderboard", () => {
  it("fetches and returns leaderboard entries when enabled", async () => {
    mockFetch.mockResolvedValue({
      entries: [{ position: 1, score: 9000, playerName: "Zoe", date: "d" }],
    });

    const { result } = renderHook(() => useGlobalLeaderboard(true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.entries[0].playerName).toBe("Zoe");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled (offline / local tab)", () => {
    mockFetch.mockResolvedValue({ entries: [] });
    renderHook(() => useGlobalLeaderboard(false), { wrapper: makeWrapper() });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
