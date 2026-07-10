import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  findConnectedGroup,
  type Board,
  type Position,
} from "@spriggle/engine";
import { useTheme, fonts, spacing } from "../src/theme";
import {
  DesignFrame,
  useFrameSize,
} from "../src/components/layout/DesignFrame";
import { GameBoard } from "../src/components/board";
import type { BoardData } from "../src/components/board";
import type { CellAnimationState } from "../src/components/board/AnimatedCell";
import { COLUMN_GAP } from "../src/components/board/boardLayout";
import { Mascot } from "../src/components/mascot";
import type { MascotPose } from "../src/components/mascot";
import { useOnboarding } from "../src/onboarding";
import {
  buildDigBoard,
  buildSwapBoard,
  swapCells,
  cellKey,
  DIG_GROUP,
  SWAP_PAIR,
  SWAP_CONNECTOR,
} from "../src/onboarding/tutorialData";

/** Animation / pacing constants (ms), matching the prototype's feel. */
const SHAKE_MS = 420;
const DIG_CLEAR_MS = 480;
const SWAP_SETTLE_MS = 520;

interface StepDef {
  tool: MascotPose;
  say: string;
  hint: string;
}

const STEPS: StepDef[] = [
  {
    tool: "dig",
    say: "Tap a patch of 5 or more of the same plant to dig it.",
    hint: "Tap any glowing tile",
  },
  {
    tool: "swap",
    say: "Only got four? Swap two neighbours to line up a bigger patch.",
    hint: "Swap the two ringed tiles",
  },
  {
    tool: "dig",
    say: "Now there are five — dig your big patch!",
    hint: "Tap the glowing patch",
  },
];

const findGroup = (board: BoardData, p: Position) =>
  findConnectedGroup(board as Board, p);

const clearGroup = (board: BoardData, group: Position[]): BoardData => {
  const next = board.map((row) => row.slice());
  for (const p of group) next[p.row][p.col] = null;
  return next;
};

const animsFor = (
  cells: Position[],
  state: CellAnimationState,
): Map<string, CellAnimationState> => {
  const map = new Map<string, CellAnimationState>();
  for (const p of cells) map.set(cellKey(p), state);
  return map;
};

