/**
 * Design tokens extracted from the prototype's spriggle.css.
 * Two themes: "garden" (default warm) and "moonlit" (dark).
 */

/**
 * Font family names. Custom fonts in React Native load as distinct per-weight
 * families (there is no weight synthesis for a single family), so each token
 * maps to a specific loaded weight. These names MUST match the keys registered
 * in the root layout's `useFonts` call. `fontWeight` in styles is redundant
 * once these are used (the family already encodes the weight) but harmless.
 */
export const fonts = {
  display: "Fredoka_700Bold", // headings, wordmark, score, big numbers (weight 700)
  displaySemi: "Fredoka_600SemiBold", // button labels (weight 600)
  ui: "Nunito_700Bold", // body / default UI text (weight 700)
  uiExtra: "Nunito_800ExtraBold", // labels (weight 800)
  uiBlack: "Nunito_900Black", // emphatic caps labels (weight 900)
} as const;

export const radii = {
  xl: 30,
  lg: 22,
  md: 16,
  sm: 11,
  pill: 999,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
} as const;

/** Plant identity colours — constant across themes for learnability. */
export const plantColors = {
  melon: "#f0483c",
  bloom: "#f0b021",
  auber: "#7a3fb8",
  tomato: "#e23b2f",
  pumpkin: "#f2852a",
} as const;

export interface ThemeColors {
  paper: string;
  paper2: string;
  surface: string;
  surfaceLine: string;
  surface2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  primary: string;
  primary700: string;
  primary300: string;
  onPrimary: string;
  accent: string;
  accent700: string;
  onAccent: string;
  gold: string;
  goldDeep: string;
  grass: string;
  grass2: string;
  grassDeep: string;
  soil: string;
  soil2: string;
  soilHole: string;
  soilDeep: string;
  ok: string;
  warn: string;
  err: string;
}

export const gardenTheme: ThemeColors = {
  paper: "#f6efe0",
  paper2: "#efe6d2",
  surface: "#eadfc6",
  surfaceLine: "#dccba6",
  surface2: "#fbf6ea",
  ink: "#3a2f23",
  inkSoft: "#7a6a52",
  inkFaint: "#a89a82",
  primary: "#3c5a3a",
  primary700: "#2f4a2d",
  primary300: "#7a9a5b",
  onPrimary: "#f3ead7",
  accent: "#c8693f",
  accent700: "#a8542f",
  onAccent: "#ffffff",
  gold: "#d9a23c",
  goldDeep: "#b9842a",
  grass: "#6aa64b",
  grass2: "#5b8f3e",
  grassDeep: "#4f8033",
  soil: "#4e3623",
  soil2: "#5a4029",
  soilHole: "#33230f",
  soilDeep: "#241708",
  ok: "#5b8f5b",
  warn: "#d9a23c",
  err: "#c0473a",
};

export const moonlitTheme: ThemeColors = {
  paper: "#1d2236",
  paper2: "#232a42",
  surface: "#2b3350",
  surfaceLine: "#3a4366",
  surface2: "#323b5c",
  ink: "#eaf0ff",
  inkSoft: "#aab4d4",
  inkFaint: "#6f7aa0",
  primary: "#5fd3a3",
  primary700: "#3fae84",
  primary300: "#9fe6c8",
  onPrimary: "#0d2a20",
  accent: "#ff9e57",
  accent700: "#e07d36",
  onAccent: "#2a1605",
  gold: "#ffc94d",
  goldDeep: "#d39a25",
  grass: "#3f6f57",
  grass2: "#345c49",
  grassDeep: "#274738",
  soil: "#2a2238",
  soil2: "#342a45",
  soilHole: "#1a1426",
  soilDeep: "#140f1e",
  ok: "#5fd3a3",
  warn: "#ffc94d",
  err: "#ff6b6b",
};

export type ThemeName = "garden" | "moonlit";

export function getTheme(name: ThemeName): ThemeColors {
  return name === "moonlit" ? moonlitTheme : gardenTheme;
}
