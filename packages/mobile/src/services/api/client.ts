/**
 * Thin client for the Spriggle Backend_API (Requirement 12.2). Base URL comes
 * from EXPO_PUBLIC_API_URL; `fetchFn` is injectable for tests. The global
 * leaderboard endpoint is public (guests can't reach it — the client gates that
 * via guestPolicy / connectivity — but no auth token is required to read it).
 */

export interface GlobalLeaderboardEntry {
  position: number;
  score: number;
  playerName: string;
  date: string;
}

export interface GlobalLeaderboardPage {
  entries: GlobalLeaderboardEntry[];
  nextCursor?: string;
}

export interface LeaderboardQuery {
  limit?: number;
  cursor?: string;
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
}

function resolveBaseUrl(override?: string): string {
  const base = override ?? process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error("EXPO_PUBLIC_API_URL is not configured");
  return base.replace(/\/$/, "");
}

/** Fetch a page of the global leaderboard (top scores, descending). */
export async function fetchGlobalLeaderboard(
  query: LeaderboardQuery = {},
): Promise<GlobalLeaderboardPage> {
  const doFetch = query.fetchFn ?? fetch;
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  const qs = params.toString();
  const url = `${resolveBaseUrl(query.apiBaseUrl)}/api/leaderboard${qs ? `?${qs}` : ""}`;

  const res = await doFetch(url);
  if (!res.ok) {
    throw new Error(`Leaderboard request failed (${res.status})`);
  }
  return (await res.json()) as GlobalLeaderboardPage;
}
