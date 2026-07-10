/**
 * Game-over detection — ports the legacy GardenerGame rule.
 *
 * In the legacy (`GardenerGame/src/page/Gardener.tsx`), `spawnPlants(count)`
 * spawns one plant at a time and, the moment it finds no empty cell left,
 * ends the game. So the game is over exactly when a refill cannot place its
 * full spawn count — i.e. there were fewer empty cells than plants to spawn.
 *
 * Consequences (spawn counts: 3 after a dig, 6 after a swap):
 * - A dig frees ≥ 5 cells, so its 3-plant refill always fits — a dig never
 *   ends the game.
 * - A swap frees nothing, so it ends the game whenever fewer than 6 empty
 *   cells remain before its refill. A full board with no diggable group forces
 *   a swap, which then can't fully spawn — so it ends there too.
 *
 * This replaces the earlier (incorrect) "board 100% full AND no group of 5+"
 * rule, which never triggered while any empty cell remained and made the game
 * feel endless.
 *
 * Requirements: 5.1, 5.3, 5.4
 */
export function isRefillStarved(
  filledCount: number,
  requestedCount: number,
): boolean {
  return filledCount < requestedCount;
}
