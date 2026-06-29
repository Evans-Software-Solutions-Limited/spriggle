import React from "react";
import { View } from "react-native";

// Mock SVG components to render as View elements with props forwarded.
// This allows accessibility testing without native SVG rendering.

function createMockComponent(name: string) {
  const MockComponent = (props: Record<string, unknown>) => {
    const { children, ...rest } = props;
    return (
      <View {...rest} testID={name}>
        {children as React.ReactNode}
      </View>
    );
  };
  MockComponent.displayName = name;
  return MockComponent;
}

const Svg = (props: Record<string, unknown>) => {
  const { children, accessibilityLabel, ...rest } = props;
  return (
    <View accessibilityLabel={accessibilityLabel as string} {...rest}>
      {children as React.ReactNode}
    </View>
  );
};
Svg.displayName = "Svg";

export default Svg;
export const Defs = createMockComponent("Defs");
export const RadialGradient = createMockComponent("RadialGradient");
export const LinearGradient = createMockComponent("LinearGradient");
export const Stop = createMockComponent("Stop");
export const Path = createMockComponent("Path");
export const Ellipse = createMockComponent("Ellipse");
export const Circle = createMockComponent("Circle");
export const Rect = createMockComponent("Rect");
export const G = createMockComponent("G");
export const Line = createMockComponent("Line");
export const Text = createMockComponent("Text");
export const Pattern = createMockComponent("Pattern");
