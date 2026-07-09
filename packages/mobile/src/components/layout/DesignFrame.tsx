import React, { createContext, useContext } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";

/**
 * The prototype is authored on a fixed 1194×834 landscape canvas (iPad 11")
 * and scaled uniformly to fit the viewport (`transform: scale(s)` in the
 * prototype's `fit()`), rather than reflowing responsively. We mirror that
 * exactly: every screen is laid out at these design coordinates and the whole
 * frame is scaled by `min(availW/1194, availH/834)`, centred, with the paper
 * colour filling any letterbox. This makes the app fit every iPad size (Mini
 * → Pro 12.9") from a single layout, and keeps proportions identical to the
 * design instead of the previous window-relative maths that overflowed.
 */
export const DESIGN_WIDTH = 1194;
export const DESIGN_HEIGHT = 834;

interface FrameSize {
  width: number;
  height: number;
}

/**
 * Design-space dimensions available to screen content. Defaults to the full
 * design canvas so components (and unit tests) that render outside a
 * DesignFrame still get sensible, deterministic sizing.
 */
const FrameSizeContext = createContext<FrameSize>({
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
});

export function useFrameSize(): FrameSize {
  return useContext(FrameSizeContext);
}

export interface DesignFrameProps {
  children: React.ReactNode;
}

export function DesignFrame({ children }: DesignFrameProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Fit the design canvas into the safe viewport.
  const availableWidth = Math.max(1, windowWidth - insets.left - insets.right);
  const availableHeight = Math.max(
    1,
    windowHeight - insets.top - insets.bottom,
  );
  const scale = Math.min(
    availableWidth / DESIGN_WIDTH,
    availableHeight / DESIGN_HEIGHT,
  );

  return (
    <View style={[styles.letterbox, { backgroundColor: colors.paper }]}>
      {/* Layout happens at the unscaled design size; the transform scales the
          whole tree around its centre (touch hit-testing is post-transform, so
          taps still land correctly). */}
      <View
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: [{ scale }],
        }}
      >
        <FrameSizeContext.Provider
          value={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
        >
          {children}
        </FrameSizeContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  letterbox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
