import React, { useEffect, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { BoardCell } from "./BoardCell";
import type { BoardCellProps } from "./BoardCell";

export type CellAnimationState =
  | "idle"
  | "clearing" // dig removal: shrink + fade
  | "spawning" // refill: grow in
  | "shaking"; // invalid action feedback

interface AnimatedCellProps extends BoardCellProps {
  /** Current animation state for this cell. */
  animationState?: CellAnimationState;
  /** Stagger delay in ms (for spawning multiple cells sequentially). */
  staggerDelay?: number;
  /** Called when the animation completes. Must be stable (useCallback). */
  onAnimationEnd?: () => void;
}

/**
 * Wraps BoardCell with Reanimated animations for dig/spawn/shake.
 * Pure presenter — animation state is driven by props from the container.
 */
export function AnimatedCell({
  animationState = "idle",
  staggerDelay = 0,
  onAnimationEnd,
  ...cellProps
}: AnimatedCellProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  // Stable ref for the callback to avoid re-triggering the effect
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  useEffect(() => {
    const fireEnd = () => onEndRef.current?.();

    switch (animationState) {
      case "clearing":
        scale.value = withTiming(0, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(fireEnd)();
        });
        break;

      case "spawning":
        scale.value = 0;
        opacity.value = 0;
        scale.value = withDelay(
          staggerDelay,
          withSpring(1, { damping: 12, stiffness: 180 }),
        );
        opacity.value = withDelay(
          staggerDelay,
          withTiming(1, { duration: 200 }, (finished) => {
            if (finished) runOnJS(fireEnd)();
          }),
        );
        break;

      case "shaking":
        translateX.value = withSequence(
          withTiming(-4, { duration: 60 }),
          withTiming(4, { duration: 60 }),
          withTiming(-3, { duration: 60 }),
          withTiming(3, { duration: 60 }),
          withTiming(-2, { duration: 60 }),
          withTiming(0, { duration: 60 }, (finished) => {
            if (finished) runOnJS(fireEnd)();
          }),
        );
        break;

      case "idle":
      default:
        scale.value = withTiming(1, { duration: 150 });
        opacity.value = withTiming(1, { duration: 150 });
        translateX.value = withTiming(0, { duration: 150 });
        break;
    }
  }, [animationState, staggerDelay, scale, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <BoardCell {...cellProps} />
    </Animated.View>
  );
}
