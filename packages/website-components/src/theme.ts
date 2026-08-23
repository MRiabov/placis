import type { PublicSiteTheme, ThemeStyle } from "./types";

const colorPresets: Record<
  string,
  Pick<
    Required<PublicSiteTheme>,
    "accent" | "background" | "border" | "muted" | "primary" | "text"
  >
> = {
  blue: {
    accent: "#0369a1",
    background: "#f8fafc",
    border: "#cbd5e1",
    muted: "#475569",
    primary: "#0f766e",
    text: "#0f172a",
  },
  emerald: {
    accent: "#047857",
    background: "#f7faf8",
    border: "#cbd5d1",
    muted: "#4b6358",
    primary: "#047857",
    text: "#10231b",
  },
  slate: {
    accent: "#2563eb",
    background: "#f8fafc",
    border: "#cbd5e1",
    muted: "#475569",
    primary: "#334155",
    text: "#0f172a",
  },
  navy_cream: {
    accent: "#8ea2dd",
    background: "#ffffff",
    border: "#e2e4ed",
    muted: "#6b7280",
    primary: "#0c2071",
    text: "#111827",
  },
  dark_serif: {
    accent: "#ff5a4f",
    background: "#ffffff",
    border: "#e3e0d7",
    muted: "#706f6c",
    primary: "#1c2024",
    text: "#1c2024",
  },
  timbermill_classic: {
    accent: "#ff5a14",
    background: "#ffffff",
    border: "#e8e4d8",
    muted: "#6f756b",
    primary: "#b9ad7b",
    text: "#586653",
  },
  red_charcoal: {
    accent: "#e5484d",
    background: "#ffffff",
    border: "#d9d9e0",
    muted: "#60646c",
    primary: "#0d74ce",
    text: "#1c2024",
  },
  green_gold: {
    accent: "#f5d90a",
    background: "#ffffff",
    border: "#d9d9e0",
    muted: "#60646c",
    primary: "#082b21",
    text: "#1c2024",
  },
  institutional_mono: {
    accent: "#191919",
    background: "#ffffff",
    border: "#d6d6d6",
    muted: "#666666",
    primary: "#191919",
    text: "#2b2b2b",
  },
  navy_grid: {
    accent: "#cb1d4a",
    background: "#f6f7f9",
    border: "#b7c9e2",
    muted: "#526780",
    primary: "#00254d",
    text: "#00254d",
  },
};

export function normalizeTheme(
  theme: PublicSiteTheme | string | undefined,
): PublicSiteTheme {
  const presetName = typeof theme === "string" ? theme : theme?.preset;
  const presetKey = String(presetName ?? "emerald").replace(/^theme\./, "");
  const preset = colorPresets[presetKey] ?? colorPresets.emerald;
  return {
    preset: presetName ?? "field_service_clean",
    primary:
      typeof theme === "object"
        ? (theme.primary ?? preset.primary)
        : preset.primary,
    neutral: typeof theme === "object" ? (theme.neutral ?? "slate") : "slate",
    accent:
      typeof theme === "object"
        ? (theme.accent ?? preset.accent)
        : preset.accent,
    background:
      typeof theme === "object"
        ? (theme.background ?? preset.background)
        : preset.background,
    border:
      typeof theme === "object"
        ? (theme.border ?? preset.border)
        : preset.border,
    muted:
      typeof theme === "object" ? (theme.muted ?? preset.muted) : preset.muted,
    text: typeof theme === "object" ? (theme.text ?? preset.text) : preset.text,
    radius: typeof theme === "object" ? (theme.radius ?? "8px") : "8px",
    density:
      typeof theme === "object"
        ? (theme.density ?? "comfortable")
        : "comfortable",
  };
}

export function themeStyle(theme: PublicSiteTheme): ThemeStyle {
  return {
    "--public-accent": theme.accent ?? "#047857",
    "--public-background": theme.background ?? "#f8fafc",
    "--public-border": theme.border ?? "#cbd5e1",
    "--public-muted": theme.muted ?? "#475569",
    "--public-primary": theme.primary ?? "#047857",
    "--public-radius": theme.radius ?? "8px",
    "--public-text": theme.text ?? "#0f172a",
  };
}

export function themeClassName(theme: PublicSiteTheme): string {
  const preset = theme.preset?.replace(/^theme\./, "").replace(/_/g, "-");
  return preset ? `public-theme-${preset}` : "";
}

export function sectionPadding(theme: PublicSiteTheme): string {
  if (theme.density === "compact") {
    return "px-4 py-10 sm:px-6 lg:px-8";
  }
  if (theme.density === "spacious") {
    return "px-4 py-20 sm:px-6 lg:px-8";
  }
  return "px-4 py-14 sm:px-6 lg:px-8";
}
