import React from "react";
import { render } from "@testing-library/react-native";
import { Mascot } from "../Mascot";

/**
 * Guards the "boxed mascot" fix: the raised arm + trowel art spills past the
 * 0–220 body box, so the SVG viewBox must be widened (and `width` scaled to
 * match) or react-native-svg clips the sides. See Mascot.tsx.
 */
describe("Mascot", () => {
  it("uses a widened viewBox so the arms/tool are not clipped", () => {
    const { getByLabelText } = render(<Mascot pose="dig" size={220} />);
    const svg = getByLabelText("Spriggle mascot");
    // viewBox spans -18..238 horizontally (contains art out to ~x=230).
    expect(svg.props.viewBox).toBe("-18 0 256 240");
    // width is scaled by 256/220 so the body still renders at `size` scale.
    expect(svg.props.width).toBe(256); // 220 * 256 / 220
    expect(svg.props.height).toBe(240); // 220 * 240 / 220
  });

  it("renders each pose without error", () => {
    for (const pose of ["idle", "dig", "swap"] as const) {
      const { getByLabelText } = render(<Mascot pose={pose} size={96} />);
      expect(getByLabelText("Spriggle mascot")).toBeTruthy();
    }
  });
});
