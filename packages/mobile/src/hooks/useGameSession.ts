import { useCallback, useRef, useState } from "react";
import {
  initializeBoard,
  executeDig,
  executeSwap,
  type GameState,
  type Position,
  type DigResult,
  type SwapResult,
} from "@spriggle/engine";

export interface GameSession {
  /** Current authoritative engine game state. */
  state: GameState;
  /**
   * Attempt a dig at the given position. Returns the engine's DigResult so the
   * caller can drive animations / detect game-over. State only advances on a
   * successful dig (the engine returns the same state on an invalid action).
   */
  dig: (position: Position) => DigResult;
  /** Attempt a swap between two positions. Returns the engine's SwapResult. */
  swap: (pos1: Position, pos2: Position) => SwapResult;
  /** Start a fresh game (new board with 10 random plants). */
  newGame: () => void;
  /** Replace the session state (used to resume a persisted game). */
  loadState: (state: GameState) => void;
}

/**
 * Game session lifecycle hook — the single owner of the engine {@link GameState}
 * for the play screen.
 *
 * All mutations go through the pure `@spriggle/engine` functions
 * (`initializeBoard`, `executeDig`, `executeSwap`), so scoring, refill counts
 * (3 after a dig, 6 after a swap) and game-over detection all match the engine
 * / legacy GardenerGame gospel. This hook holds no game rules of its own.
 *
 * A `stateRef` mirrors the latest state synchronously so that actions always
 * operate on the current board even if several fire before React re-renders —
 * this avoids the stale-closure class of bug when wiring live state into the
 * interaction hook.
 */
export function useGameSession(initial?: GameState): GameSession {
  const [state, setState] = useState<GameState>(
    () => initial ?? initializeBoard(),
  );
  const stateRef = useRef(state);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const dig = useCallback(
    (position: Position): DigResult => {
      const result = executeDig(stateRef.current, position);
      if (result.success) commit(result.newState);
      return result;
    },
    [commit],
  );

  const swap = useCallback(
    (pos1: Position, pos2: Position): SwapResult => {
      const result = executeSwap(stateRef.current, pos1, pos2);
      if (result.success) commit(result.newState);
      return result;
    },
    [commit],
  );

  const newGame = useCallback(() => {
    commit(initializeBoard());
  }, [commit]);

  const loadState = useCallback(
    (next: GameState) => {
      commit(next);
    },
    [commit],
  );

  return { state, dig, swap, newGame, loadState };
}
