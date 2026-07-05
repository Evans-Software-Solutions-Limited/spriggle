import { useQuery } from "@tanstack/react-query";

import {
  fetchGlobalLeaderboard,
  type GlobalLeaderboardPage,
} from "../services/api";

/**
 * React Query hook for the global leaderboard (Requirement 12.2). Only enabled
 * when the device is online — offline, the screen shows the local leaderboard
 * (Requirement 11.3). Data is considered fresh for a short window to avoid
 * refetch storms when toggling tabs.
 */
export function useGlobalLeaderboard(enabled: boolean, limit = 50) {
  return useQuery<GlobalLeaderboardPage>({
    queryKey: ["leaderboard", "global", limit],
    queryFn: () => fetchGlobalLeaderboard({ limit }),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
