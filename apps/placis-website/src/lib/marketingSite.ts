export const SITE_FONT = '"Satoshi", "Helvetica Neue", Arial, sans-serif';

export const CONTACT_EMAIL = "help@placis.com";
export const SUPPORT_EMAIL = "help@placis.com";

export const MARKETING_MAIN_CLASS =
  "page-canvas flex min-h-dvh flex-col overflow-x-clip text-foreground antialiased";

export const SURFACE_RADIUS_CLASS = "rounded-lg";
export const CONTROL_RADIUS_CLASS = "rounded-lg";

export const HAIRLINE_BORDER_CLASS =
  "border border-stone-200 dark:border-white/20";

export const RAISED_SURFACE_CLASS = "border border-border bg-card";
export const RAISED_BOX_CLASS = `${SURFACE_RADIUS_CLASS} ${RAISED_SURFACE_CLASS}`;

export const RAISED_PRIMARY_CLASS = `${HAIRLINE_BORDER_CLASS} bg-primary text-primary-foreground transition hover:bg-zinc-800 dark:hover:bg-zinc-800`;

export const RAISED_OUTLINE_CLASS = `${HAIRLINE_BORDER_CLASS} bg-card text-foreground transition hover:bg-zinc-50 dark:hover:bg-zinc-900`;

export const FLAT_CONTROL_CLASS = RAISED_OUTLINE_CLASS;

export const PROMPT_BOX_RADIUS_CLASS = "rounded-[28px]";
export const PROMPT_BOX_INNER_RADIUS_CLASS = "rounded-[26px]";
export const PROMPT_BOX_COMPACT_BORDER_CLASS = HAIRLINE_BORDER_CLASS;
export const PROMPT_BOX_SURFACE_CLASS = `${PROMPT_BOX_COMPACT_BORDER_CLASS} bg-card`;

export const MARKETING_HEADING_FLAT_CLASS =
  "marketing-heading-flat tracking-[-0.02em] text-foreground";

const MARKETING_HERO_HEADING_SIZE_CLASS =
  "text-[1.5rem] leading-tight min-[360px]:text-[1.75rem] sm:text-[2rem] sm:leading-tight md:text-[2.25rem] lg:text-[2.875rem]";

const MARKETING_STATEMENT_HEADING_SIZE_CLASS =
  "text-[1.375rem] leading-tight min-[360px]:text-[1.5rem] sm:text-[1.625rem] sm:leading-tight md:text-[1.875rem] lg:text-[2.25rem]";

const MARKETING_CARD_HEADING_SIZE_CLASS =
  "text-[1.125rem] leading-snug sm:text-xl sm:leading-snug md:text-[1.375rem]";

export const MARKETING_HERO_H1_CLASS = `${MARKETING_HEADING_FLAT_CLASS} ${MARKETING_HERO_HEADING_SIZE_CLASS} tracking-[-0.03em]`;

export const MARKETING_HOME_HERO_H1_CLASS = MARKETING_HERO_H1_CLASS;

export const MARKETING_STATEMENT_H2_CLASS = `${MARKETING_HEADING_FLAT_CLASS} ${MARKETING_STATEMENT_HEADING_SIZE_CLASS} tracking-[-0.03em]`;

export const MARKETING_CARD_H3_CLASS = `${MARKETING_HEADING_FLAT_CLASS} ${MARKETING_CARD_HEADING_SIZE_CLASS} font-semibold`;

export const MARKETING_PANEL_BODY_CLASS =
  "font-normal text-[14px] text-zinc-600 leading-[1.5] sm:text-[15px] sm:leading-[1.55] dark:text-zinc-300";

export const MARKETING_PANEL_LIST_CLASS =
  "text-[14px] text-zinc-700 leading-6 dark:text-zinc-300";

export const MARKETING_CARD_BODY_CLASS = MARKETING_PANEL_BODY_CLASS;

export const MARKETING_FOOTER_LINK_CLASS =
  "text-[12px] text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50";

export const MARKETING_FOOTER_MUTED_CLASS =
  "text-[12px] text-zinc-600 leading-5 dark:text-zinc-400";
