import React, { useEffect, useId } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  Ellipse,
  Rect,
  G,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

/**
 * Spriggle mascot — a sprout sprite that picks up different tools. Ported from
 * the prototype's `design-prototype/spriggle/mascot.js` (viewBox 0 0 220 240).
 * The same character reads at 96px (rail) and 210px (hero).
 */
export type MascotPose = "idle" | "dig" | "swap";

export interface MascotProps {
  /** "dig" holds a trowel; "idle" is the same raised-arm silhouette without
   * the trowel; "swap" raises two plants + swap arrows. */
  pose?: MascotPose;
  /** Rendered width in px (height preserves the 220:240 aspect ratio). */
  size?: number;
  /** Gentle continuous idle sway when true (default false = static). */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Shared palette (from mascot.js).
const BODY_TOP = "#9fd36a";
const BODY_BOT = "#6fb33f";
const BODY_EDGE = "#4f8f2c";
const CHEEK = "#e8915a";
const INK = "#2f4a22";

export function Mascot({
  pose = "idle",
  size = 210,
  animated = false,
  style,
}: MascotProps) {
  const gid = useId().replace(/:/g, "");
  // The art (raised right arm + trowel, and the swap-pose flower) spills past
  // the nominal 0–220 body box — to ~x=230 on the right and ~x=31 on the left.
  // In the browser prototype the root <svg> shows that overflow; react-native-svg
  // instead CLIPS to the viewBox, which lopped the arms/tool off ("boxed"). We
  // widen the viewBox to -18..238 so all art fits, keeping the body centred, and
  // scale `width` by the same factor so the character renders at the same size.
  const VIEW_W = 256; // was 220
  const VIEW_H = 240;
  const width = (size * VIEW_W) / 220;
  const height = (size * VIEW_H) / 220;

  // Gentle continuous sway: translateY 0 -> -5 and rotate -1deg -> 1deg, each
  // leg of the loop is a 1700ms-out/1700ms-back withSequence (~3400ms round
  // trip). Hooks are always called (rules of hooks); the withRepeat kickoff
  // is gated in the effect, mirroring BoardCell's pattern.
  const swayY = useSharedValue(0);
  const swayRotate = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      swayY.value = withRepeat(
        withSequence(
          withTiming(-5, {
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      swayRotate.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, {
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      swayY.value = 0;
      swayRotate.value = 0;
    }
  }, [animated, swayY, swayRotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: swayY.value },
      { rotate: `${swayRotate.value}deg` },
    ],
  }));

