import type { PublicSiteThemePreset } from "../types";

export const timbermillClassicThemePreset = {
  id: "theme.timbermill_classic",
  label: "Timbermill Classic",
  source: "https://timbermillconstruction.ie/",
  cssClass: "public-theme-timbermill-classic",
  runtimeTheme: {
    preset: "timbermill_classic",
    primary: "#b9ad7b",
    neutral: "warm",
    accent: "#ff5a14",
    background: "#ffffff",
    text: "#586653",
    muted: "#6f756b",
    border: "#e8e4d8",
    radius: "999px",
    density: "spacious",
  },
  colors: {
    brand: "#b9ad7b",
    brandMuted: "#d6cda3",
    accent: "#ff5a14",
    background: "#ffffff",
    surface: "#f4f2e9",
    text: "#586653",
    mutedText: "#6f756b",
    border: "#e8e4d8",
  },
  typography: {
    headingFamily: '"Libre Baskerville", Georgia, serif',
    bodyFamily: '"Nunito Sans", Arial, sans-serif',
    labelTracking: "0.08em",
    headingWeight: 400,
    bodyWeight: 600,
  },
  spacing: {
    sectionBlock: "96px",
    containerInline: "32px",
    radius: "999px",
  },
  motion: {
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    revealDuration: "650ms",
    hoverDuration: "180ms",
  },
  notes: [
    "Warm gold, muted green text, orange CTA, and dark charcoal footer extracted from the live Timbermill WordPress site.",
    "The live reference uses Salient/WPBakery delayed reveal animation; CMS fixtures should render content visibly by default.",
    "Use public WordPress image URLs as fixture references until source assets are provided.",
  ],
} satisfies PublicSiteThemePreset;
