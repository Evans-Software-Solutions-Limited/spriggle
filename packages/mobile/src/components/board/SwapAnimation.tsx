import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { StyleSheet, View } from "react-native";
import { PlantIcon } from "../plants";
import type { PlantTypeName } from "../plants";

interface SwapAnimationProps {
  /** Plant type moving FROM position A to position B. */
  plantA: PlantTypeName;
  /** Plant type moving FROM position B to position A. */
  plantB: PlantTypeName;
  /** Size of each cell in points. */
  cellSize: number;
  /** Pixel offset between the two cells (signed: positive = B is right/below A). */
  offsetX: number;
  offsetY: number;
  /** Called when the swap animation completes. */
  onComplete?: () => void;
}

/**
 * Animates two plants sliding to each other's positions simultaneously.
 * Overlay component rendered on top of the board during a swap.
 * Duration matches prototype: quick slide (~250ms).
 */
export function SwapAnimation({
  plantA,
  plantB,
  cellSize,
  offsetX,
  offsetY,
  onComplete,
}: SwapAnimationProps) {
  const progressA = useSharedValue(0);
  const progressB = useSharedValue(0);

  useEffect(() => {
    // Plant A slides to B's position
    progressA.value = withTiming(1, {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    });
    // Plant B slides to A's position
    progressB.value = withTiming(1, {
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [progressA, progressB, onComplete]);

  const styleA = useAnimatedStyle(() => ({
    transform: [
      { translateX: progressA.value * offsetX },
      { translateY: progressA.value * offsetY },
    ],
  }));

  const styleB = useAnimatedStyle(() => ({
    transform: [
      { translateX: progressB.value * -offsetX },
      { translateY: progressB.value * -offsetY },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.plant, styleA]}>
        <PlantIcon type={plantA} size={cellSize * 1.08} />
      </Animated.View>
      <Animated.View style={[styles.plant, styleB]}>
        <PlantIcon type={plantB} size={cellSize * 1.08} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  plant: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 4,
  },
});
