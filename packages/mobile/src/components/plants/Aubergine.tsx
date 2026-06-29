import React from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Path,
  Ellipse,
} from "react-native-svg";

interface AubergineProps {
  size?: number;
}

/**
 * Aubergine plant SVG — "Juicy" direction (glossy soft-3D).
 * Differentiated by: teardrop silhouette, purple colour, gloss/stem pattern.
 */
export function Aubergine({ size = 100 }: AubergineProps) {
  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityLabel="Aubergine plant"
    >
      {/* Ground shadow */}
      <Ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity={0.28} />

      <Defs>
        <RadialGradient id="jgAubergine" cx="38%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#b07ee0" />
          <Stop offset="55%" stopColor="#7a3fb8" />
          <Stop offset="100%" stopColor="#4e2380" />
        </RadialGradient>
      </Defs>

      {/* Body */}
      <Path
        d="M64,34 C50,26 31,40 31,60 C31,79 47,88 60,83 C75,77 77,56 72,44 C70,38 68,37 64,34 Z"
        fill="url(#jgAubergine)"
      />

      {/* Leaf cap */}
      <Path
        d="M66,30 C59,22 49,22 44,29 C51,31 54,36 54,41 C61,39 66,36 68,31 Z"
        fill="#46a04a"
      />

      {/* Stem */}
      <Path
        d="M58,30 L63,20"
        stroke="#2f7a33"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Gloss highlight */}
      <Ellipse
        cx="44"
        cy="42"
        rx="8"
        ry="14"
        fill="#fff"
        opacity={0.35}
        transform="rotate(-20 44 42)"
      />
    </Svg>
  );
}
