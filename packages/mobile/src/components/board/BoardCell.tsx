import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { PlantIcon } from "../plants";
import type { PlantTypeName } from "../plants";

export interface BoardCellProps {
  /** Plant type occupying this cell, or null for empty. */
  plant: PlantTypeName | null;
  /** Whether this cell is part of a highlighted pre-dig group. */
  highlighted?: boolean;
  /** Whether this cell is selected (for swap). */
  selected?: boolean;
  /** Called when the cell is tapped. */
  onPress?: () => void;
  /** Cell size in points (width = height). */
  size: number;
}

/**
 * A single board cell — pure presenter.
 * Renders either a plant SVG or an empty "dug hole" aesthetic.
 * Matches the prototype's .cell styling.
 */
export function BoardCell({
  plant,
  highlighted = false,
  selected = false,
  onPress,
  size,
}: BoardCellProps) {
  // Bob animation for highlighted cells
  const bobY = useSharedValue(0);

  React.useEffect(() => {
    if (highlighted) {
      bobY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite
        false,
      );
    } else {
      bobY.value = withTiming(0, { duration: 200 });
    }
  }, [highlighted, bobY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  const borderRadius = size * 0.26;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.cell,
          { width: size, height: size, borderRadius },
          plant === null && styles.cellEmpty,
        ]}
        accessibilityRole="button"
        accessibilityLabel={plant ? `${plant} at cell` : "Empty cell"}
      >
        {/* Gold highlight ring — positioned outside cell via negative insets.
            No overflow:hidden on the cell so the glow extends outward. */}
        {highlighted && (
          <View
            style={[styles.highlightRing, { borderRadius: borderRadius + 3 }]}
          />
        )}

        {/* Swap selection ring */}
        {selected && (
          <View
            style={[styles.selectRing, { borderRadius: borderRadius + 2 }]}
          />
        )}

        {/* Plant SVG — clipped to cell bounds via inner wrapper */}
        {plant && (
          <View style={[styles.plantClip, { borderRadius }]}>
            <View style={styles.plantContainer}>
              <PlantIcon type={plant} size={size * 1.08} />
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    justifyContent: "center",
    // No overflow:hidden here — rings extend outside
    backgroundColor: "#33230f",
  },
  cellEmpty: {
    backgroundColor: "#241708",
  },
  // Pre-dig group highlight — matches the prototype's `.cell.hl::after`
  // (spriggle.css): a crisp 3px gold ring plus a wide soft gold glow
  // (box-shadow 0 0 0 3px gold, 0 0 16px 2px gold@70%).
  highlightRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 3,
    borderColor: "#d9a23c", // --gold (garden)
    shadowColor: "#d9a23c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
  },
  // Swap-selection ring — the prototype leaves `.cell.sel` unstyled, so this is
  // a deliberate fill-in using the terracotta accent so a picked cell reads
  // clearly and distinctly from the gold dig highlight.
  selectRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 3,
    borderColor: "#c8693f", // --accent (garden)
    shadowColor: "#c8693f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  plantClip: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  plantContainer: {
    marginTop: "-5%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 4,
  },
});