/**
 * Interactive first-run tutorial — a scripted 3-beat lesson (dig · swap · dig
 * the bigger patch) driving the REAL board components and engine, ported from
 * the prototype's `onboarding.js`. Taps are gated to the scripted cells; a wrong
 * tap shakes. Completion persists the `onboarded` flag and routes into the game
 * (or back, when opened from the pause sheet's "How to play").
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const frame = useFrameSize();
  const { setOnboarded } = useOnboarding();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [step, setStep] = useState(0);
  const [board, setBoard] = useState<BoardData>(() => buildDigBoard());
  const [swapFirst, setSwapFirst] = useState<Position | null>(null);
  const [bigGroup, setBigGroup] = useState<Position[]>([]);
  const [cellAnims, setCellAnims] = useState<Map<string, CellAnimationState>>(
    () => new Map(),
  );
  // A single in-flight animation lock (dig clear / swap settle / shake).
  const busyRef = useRef(false);
  // Guards `finish` so a race (e.g. Skip + a settling timer) can't navigate
  // twice, and tracks pending timers so none fire setState after unmount.
  const doneRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef;
    return () => {
      for (const id of timers.current) clearTimeout(id);
      timers.current = [];
    };
  }, []);

  /** setTimeout that is tracked for unmount cleanup. */
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const s = STEPS[step];

  // Cells the current beat accepts a tap on.
  const allowedKeys = useMemo(() => {
    if (step === 0) return new Set(DIG_GROUP.map(cellKey));
    if (step === 1) return new Set(SWAP_PAIR.map(cellKey));
    return new Set(bigGroup.map(cellKey));
  }, [step, bigGroup]);

  // Gold pre-dig highlight on the diggable group (dig beats only).
  const highlightedCells = useMemo(() => {
    if (step === 0) return new Set(DIG_GROUP.map(cellKey));
    if (step === 2) return new Set(bigGroup.map(cellKey));
    return undefined;
  }, [step, bigGroup]);

  // Accent rings on both swap targets (swap beat only).
  const ringedCells = useMemo(
    () => (step === 1 ? new Set(SWAP_PAIR.map(cellKey)) : undefined),
    [step],
  );

  const boardColWidth = (frame.width - COLUMN_GAP) * 0.58;
  const availableSize = Math.min(boardColWidth, frame.height - 48);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setOnboarded(true);
    if (from === "game") router.back();
    else router.replace("/game");
  };

  const digAt = (row: number, col: number, after: () => void) => {
    busyRef.current = true;
    const group = findGroup(board, { row, col });
    setCellAnims(animsFor(group, "clearing"));
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
    schedule(() => {
      setBoard((prev) => clearGroup(prev, group));
      setCellAnims(new Map());
      busyRef.current = false;
      after();
    }, DIG_CLEAR_MS);
  };

  const goToSwapStep = () => {
    setStep(1);
    setBoard(buildSwapBoard());
    setSwapFirst(null);
    setBigGroup([]);
    setCellAnims(new Map());
  };

  const doSwap = (a: Position, b: Position) => {
    busyRef.current = true;
    const next = swapCells(board, a, b);
    setBoard(next);
    setSwapFirst(null);
    setCellAnims(animsFor([a, b], "spawning"));
    // The connector now holds the watermelon that completes the group.
    const group = findGroup(next, SWAP_CONNECTOR);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {},
    );
    schedule(() => {
      setBigGroup(group);
      setCellAnims(new Map());
      busyRef.current = false;
      setStep(2);
    }, SWAP_SETTLE_MS);
  };

  const onCellPress = (row: number, col: number) => {
    if (busyRef.current) return;
    const key = `${row}-${col}`;

    if (!allowedKeys.has(key)) {
      // Wrong cell — shake it, no progress.
      busyRef.current = true;
      setCellAnims(new Map([[key, "shaking"]]));
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      schedule(() => {
        setCellAnims(new Map());
        busyRef.current = false;
      }, SHAKE_MS);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (step === 0) {
      digAt(row, col, goToSwapStep);
    } else if (step === 1) {
      // First ringed tap selects; second (different) tap performs the swap.
      if (!swapFirst) {
        setSwapFirst({ row, col });
        return;
      }
      if (swapFirst.row === row && swapFirst.col === col) return;
      doSwap(swapFirst, { row, col });
    } else {
      digAt(row, col, finish);
    }
  };

  const selectedCell = swapFirst ? cellKey(swapFirst) : null;

  return (
    <DesignFrame>
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        {/* Left: guidance panel */}
        <View style={styles.leftPanel}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i <= step ? colors.primary : colors.surfaceLine,
                  },
                ]}
              />
            ))}
          </View>

          <Mascot pose={s.tool} size={150} />

          <View
            style={[
              styles.speech,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
          >
            <Text style={[styles.speechText, { color: colors.ink }]}>
              {s.say}
            </Text>
          </View>

          <Text style={[styles.hint, { color: colors.accent700 }]}>
            👆 {s.hint}
          </Text>

          <Pressable
            style={styles.skip}
            onPress={() => {
              // Ignore Skip while an animation is settling; `finish` is also
              // idempotent so a race can never navigate twice.
              if (!busyRef.current) finish();
            }}
            accessibilityRole="button"
            accessibilityLabel="Skip tutorial"
          >
            <Text style={[styles.skipText, { color: colors.inkSoft }]}>
              Skip tutorial
            </Text>
          </Pressable>
        </View>

        {/* Right: the real board */}
        <View style={styles.rightPanel}>
          <GameBoard
            board={board}
            highlightedCells={highlightedCells}
            ringedCells={ringedCells}
            selectedCell={selectedCell}
            cellAnimations={cellAnims}
            onCellPress={onCellPress}
            availableSize={availableSize}
          />
        </View>
      </View>
    </DesignFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    padding: 30,
    gap: COLUMN_GAP,
  },
  leftPanel: {
    flex: 0.42,
    justifyContent: "center",
    gap: 18,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 34,
    height: 6,
    borderRadius: 3,
  },
  speech: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  speechText: {
    fontFamily: fonts.ui,
    fontSize: 17,
    lineHeight: 25,
  },
  hint: {
    fontFamily: fonts.uiExtra,
    fontSize: 13,
  },
  skip: {
    alignSelf: "flex-start",
    marginTop: spacing.s2,
  },
  skipText: {
    fontFamily: fonts.uiExtra,
    fontSize: 14,
  },
  rightPanel: {
    flex: 0.58,
    alignItems: "center",
    justifyContent: "center",
  },
});
