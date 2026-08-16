/** Theme presets offered in the styles rail (ported from the old constants). */
export type CmsThemePreset = {
  id: string;
  label: string;
  runtimeTheme: {
    preset: string;
    primary: string;
    neutral: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
    border: string;
    radius: string;
    density: string;
  };
  swatches: string[];
};

export const cmsThemePresets: CmsThemePreset[] = [
  {
    id: "theme.navy_cream",
    label: "Navy & Cream",
    runtimeTheme: {
      preset: "navy_cream",
      primary: "#0c2071",
      neutral: "slate",
      accent: "#8ea2dd",
      background: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
      border: "#e2e4ed",
      radius: "4px",
      density: "spacious",
    },
    swatches: ["#0c2071", "#8ea2dd", "#f5f3ef", "#ffffff"],
  },
  {
    id: "theme.red_charcoal",
    label: "Red & Charcoal",
    runtimeTheme: {
      preset: "red_charcoal",
      primary: "#1c2024",
      neutral: "slate",
      accent: "#e5484d",
      background: "#ffffff",
      text: "#1c2024",
      muted: "#60646c",
      border: "#d9d9e0",
      radius: "4px",
      density: "comfortable",
    },
    swatches: ["#1c2024", "#e5484d", "#f9f9fb", "#ffffff"],
  },
  {
    id: "theme.dark_serif",
    label: "Dark Serif",
    runtimeTheme: {
      preset: "dark_serif",
      primary: "#1a1512",
      neutral: "stone",
      accent: "#c8a97e",
      background: "#faf8f5",
      text: "#1a1512",
      muted: "#6f6a63",
      border: "#e5ddd2",
      radius: "0px",
      density: "spacious",
    },
    swatches: ["#1a1512", "#c8a97e", "#faf8f5", "#ffffff"],
  },
  {
    id: "theme.institutional_mono",
    label: "Institutional Mono",
    runtimeTheme: {
      preset: "institutional_mono",
      primary: "#0f172a",
      neutral: "slate",
      accent: "#3b82f6",
      background: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      radius: "0px",
      density: "comfortable",
    },
    swatches: ["#0f172a", "#3b82f6", "#f8fafc", "#ffffff"],
  },
  {
    id: "theme.green_gold",
    label: "Green & Gold",
    runtimeTheme: {
      preset: "green_gold",
      primary: "#14532d",
      neutral: "green",
      accent: "#ca8a04",
      background: "#ffffff",
      text: "#18211c",
      muted: "#5d6b62",
      border: "#dde5df",
      radius: "6px",
      density: "spacious",
    },
    swatches: ["#14532d", "#ca8a04", "#f0fdf4", "#ffffff"],
  },
  {
    id: "theme.navy_grid",
    label: "Navy Grid",
    runtimeTheme: {
      preset: "navy_grid",
      primary: "#1e3a5f",
      neutral: "slate",
      accent: "#e2a34c",
      background: "#ffffff",
      text: "#12202f",
      muted: "#5b6b7d",
      border: "#d8e0ea",
      radius: "2px",
      density: "comfortable",
    },
    swatches: ["#1e3a5f", "#e2a34c", "#f4f7fa", "#ffffff"],
  },
  {
    id: "theme.timbermill_classic",
    label: "Timbermill Classic",
    runtimeTheme: {
      preset: "timbermill_classic",
      primary: "#3f2f1f",
      neutral: "stone",
      accent: "#8a6d3f",
      background: "#fdfbf7",
      text: "#2a2118",
      muted: "#75695a",
      border: "#e8dfd0",
      radius: "8px",
      density: "spacious",
    },
    swatches: ["#3f2f1f", "#8a6d3f", "#fdfbf7", "#ffffff"],
  },
];

export function themePresetForValue(
  value: string | null | undefined,
): CmsThemePreset | null {
  if (!value) {
    return null;
  }
  const id = value.startsWith("theme.") ? value : `theme.${value}`;
  return (
    cmsThemePresets.find(
      (preset) =>
        preset.id === id ||
        preset.runtimeTheme.preset === value ||
        preset.runtimeTheme.preset === id.replace(/^theme\./, ""),
    ) ?? null
  );
}

export function themeDisplayName(
  theme: { preset?: string | null } | null | undefined,
): string {
  const preset = theme?.preset ?? "";
  return (
    themePresetForValue(preset)?.label ??
    (preset ? preset.replace(/^theme\./, "").replaceAll("_", " ") : "Custom theme")
  );
}
