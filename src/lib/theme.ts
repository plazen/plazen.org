export type Theme = "dark" | "light" | "system";

export const themes = {
  dark: {
    name: "Dark",
    value: "dark",
  },
  light: {
    name: "Light",
    value: "light",
  },
  system: {
    name: "System",
    value: "system",
  },
} as const;

export const themeList = Object.values(themes);
