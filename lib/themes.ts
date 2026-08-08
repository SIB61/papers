export const themes = [
  {
    id: "paper",
    name: "Paper",
    light: true,
    swatches: ["#ffffff", "#0c0c0c"],
    description: "Clean white, black ink",
  },
  {
    id: "contrast",
    name: "Contrast",
    light: true,
    swatches: ["#ffffff", "#000000"],
    description: "Pure black & white",
  },
  {
    id: "graphite",
    name: "Graphite",
    light: true,
    swatches: ["#ededed", "#161616"],
    description: "Soft flat greys",
  },
  {
    id: "ivory",
    name: "Ivory",
    light: true,
    swatches: ["#faf7f2", "#17150f"],
    description: "Warm, quiet paper",
  },
  {
    id: "noir",
    name: "Noir",
    light: false,
    swatches: ["#0c0c0c", "#f5f5f5"],
    description: "Flat black",
  },
  {
    id: "ink",
    name: "Ink",
    light: false,
    swatches: ["#0e1013", "#e9ebef"],
    description: "Deep, calm black",
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const defaultTheme: ThemeId = "paper";

export function isThemeId(value: string | undefined | null): value is ThemeId {
  return !!value && themes.some((t) => t.id === value);
}

export function getTheme(id: string): (typeof themes)[number] | undefined {
  return themes.find((t) => t.id === id);
}