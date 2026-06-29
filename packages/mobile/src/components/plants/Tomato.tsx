import React, { useId } from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Path,
  Ellipse,
} from "react-native-svg";

interface TomatoProps {
  size?: number;
}

/**
 * Tomato plant SVG — "Juicy" direction (glossy soft-3D).
 * Differentiated by: round silhouette, red colour, star-leaf pattern on top.
 */
export function Tomato({ size = 100 }: TomatoProps) {
  const gid = useId().replace(/:/g, "");

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityLabel="Tomato plant"
    >
      {/* Ground shadow */}
      <Ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity={0.28} />

      <Defs>
        <RadialGradient id={`gTo${gid}`} cx="38%" cy="30%" r="78%">
          <Stop offset="0%" stopColor="#ff8a5c" />
          <Stop offset="55%" stopColor="#f0392f" />
          <Stop offset="100%" stopColor="#c4241c" />
        </RadialGradient>
      </Defs>

      {/* Body */}
      <Ellipse cx="50" cy="59" rx="31" ry="28" fill={`url(#gTo${gid})`} />

      {/* Star leaf on top */}
      <Path
        d="M50,35 l6,-7 l3,7 l8,-3 l-5,8 l8,2 l-8,4 q-6,-7 -12,-7 q-6,0 -12,7 l-8,-4 l8,-2 l-5,-8 l8,3 l3,-7 Z"
        fill="#3fa047"
      />

      {/* Gloss highlight */}
      <Ellipse
        cx="40"
        cy="46"
        rx="9"
        ry="6"
        fill="#fff"
        opacity={0.5}
        transform="rotate(-22 40 46)"
      />
    </Svg>
  );
}