  const svg = (
    <Svg
      viewBox="-18 0 256 240"
      width={width}
      height={height}
      accessibilityLabel="Spriggle mascot"
    >
      <Defs>
        <LinearGradient id={`mbody${gid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={BODY_TOP} />
          <Stop offset="100%" stopColor={BODY_BOT} />
        </LinearGradient>
      </Defs>

      {/* Sprout on the head */}
      <Path
        d="M110 70 C110 54 108 44 110 36"
        fill="none"
        stroke={BODY_EDGE}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Path
        d="M110 48 C96 44 86 32 90 22 C104 22 116 34 113 48 Z"
        fill={BODY_TOP}
        stroke={BODY_EDGE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M111 44 C124 38 136 40 140 30 C128 22 114 28 110 42 Z"
        fill={BODY_TOP}
        stroke={BODY_EDGE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle
        cx={110}
        cy={30}
        r={5}
        fill="#e8c33a"
        stroke={BODY_EDGE}
        strokeWidth={2.5}
      />

      {/* Feet */}
      <Ellipse
        cx={92}
        cy={202}
        rx={13}
        ry={9}
        fill={BODY_BOT}
        stroke={BODY_EDGE}
        strokeWidth={3}
      />
      <Ellipse
        cx={128}
        cy={202}
        rx={13}
        ry={9}
        fill={BODY_BOT}
        stroke={BODY_EDGE}
        strokeWidth={3}
      />

      {/* Body */}
      <Path
        d="M110 70
      C 154 70 174 104 174 142
      C 174 184 146 204 110 204
      C 74 204 46 184 46 142
      C 46 104 66 70 110 70 Z"
        fill={`url(#mbody${gid})`}
        stroke={BODY_EDGE}
        strokeWidth={4}
      />
      <Path
        d="M70 120 C 62 150 70 178 92 190"
        fill="none"
        stroke="#bde08a"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Face */}
      <Circle cx={93} cy={138} r={9.5} fill={INK} />
      <Circle cx={129} cy={138} r={9.5} fill={INK} />
      <Circle cx={96} cy={135} r={3} fill="#fff" />
      <Circle cx={132} cy={135} r={3} fill="#fff" />
      <Path
        d="M101 158 Q111 168 121 158"
        fill="none"
        stroke={INK}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Ellipse cx={78} cy={156} rx={8} ry={5.5} fill={CHEEK} opacity={0.55} />
      <Ellipse cx={144} cy={156} rx={8} ry={5.5} fill={CHEEK} opacity={0.55} />

      {/* Left arm (resting) */}
      <Path
        d="M58 150 C 44 158 40 172 46 184"
        fill="none"
        stroke={BODY_BOT}
        strokeWidth={11}
        strokeLinecap="round"
      />

      {pose === "swap" ? (
        <>
          {/* Both arms raised */}
          <Path
            d="M150 138 C 166 130 176 138 176 152"
            fill="none"
            stroke={BODY_BOT}
            strokeWidth={11}
            strokeLinecap="round"
          />
          <Path
            d="M70 138 C 54 130 44 138 44 152"
            fill="none"
            stroke={BODY_BOT}
            strokeWidth={11}
            strokeLinecap="round"
          />
          {/* Flower in the left hand */}
          <G transform="translate(32,128)">
            <Circle cx={12} cy={16} r={13} fill="#e23b2f" />
            <Circle
              cx={12}
              cy={16}
              r={13}
              fill="none"
              stroke={INK}
              strokeWidth={2.5}
            />
            <Path d="M12 5 l3 -5 l2 5 l5 -2 l-3 5 Z" fill="#3fa047" />
            <Ellipse
              cx={8}
              cy={12}
              rx={3.6}
              ry={2.8}
              fill="#fff"
              opacity={0.5}
            />
          </G>
          {/* Bud in the right hand */}
          <G transform="translate(152,128)">
            <Path
              d="M11 4 C2 4 0 24 11 30 C22 24 20 4 11 4 Z"
              fill="#7a3fb8"
              stroke={INK}
              strokeWidth={2.5}
            />
            <Path d="M11 6 C6 1 16 0 18 4 C14 5 13 8 12 10 Z" fill="#46a04a" />
          </G>
          {/* Swap arrows */}
          <G stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round">
            <Path d="M88 104 C 100 96 120 96 132 104" />
            <Path d="M132 104 l-6 -6 M132 104 l-1 -8" />
            <Path d="M132 120 C 120 128 100 128 88 120" />
            <Path d="M88 120 l6 6 M88 120 l1 8" />
          </G>
        </>
      ) : (
        <>
          {/* Dig / idle: right arm raised (shared silhouette) */}
          <Path
            d="M158 138 C 178 130 192 138 196 156"
            fill="none"
            stroke={BODY_BOT}
            strokeWidth={11}
            strokeLinecap="round"
          />
          {/* Trowel — only for "dig", not "idle" */}
          {pose === "dig" && (
            <G transform="rotate(28 196 150)">
              <Rect
                x={188}
                y={92}
                width={16}
                height={44}
                rx={8}
                fill="#c8693f"
                stroke={INK}
                strokeWidth={2.5}
              />
              <Rect
                x={186}
                y={130}
                width={20}
                height={10}
                rx={3}
                fill="#b6bcc2"
                stroke={INK}
                strokeWidth={2.5}
              />
              <Path
                d="M178 140 C 178 176 214 176 214 140 C 214 150 206 158 196 158 C 186 158 178 150 178 140 Z"
                fill="#cfd5db"
                stroke={INK}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              <Path
                d="M186 144 C 188 156 204 156 206 144"
                fill="none"
                stroke="#9aa1a8"
                strokeWidth={2}
              />
            </G>
          )}
        </>
      )}
    </Svg>
  );

  if (!animated) {
    return <View style={style}>{svg}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{svg}</Animated.View>;
}
