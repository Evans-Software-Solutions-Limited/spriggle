import React, { useId } from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Path,
  Ellipse,
} from "react-native-svg";

interface PumpkinProps {
  size?: number;
}

/**
 * Pumpkin plant SVG — "Juicy" direction (glossy soft-3D).
 * Differentiated by: tri-lobe silhouette, orange colour, vine/segment pattern.
 */
export function Pumpkin({ size = 100 }: PumpkinProps) {
  const gid = useId().replace(/:/g, "");

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityLabel="Pumpkin plant"
    >
      {/* Ground shadow */}
      <Ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity={0.28} />

      <Defs>
        <RadialGradient id={`gPk${gid}`} cx="40%" cy="32%" r="80%">
          <Stop offset="0%" stopColor="#ffb35c" />
          <Stop offset="60%" stopColor="#f2852a" />
          <Stop offset="100%" stopColor="#cc5f18" />
        </RadialGradient>
      </Defs>

      {/* Three lobes */}
      <Ellipse cx="32" cy="61" rx="18" ry="24" fill={`url(#gPk${gid})`} />
      <Ellipse cx="68" cy="61" rx="18" ry="24" fill={`url(#gPk${gid})`} />
      <Ellipse cx="50" cy="61" rx="27" ry="27" fill={`url(#gPk${gid})`} />

      {/* Segment lines */}
      <Path
        d="M40,42 C36,54 36,68 40,80 M60,42 C64,54 64,68 60,80"
        fill="none"
        stroke="#c25e16"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Vine stem */}
      <Path
        d="M50,37 C49,28 54,24 58,23"
        fill="none"
        stroke="#4e7a2e"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Gloss highlight */}
      <Ellipse
        cx="42"
        cy="48"
        rx="7"
        ry="10"
        fill="#fff"
        opacity={0.35}
        transform="rotate(-15 42 48)"
      />
    </Svg>
  );
}
