import { fetchGlobalLeaderboard } from "../client";

const BASE = "https://api.test";

function okJson(body: unknown): typeof fetch {
  return jest.fn(
    async () =>
      ({
        ok: true,
        status: 200,
        json: async () => body,
      }) as unknown as Response,
  ) as unknown as typeof fetch;
}

describe("fetchGlobalLeaderboard", () => {
  it("requests /api/leaderboard with limit + cursor and returns the page", async () => {
    const fetchFn = okJson({
      entries: [{ position: 1, score: 10, playerName: "Ada", date: "d" }],
      nextCursor: "c1",
    });
    const page = await fetchGlobalLeaderboard({
      limit: 25,
      cursor: "abc",
      apiBaseUrl: BASE,
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.test/api/leaderboard?limit=25&cursor=abc",
    );
    expect(page.entries[0].playerName).toBe("Ada");
    expect(page.nextCursor).toBe("c1");
  });

  it("omits the query string when no params are given", async () => {
    const fetchFn = okJson({ entries: [] });
    await fetchGlobalLeaderboard({ apiBaseUrl: BASE, fetchFn });
    expect(fetchFn).toHaveBeenCalledWith("https://api.test/api/leaderboard");
  });

  it("throws on a non-ok response", async () => {
    const fetchFn = jest.fn(
      async () => ({ ok: false, status: 503 }) as unknown as Response,
    ) as unknown as typeof fetch;
    await expect(
      fetchGlobalLeaderboard({ apiBaseUrl: BASE, fetchFn }),
    ).rejects.toThrow("503");
  });

  it("throws when the base URL is not configured", async () => {
    const prev = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    try {
      await expect(
        fetchGlobalLeaderboard({
          fetchFn: jest.fn() as unknown as typeof fetch,
        }),
      ).rejects.toThrow("EXPO_PUBLIC_API_URL");
    } finally {
      if (prev !== undefined) process.env.EXPO_PUBLIC_API_URL = prev;
    }
  });
});
