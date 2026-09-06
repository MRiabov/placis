import { gray, slate } from "@radix-ui/colors";
import type { WebsiteThemePreset } from "../types";

const harperColors = {
  accent: gray.gray12,
  background: "#ffffff",
  brand: gray.gray12,
  brandMuted: gray.gray11,
  border: gray.gray6,
  mutedText: "#666666",
  surface: gray.gray2,
  text: gray.gray12,
};

export const institutionalMonoThemePreset = {
  id: "theme.institutional_mono",
  label: "Institutional Mono",
  source:
    "https://www.harperconstruction.com/ (Squarespace 7 image-index pages, custom DINOT/Novecento CSS)",
  cssClass: "public-theme-institutional-mono",
  websiteTheme: {
    preset: "institutional_mono",
    primary: harperColors.brand,
    neutral: "gray",
    accent: harperColors.accent,
    background: harperColors.background,
    text: harperColors.text,
    muted: harperColors.mutedText,
    border: harperColors.border,
    radius: "0px",
    density: "spacious",
  },
  colors: {
    brand: harperColors.brand,
    brandMuted: harperColors.brandMuted,
    accent: harperColors.accent,
    background: harperColors.background,
    surface: harperColors.surface,
    text: harperColors.text,
    mutedText: harperColors.mutedText,
    border: harperColors.border,
  },
  typography: {
    bodyFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    bodyWeight: 300,
    headingFamily: '"Josefin Sans", "Helvetica Neue", Arial, sans-serif',
    headingWeight: 300,
    labelTracking: "0.12em",
  },
  spacing: {
    containerInline: "32px",
    radius: "0px",
    sectionBlock: "88px",
  },
  motion: {
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    hoverDuration: "220ms",
    revealDuration: "700ms",
  },
  notes: [
    "Source-backed preset for Harper Construction's Squarespace 7 image-index pages: white overlay top menu, dark translucent centered hero title bands, thin uppercase top menu labels, broad white content sections, and quiet monochrome controls.",
    "The source uses custom DINOT and Novecento font files. The reusable preset approximates that pairing with Josefin Sans display text and light Inter body text because the source font files are not redistributed in this package.",
    "Use with full-bleed image hero sections and project galleries. It is intentionally internal until website components support the source scroll indicator and mobile overlay top menu behavior more fully.",
  ],
} satisfies WebsiteThemePreset;
