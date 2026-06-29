import { useState, useCallback, useRef, useEffect } from "react";
import type { CellAnimationState } from "../components/board/AnimatedCell";

interface ScorePopupData {
  id: string;
  score: number;
  x: number;
  y: number;
  isBig: boolean;
}

interface GameAnimationsState {
  /** Map of "row-col" → animation state for each cell. */
  cellAnimations: Map<string, CellAnimationState>;
  /** Active score popups. */
  scorePopups: ScorePopupData[];
  /** Whether an animation sequence is currently running. */
  isBusy: boolean;
  /** Trigger a dig animation sequence. */
  animateDig: (
    positions: { row: number; col: number }[],
    score: number,
    centroidX: number,
    centroidY: number,
    isBig: boolean,
  ) => Promise<void>;
  /** Trigger spawn/refill animations. */
  animateSpawn: (positions: { row: number; col: number }[]) => Promise<void>;
  /** Trigger a shake animation on a cell. */
  animateShake: (row: number, col: number) => Promise<void>;
  /** Remove a score popup by id. */
  dismissPopup: (id: string) => void;
}

/**
 * Hook that orchestrates game animations (dig, spawn, shake, score popups).
 * Container-level logic that drives the AnimatedCell and ScorePopup presenters.
 * Tracks timers and cancels on unmount to prevent setState-on-unmounted leaks.
 */
export function useGameAnimations(): GameAnimationsState {
  const [cellAnimations, setCellAnimations] = useState<
    Map<string, CellAnimationState>
  >(new Map());
  const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const popupIdRef = useRef(0);
  const mountedRef = useRef(true);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Track mount state and clean up timers on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const timer of timersRef.current) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  /** Creates a cancellable delay that respects unmount. */
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        resolve();
      }, ms);
      timersRef.current.add(timer);
    });
  }, []);

  const animateDig = useCallback(
    async (
      positions: { row: number; col: number }[],
      score: number,
      centroidX: number,
      centroidY: number,
      isBig: boolean,
    ) => {
      setIsBusy(true);

      // Show score popup
      const popupId = `popup-${++popupIdRef.current}`;
      setScorePopups((prev) => [
        ...prev,
        { id: popupId, score, x: centroidX, y: centroidY, isBig },
      ]);

      // Set all dug cells to "clearing"
      setCellAnimations((prev) => {
        const next = new Map(prev);
        for (const p of positions) {
          next.set(`${p.row}-${p.col}`, "clearing");
        }
        return next;
      });

      // Wait for clearing animation (300ms)
      await delay(320);
      if (!mountedRef.current) return;

      // Reset animations
      setCellAnimations((prev) => {
        const next = new Map(prev);
        for (const p of positions) {
          next.delete(`${p.row}-${p.col}`);
        }
        return next;
      });

      setIsBusy(false);
    },
    [delay],
  );

  const animateSpawn = useCallback(
    async (positions: { row: number; col: number }[]) => {
      setIsBusy(true);

      // Set all spawned cells to "spawning" with stagger
      setCellAnimations((prev) => {
        const next = new Map(prev);
        for (const p of positions) {
          next.set(`${p.row}-${p.col}`, "spawning");
        }
        return next;
      });

      // Wait for staggered spawn to complete
      const totalTime = 60 + positions.length * 45 + 220;
      await delay(totalTime);
      if (!mountedRef.current) return;

      // Reset animations
      setCellAnimations((prev) => {
        const next = new Map(prev);
        for (const p of positions) {
          next.delete(`${p.row}-${p.col}`);
        }
        return next;
      });

      setIsBusy(false);
    },
    [delay],
  );

  const animateShake = useCallback(
    async (row: number, col: number) => {
      const key = `${row}-${col}`;
      setCellAnimations((prev) => {
        const next = new Map(prev);
        next.set(key, "shaking");
        return next;
      });

      await delay(420);
      if (!mountedRef.current) return;

      setCellAnimations((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [delay],
  );

  const dismissPopup = useCallback((id: string) => {
    setScorePopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    cellAnimations,
    scorePopups,
    isBusy,
    animateDig,
    animateSpawn,
    animateShake,
    dismissPopup,
  };
}
