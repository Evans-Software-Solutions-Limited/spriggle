import React from "react";
import { Watermelon } from "./Watermelon";
import { Flower } from "./Flower";
import { Aubergine } from "./Aubergine";
import { Tomato } from "./Tomato";
import { Pumpkin } from "./Pumpkin";

/** Matches PlantType from @spriggle/engine — kept local to avoid coupling presenters to engine. */
export type PlantTypeName =
  | "watermelon"
  | "flower"
  | "aubergine"
  | "tomato"
  | "pumpkin";

interface PlantIconProps {
  type: PlantTypeName;
  size?: number;
}

/**
 * Renders the correct plant SVG for a given PlantType.
 * Pure presenter — no state, no side effects.
 */
export function PlantIcon({ type, size = 100 }: PlantIconProps) {
  switch (type) {
    case "watermelon":
      return <Watermelon size={size} />;
    case "flower":
      return <Flower size={size} />;
    case "aubergine":
      return <Aubergine size={size} />;
    case "tomato":
      return <Tomato size={size} />;
    case "pumpkin":
      return <Pumpkin size={size} />;
  }
}
