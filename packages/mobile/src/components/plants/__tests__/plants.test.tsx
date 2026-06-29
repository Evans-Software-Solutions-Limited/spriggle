import React from "react";
import { render } from "@testing-library/react-native";
import { Watermelon } from "../Watermelon";
import { Flower } from "../Flower";
import { Aubergine } from "../Aubergine";
import { Tomato } from "../Tomato";
import { Pumpkin } from "../Pumpkin";
import { PlantIcon } from "../PlantIcon";
import type { PlantTypeName } from "../PlantIcon";

/**
 * Validates: Requirements 8.3
 * Each plant SVG must include an accessible label identifying the plant type.
 */
describe("Plant SVG accessibility labels", () => {
  it("Watermelon has correct accessibility label", () => {
    const { getByLabelText } = render(<Watermelon />);
    expect(getByLabelText("Watermelon plant")).toBeTruthy();
  });

  it("Flower has correct accessibility label", () => {
    const { getByLabelText } = render(<Flower />);
    expect(getByLabelText("Flower plant")).toBeTruthy();
  });

  it("Aubergine has correct accessibility label", () => {
    const { getByLabelText } = render(<Aubergine />);
    expect(getByLabelText("Aubergine plant")).toBeTruthy();
  });

  it("Tomato has correct accessibility label", () => {
    const { getByLabelText } = render(<Tomato />);
    expect(getByLabelText("Tomato plant")).toBeTruthy();
  });

  it("Pumpkin has correct accessibility label", () => {
    const { getByLabelText } = render(<Pumpkin />);
    expect(getByLabelText("Pumpkin plant")).toBeTruthy();
  });
});

describe("PlantIcon renders correct component for each type", () => {
  it("renders Watermelon for type 'watermelon'", () => {
    const { getByLabelText } = render(<PlantIcon type="watermelon" />);
    expect(getByLabelText("Watermelon plant")).toBeTruthy();
  });

  it("renders Flower for type 'flower'", () => {
    const { getByLabelText } = render(<PlantIcon type="flower" />);
    expect(getByLabelText("Flower plant")).toBeTruthy();
  });

  it("renders Aubergine for type 'aubergine'", () => {
    const { getByLabelText } = render(<PlantIcon type="aubergine" />);
    expect(getByLabelText("Aubergine plant")).toBeTruthy();
  });

  it("renders Tomato for type 'tomato'", () => {
    const { getByLabelText } = render(<PlantIcon type="tomato" />);
    expect(getByLabelText("Tomato plant")).toBeTruthy();
  });

  it("renders Pumpkin for type 'pumpkin'", () => {
    const { getByLabelText } = render(<PlantIcon type="pumpkin" />);
    expect(getByLabelText("Pumpkin plant")).toBeTruthy();
  });
});

describe("Plant components accept size prop", () => {
  it("renders with custom size", () => {
    const { getByLabelText } = render(<Watermelon size={50} />);
    expect(getByLabelText("Watermelon plant")).toBeTruthy();
  });

  it("renders with default size when not specified", () => {
    const { getByLabelText } = render(<Flower />);
    expect(getByLabelText("Flower plant")).toBeTruthy();
  });
});
