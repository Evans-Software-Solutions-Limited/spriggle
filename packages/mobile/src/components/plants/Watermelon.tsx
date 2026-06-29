import React, { useId } from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Path,
  Ellipse,
  G,
} from "react-native-svg";

interface WatermelonProps {
  size?: number;
}

/**
 * Watermelon plant SVG — "Juicy" direction (glossy soft-3D).
 * Differentiated by: wedge silhouette, red-green colour, seed pattern.
 */
export function Watermelon({ size = 100 }: WatermelonProps) {
  const gid = useId().replace(/:/g, "");

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityLabel="Watermelon plant"
    >
      {/* Ground shadow */}
      <Ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity={0.28} />

      <Defs>
        <RadialGradient id={`gWm${gid}`} cx="38%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#ff8a6b" />
          <Stop offset="60%" stopColor="#f2483c" />
          <Stop offset="100%" stopColor="#c92f28" />
        </RadialGradient>
      </Defs>

      {/* Rind layers */}
      <Path d="M14,70 Q50,10 86,70 Z" fill="#1f7a44" />
      <Path d="M22,69 Q50,22 78,69 Z" fill="#7ee08a" />
      <Path d="M28,68 Q50,30 72,68 Z" fill={`url(#gWm${gid})`} />

      {/* Seed pattern */}
      <G fill="#3a2f23">
        <Ellipse cx="44" cy="55" rx="2.4" ry="3.6" />
        <Ellipse cx="56" cy="55" rx="2.4" ry="3.6" />
        <Ellipse cx="50" cy="47" rx="2.4" ry="3.6" />
        <Ellipse cx="38" cy="62" rx="2.4" ry="3.6" />
        <Ellipse cx="62" cy="62" rx="2.4" ry="3.6" />
      </G>

      {/* Gloss highlight */}
      <Path
        d="M34,40 Q50,32 66,40"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        opacity={0.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
