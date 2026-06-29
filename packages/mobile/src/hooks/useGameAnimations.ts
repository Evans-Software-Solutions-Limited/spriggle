import { useState, useCallback, useRef } from "react";
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
 */
export function useGameAnimations(): GameAnimationsState {
  const [cellAnimations, setCellAnimations] = useState<
    Map<string, CellAnimationState>
  >(new Map());
  const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const popupIdRef = useRef(0);

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
      await new Promise((resolve) => setTimeout(resolve, 320));

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
    [],
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
      // Stagger: 60 + index * 45ms per cell, plus spring settle (~220ms)
      const totalTime = 60 + positions.length * 45 + 220;
      await new Promise((resolve) => setTimeout(resolve, totalTime));

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
    [],
  );

  const animateShake = useCallback(
    async (row: number, col: number) => {
      const key = `${row}-${col}`;
      setCellAnimations((prev) => {
        const next = new Map(prev);
        next.set(key, "shaking");
        return next;
      });

      // Shake duration ~420ms
      await new Promise((resolve) => setTimeout(resolve, 420));

      setCellAnimations((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [],
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
