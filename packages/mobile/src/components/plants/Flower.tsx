import React from "react";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
  Circle,
} from "react-native-svg";

interface FlowerProps {
  size?: number;
}

/**
 * Flower plant SVG — "Juicy" direction (glossy soft-3D).
 * Differentiated by: radial petal silhouette, golden-yellow colour, centre dot pattern.
 */
export function Flower({ size = 100 }: FlowerProps) {
  // 7 petals evenly distributed
  const petals = Array.from({ length: 7 }, (_, i) => {
    const angle = i * (360 / 7);
    return (
      <Ellipse
        key={i}
        cx="50"
        cy="27"
        rx="9"
        ry="16"
        fill="url(#jgFlower)"
        transform={`rotate(${angle} 50 50)`}
      />
    );
  });

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityLabel="Flower plant"
    >
      {/* Ground shadow */}
      <Ellipse cx="50" cy="88" rx="24" ry="5" fill="#000" opacity={0.28} />

      <Defs>
        <RadialGradient id="jgFlower" cx="40%" cy="32%" r="75%">
          <Stop offset="0%" stopColor="#ffe08a" />
          <Stop offset="70%" stopColor="#ffc23d" />
          <Stop offset="100%" stopColor="#e89412" />
        </RadialGradient>
      </Defs>

      {/* Petals */}
      {petals}

      {/* Centre */}
      <Circle cx="50" cy="50" r="13" fill="#8a4a1e" />
      <Circle cx="46" cy="46" r="5" fill="#a55f2a" />

      {/* Gloss highlight */}
      <Ellipse
        cx="40"
        cy="34"
        rx="14"
        ry="9"
        fill="#ffffff"
        opacity={0.45}
        transform="rotate(-25 40 34)"
      />
    </Svg>
  );
}
