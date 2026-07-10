import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  findConnectedGroup,
  type Board,
  type GameState,
  type Position,
} from "@spriggle/engine";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import { GameBoard } from "../src/components/board";
import type { BoardData } from "../src/components/board";
import {
  COLUMN_GAP,
  BOARD_COL_FLEX,
  CELL_GAP,
  SOIL_PADDING,
  cellSizeFor,
} from "../src/components/board/boardLayout";
import {
  DesignFrame,
  useFrameSize,
} from "../src/components/layout/DesignFrame";
import { useGameInteraction } from "../src/hooks/useGameInteraction";
import { useGameSession } from "../src/hooks/useGameSession";
import { useGameAnimations } from "../src/hooks/useGameAnimations";
import { getLocalStorageService } from "../src/services/localStorage";

/** Big-dig threshold (matches the prototype's 8+ celebration). */
const BIG_DIG_SIZE = 8;
/** How long an invalid-action toast stays up (ms). */
const TOAST_MS = 2100;

/**
 * Adapter mapping the interaction hook's `(board, row, col)` signature onto the
 * engine's `findConnectedGroup(board, position)`. This is the SAME BFS the
 * engine uses for dig validation/removal — no forked copy — so the highlighted
 * group and the group `executeDig` removes are always identical.
 */
function findGroup(board: BoardData, row: number, col: number) {
  return findConnectedGroup(board as Board, { row, col });
}

/** Mean position of a group, in cell coordinates. */
function centroid(positions: Position[]): { row: number; col: number } {
  const sum = positions.reduce(
    (acc, p) => ({ row: acc.row + p.row, col: acc.col + p.col }),
    { row: 0, col: 0 },
  );
  const n = positions.length || 1;
  return { row: sum.row / n, col: sum.col / n };
}

/**
 * Game screen. The outer component owns the DesignFrame (fixed 1194×834 canvas
 * scaled to the device); the inner container reads the frame size and drives
 * the game. Splitting them keeps `useFrameSize` inside the frame's provider.
 */
export default function GameScreen() {
  return (
    <DesignFrame>
      <GameScreenContent />
    </DesignFrame>
  );
}

/**
 * Game screen container.
 * Landscape two-panel: board-col (left ~60%) + rail (right ~40%).
 * Matches prototype's Screens.game layout.
 */
function GameScreenContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const frame = useFrameSize();
  const session = useGameSession();
  const anim = useGameAnimations();
  const board = session.state.board as BoardData;
  const score = session.state.score;

  // The board is square and must fit inside its column, constrained by whichever
  // of the column width or the frame height is smaller. Deriving the size here
  // (the container) keeps GameBoard a pure presenter.
  const boardColWidth = (frame.width - COLUMN_GAP) * BOARD_COL_FLEX;
  const boardAvailableSize = Math.min(boardColWidth, frame.height);
  const cellSize = cellSizeFor(boardAvailableSize);

  // Convert a cell centroid to a pixel point for the floating score popup.
  // The popup is absolutely positioned inside the soil gradient (RN measures
  // absolute offsets from the border box), whereas the grid is inset by
  // SOIL_PADDING — so add that inset to land on the true cell centre.
  const cellCentreToPx = useCallback(
    (c: { row: number; col: number }) => ({
      x: SOIL_PADDING + c.col * (cellSize + CELL_GAP) + cellSize / 2,
      y: SOIL_PADDING + c.row * (cellSize + CELL_GAP) + cellSize / 2,
    }),
    [cellSize],
  );

  // Transient toast for invalid actions ("Need 5+ …" / "Pick two different…").
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // Hydration: attempt to resume a persisted, still-in-progress game on mount;
  // otherwise start fresh. `hydrated` gates the persistence effect so we never
  // save the initial board over a game we're about to load.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const store = await getLocalStorageService();
        const saved = await store.loadGameState();
        if (!cancelled && saved && !saved.isGameOver) {
          session.loadState(saved as GameState);
        }
      } catch {
        /* best-effort resume; fall back to the fresh board */
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist after every state change once hydrated. On game over we clear the
  // snapshot so the next launch starts fresh rather than resuming a dead board.
  useEffect(() => {
    if (!hydrated) return;
    const snapshot = session.state;
    (async () => {
      try {
        const store = await getLocalStorageService();
        if (snapshot.isGameOver) await store.clearGameState();
        else await store.saveGameState(snapshot);
      } catch {
        /* best-effort persistence */
      }
    })();
  }, [hydrated, session.state]);

  // Route to the game-over screen exactly once when the board fills with no
  // valid group left. `isBest` is computed against the local leaderboard's
  // current top score *before* this run is recorded there (gameover.tsx records
  // it), so a tie is not a new best.
  const gameOverHandled = useRef(false);
  const handleGameOver = useCallback(
    async (finalState: GameState) => {
      if (gameOverHandled.current) return;
      gameOverHandled.current = true;
      let isBest = false;
      try {
        const store = await getLocalStorageService();
        const leaderboard = await store.getLeaderboard();
        const prevBest = leaderboard.reduce((m, e) => Math.max(m, e.score), 0);
        isBest = finalState.score > prevBest;
        await store.clearGameState();
      } catch {
        /* best-effort; default isBest=false */
      }
      router.replace({
        pathname: "/gameover",
        params: {
          score: String(finalState.score),
          isBest: String(isBest),
        },
      });
    },
    [router],
  );

  const interaction = useGameInteraction(board, findGroup, {
    onDig: (row, col) => {
      const prevScore = session.state.score;
      const result = session.dig({ row, col });
      if (!result.success) return;
      // session.dig committed the new board synchronously; batching the
      // animation setState in this same handler means refilled cells first
      // paint in their "spawning" state (scale 0), so they grow in without a
      // full-size flash.
      const delta = result.newState.score - prevScore;
      const group = result.removedPositions;
      const { x, y } = cellCentreToPx(centroid(group));
      // Refill lands in just-cleared cells, so refillPositions ⊆ removedPositions.
      // Only run the (visually no-op) clearing state on the dug cells that were
      // NOT refilled — otherwise animateDig's 320ms cleanup would reset the
      // refilled cells mid-spawn and snap them to full size early.
      const refillKeys = new Set(
        result.refillPositions.map((p) => `${p.row}-${p.col}`),
      );
      const clearingOnly = group.filter(
        (p) => !refillKeys.has(`${p.row}-${p.col}`),
      );
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      void anim.animateDig(
        clearingOnly,
        delta,
        x,
        y,
        group.length >= BIG_DIG_SIZE,
      );
      void anim.animateSpawn(result.refillPositions);
      if (result.newState.isGameOver) void handleGameOver(result.newState);
    },
    onSwap: (r1, c1, r2, c2) => {
      const result = session.swap({ row: r1, col: c1 }, { row: r2, col: c2 });
      if (!result.success) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => {},
      );
      void anim.animateSpawn(result.refillPositions);
      if (result.newState.isGameOver) void handleGameOver(result.newState);
    },
    onInvalidAction: (row, col, reason) => {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      void anim.animateShake(row, col);
      showToast(reason);
    },
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      {/* Board column (left) */}
      <View style={styles.boardCol}>
        <GameBoard
          board={board}
          highlightedCells={interaction.highlightedCells}
          selectedCell={interaction.selectedCell}
          onCellPress={interaction.handleCellPress}
          cellAnimations={anim.cellAnimations}
          popups={anim.scorePopups}
          onPopupComplete={anim.dismissPopup}
          availableSize={boardAvailableSize}
        />
      </View>

      {/* Rail (right) */}
      <View style={styles.rail}>
        {/* Top: brand + pause */}
        <View style={styles.railTop}>
          <Text style={[styles.railBrand, { color: colors.primary }]}>
            Spriggle
          </Text>
          <Pressable
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceLine,
              },
            ]}
            onPress={() => router.back()}
            accessibilityLabel="Pause"
          >
            <Text style={{ color: colors.ink, fontSize: 16 }}>⏸</Text>
          </Pressable>
        </View>

        {/* Score card */}
        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceLine,
            },
          ]}
        >
          <Text style={[styles.scoreLabel, { color: colors.inkSoft }]}>
            Score
          </Text>
          <Text style={[styles.scoreValue, { color: colors.ink }]}>
            {score.toLocaleString()}
          </Text>
          <View style={styles.bestRow}>
            <Text style={[styles.bestLabel, { color: colors.inkFaint }]}>
              Best
            </Text>
            <Text style={[styles.bestValue, { color: colors.inkSoft }]}>0</Text>
          </View>
        </View>

        {/* Speech bubble + mascot area */}
        <View
          style={[
            styles.toolMod,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceLine,
            },
          ]}
        >
          <View style={styles.speechBubble}>
            <Text style={[styles.speechText, { color: colors.ink }]}>
              {interaction.tool === "dig"
                ? "Dig a patch of 5 or more!"
                : "Swap two to build a bigger patch."}
            </Text>
          </View>

          {/* Spawn pills */}
          <View style={styles.spawnRow}>
            <View
              style={[
                styles.pill,
                interaction.tool === "dig" && {
                  backgroundColor: colors.primary300,
                },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.ink }]}>
                +3 per dig
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                interaction.tool === "swap" && {
                  backgroundColor: colors.primary300,
                },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.ink }]}>
                +6 per swap
              </Text>
            </View>
          </View>

          {/* Tool selector */}
          <View style={styles.selector}>
            <Pressable
              style={[
                styles.toolBtn,
                {
                  backgroundColor:
                    interaction.tool === "dig"
                      ? colors.primary
                      : colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
              onPress={() => interaction.setTool("dig")}
              accessibilityLabel="Dig tool"
              accessibilityState={{ selected: interaction.tool === "dig" }}
            >
              <Text
                style={[
                  styles.toolBtnLabel,
                  {
                    color:
                      interaction.tool === "dig"
                        ? colors.onPrimary
                        : colors.ink,
                  },
                ]}
              >
                Dig
              </Text>
              <Text
                style={[
                  styles.toolBtnSub,
                  {
                    color:
                      interaction.tool === "dig"
                        ? colors.onPrimary
                        : colors.inkSoft,
                  },
                ]}
              >
                Clear 5+
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toolBtn,
                {
                  backgroundColor:
                    interaction.tool === "swap"
                      ? colors.primary
                      : colors.surface,
                  borderColor: colors.surfaceLine,
                },
              ]}
              onPress={() => interaction.setTool("swap")}
              accessibilityLabel="Swap tool"
              accessibilityState={{ selected: interaction.tool === "swap" }}
            >
              <Text
                style={[
                  styles.toolBtnLabel,
                  {
                    color:
                      interaction.tool === "swap"
                        ? colors.onPrimary
                        : colors.ink,
                  },
                ]}
              >
                Swap
              </Text>
              <Text
                style={[
                  styles.toolBtnSub,
                  {
                    color:
                      interaction.tool === "swap"
                        ? colors.onPrimary
                        : colors.inkSoft,
                  },
                ]}
              >
                Trade two
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Invalid-action toast */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.err }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: "row", gap: COLUMN_GAP },
  boardCol: {
    flex: BOARD_COL_FLEX,
    alignItems: "center",
    justifyContent: "center",
  },
  rail: {
    flex: 1 - BOARD_COL_FLEX,
    paddingVertical: spacing.s4,
    paddingRight: spacing.s4,
    gap: 14,
  },
  railTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  railBrand: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 30,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCard: {
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s4,
  },
  scoreLabel: {
    fontFamily: fonts.uiExtra,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 42,
    lineHeight: 48,
  },
  bestRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  bestLabel: { fontFamily: fonts.uiExtra, fontSize: 12 },
  bestValue: { fontFamily: fonts.display, fontWeight: "700", fontSize: 14 },
  toolMod: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s4,
    gap: 12,
  },
  speechBubble: { paddingVertical: 6 },
  speechText: {
    fontFamily: fonts.ui,
    fontWeight: "700",
    fontSize: 15,
  },
  spawnRow: { flexDirection: "row", gap: 8 },
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontFamily: fonts.uiExtra, fontSize: 12 },
  selector: { flexDirection: "row", gap: 10, marginTop: "auto" },
  toolBtn: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s3,
    alignItems: "center",
  },
  toolBtnLabel: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 18,
  },
  toolBtnSub: { fontFamily: fonts.ui, fontWeight: "700", fontSize: 11 },
  toastWrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: "80%",
  },
  toastText: {
    fontFamily: fonts.uiExtra,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
});
