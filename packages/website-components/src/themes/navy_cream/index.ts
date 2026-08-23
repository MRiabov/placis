import type { PublicSiteThemePreset } from "../types";

export const navyCreamThemePreset = {
  id: "theme.navy_cream",
  label: "Navy & Cream",
  source: "bongagift/bellfield-site styles.css",
  cssClass: "public-theme-navy-cream",
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
  colors: {
    brand: "#0c2071",
    brandMuted: "#354786",
    accent: "#8ea2dd",
    background: "#ffffff",
    surface: "#f5f3ef",
    text: "#111827",
    mutedText: "#6b7280",
    border: "#e2e4ed",
  },
  typography: {
    headingFamily: '"Libre Baskerville", Georgia, serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    labelTracking: "0.28em",
    headingWeight: 400,
    bodyWeight: 400,
  },
  spacing: {
    sectionBlock: "76px",
    containerInline: "32px",
    radius: "4px",
  },
  motion: {
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    revealDuration: "700ms",
    hoverDuration: "200ms",
  },
  notes: [
    "Navy, muted blue, and cream palette extracted from the source reference site.",
    "Serif display headings and uppercase tracked labels are part of the style, not the component structure.",
    "Use as a reference fixture theme, not as the default for every business website.",
  ],
} satisfies PublicSiteThemePreset;
