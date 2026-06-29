import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface ScorePopupProps {
  /** Score value to display (e.g. "+30"). */
  score: number;
  /** Position (x, y) in the board coordinate space. */
  x: number;
  y: number;
  /** Whether this was a large dig (7+ plants) — shows bigger + emoji. */
  isBig?: boolean;
  /** Called when the animation completes (to unmount the popup). */
  onComplete?: () => void;
}

/**
 * Floating score popup — appears at the centroid of a dug group,
 * floats upward and fades out over ~1s.
 * Matches the prototype's floatScore() behaviour.
 */
export function ScorePopup({
  score,
  x,
  y,
  isBig = false,
  onComplete,
}: ScorePopupProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // Pop in
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.back(1.5)),
    });
    // Float upward
    translateY.value = withTiming(-60, {
      duration: 900,
      easing: Easing.out(Easing.ease),
    });
    // Fade out after delay
    opacity.value = withTiming(0, { duration: 900 }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [translateY, opacity, scale, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { left: x, top: y }, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.bubble}>
        <Text style={[styles.scoreText, isBig && styles.scoreTextBig]}>
          +{score}
        </Text>
        {isBig && <Text style={styles.star}> 🌟</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9,
    alignItems: "center",
    transform: [{ translateX: -50 }], // center horizontally
  },
  bubble: {
    backgroundColor: "#3a2f23",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    // Pop shadow
    shadowColor: "rgba(40,30,12,1)",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
  },
  scoreText: {
    fontFamily: "Fredoka",
    fontWeight: "700",
    fontSize: 20,
    color: "#d9a23c",
    lineHeight: 24,
  },
  scoreTextBig: {
    fontSize: 24,
  },
  star: {
    fontSize: 18,
  },
});
