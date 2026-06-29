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

/** Simple BFS group finder for the interaction hook. */
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

export default function GameScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [board] = useState<BoardData>(generateMockBoard);
  const [score] = useState(0);

  const interaction = useGameInteraction(board, findConnectedGroup, {
    onDig: () => {},
    onSwap: () => {},
    onInvalidAction: () => {},
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <View style={styles.boardCol}>
        <GameBoard
          board={board}
          highlightedCells={interaction.highlightedCells}
          selectedCell={interaction.selectedCell}
          onCellPress={interaction.handleCellPress}
        />
      </View>

      <View style={styles.rail}>
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
        </View>

        <View
          style={[
            styles.toolMod,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceLine,
            },
          ]}
        >
          <Text style={[styles.speechText, { color: colors.ink }]}>
            {interaction.tool === "dig"
              ? "Dig a patch of 5 or more!"
              : "Swap two to build a bigger patch."}
          </Text>

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
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: "row", gap: 26, padding: 16 },
  boardCol: { flex: 0.6, alignItems: "center", justifyContent: "center" },
  rail: { flex: 0.4, paddingVertical: spacing.s4, gap: 14 },
  railTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  railBrand: { fontFamily: fonts.display, fontWeight: "700", fontSize: 30 },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCard: { borderRadius: radii.md, borderWidth: 2, padding: spacing.s4 },
  scoreLabel: {
    fontFamily: fonts.ui,
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 42,
    lineHeight: 48,
  },
  toolMod: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s4,
    gap: 12,
    justifyContent: "space-between",
  },
  speechText: { fontFamily: fonts.ui, fontWeight: "700", fontSize: 15 },
  selector: { flexDirection: "row", gap: 10 },
  toolBtn: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.s3,
    alignItems: "center",
  },
  toolBtnLabel: { fontFamily: fonts.display, fontWeight: "700", fontSize: 18 },
});
