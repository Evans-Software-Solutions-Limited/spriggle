import { useState, useCallback } from "react";
import type { PlantTypeName } from "../components/plants";
import type { BoardData } from "../components/board";

export type SessionPhase = "playing" | "gameover";

interface GameSessionState {
  board: BoardData;
  score: number;
  turns: number;
  phase: SessionPhase;
  /** Start a new game (fresh board). */
  newGame: () => void;
  /** Update the board state (after dig/swap/refill). */
  setBoard: (board: BoardData) => void;
  /** Add points to the score. */
  addScore: (points: number) => void;
  /** Increment turn counter. */
  incrementTurns: () => void;
  /** Transition to game over. */
  endGame: () => void;
}

const PLANT_TYPES: PlantTypeName[] = [
  "watermelon",
  "flower",
  "aubergine",
  "tomato",
  "pumpkin",
];

/** Create a fresh board with 10 random plants (matching engine init). */
function createInitialBoard(): BoardData {
  const board: BoardData = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  let placed = 0;
  while (placed < 10) {
    const r = Math.floor(Math.random() * 8);
    const c = Math.floor(Math.random() * 8);
    if (board[r][c] === null) {
      board[r][c] = PLANT_TYPES[Math.floor(Math.random() * 5)];
      placed++;
    }
  }
  return board;
}

/**
 * Hook managing the game session lifecycle.
 * - New game → playing → game over
 * - Resume from serialized state (to be wired with persistence in task 14)
 */
export function useGameSession(): GameSessionState {
  const [board, setBoard] = useState<BoardData>(createInitialBoard);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>("playing");

  const newGame = useCallback(() => {
    setBoard(createInitialBoard());
    setScore(0);
    setTurns(0);
    setPhase("playing");
  }, []);

  const addScore = useCallback((points: number) => {
    setScore((prev) => prev + points);
  }, []);

  const incrementTurns = useCallback(() => {
    setTurns((prev) => prev + 1);
  }, []);

  const endGame = useCallback(() => {
    setPhase("gameover");
  }, []);

  return {
    board,
    score,
    turns,
    phase,
    newGame,
    setBoard,
    addScore,
    incrementTurns,
    endGame,
  };
}
