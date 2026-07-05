import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, fonts, radii, spacing } from "../src/theme";
import { GameBoard } from "../src/components/board";
import type { BoardData } from "../src/components/board";
import { useGameInteraction } from "../src/hooks/useGameInteraction";
import type { PlantTypeName } from "../src/components/plants";

const PLANT_TYPES: PlantTypeName[] = [
  "watermelon",
  "flower",
  "aubergine",
  "tomato",
  "pumpkin",
];

/** Generate a mock board for display (real engine wiring is a later task). */
function generateMockBoard(): BoardData {
  const board: BoardData = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  // Spawn 10 random plants (matching engine init)
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

/** Simple BFS group finder for the interaction hook (mirrors engine logic). */
function findConnectedGroup(
  board: (PlantTypeName | null)[][],
  row: number,
  col: number,
): { row: number; col: number }[] {
  const type = board[row]?.[col];
  if (!type) return [];
  const seen = new Set<string>();
  const stack = [{ row, col }];
  const result: { row: number; col: number }[] = [];
  while (stack.length) {
    const p = stack.pop()!;
    const key = `${p.row}-${p.col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (board[p.row]?.[p.col] !== type) continue;
    result.push(p);
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = p.row + dr;
      const nc = p.col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        stack.push({ row: nr, col: nc });
      }
    }
  }
  return result;
}

/**
 * Game screen — container.
 * Landscape two-panel: board-col (left ~60%) + rail (right ~40%).
 * Matches prototype's Screens.game layout.
 */
export default function GameScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [board] = useState<BoardData>(generateMockBoard);
  const [score] = useState(0);

  const interaction = useGameInteraction(board, findConnectedGroup, {
    onDig: () => {
      /* Engine wiring in later task */
    },
    onSwap: () => {
      /* Engine wiring in later task */
    },
    onInvalidAction: () => {
      /* Shake animation in later task */
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: "row", gap: 26 },
  boardCol: {
    flex: 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
  rail: {
    flex: 0.4,
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
    fontFamily: fonts.ui,
    fontWeight: "800",
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
  bestLabel: { fontFamily: fonts.ui, fontWeight: "800", fontSize: 12 },
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
  pillText: { fontFamily: fonts.ui, fontWeight: "800", fontSize: 12 },
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
});
