import { cn } from "@/lib/cn";

/** HTML `--cms-radius-panel` and hardcoded 12px: onboarding cards, reviews, combo. */
export const panelClass = "rounded-panel border border-border bg-white";

/** HTML `.cms-home-card`: 28px, hairline, heavier shadow than ads. */
export const chooserCardClass =
  "rounded-prompt border border-hairline bg-white shadow-chooser";

/** HTML `.cms-notice`: 16px, hairline, prompt shadow. */
export const noticeClass =
  "rounded-[16px] border border-hairline bg-white shadow-prompt";

/** HTML `.onb-card`: panel radius, 20px 24px padding, 10px gap. */
export const onbCardClass = `${panelClass} grid gap-2.5 px-6 py-5`;

/** HTML `--cms-radius-card`. Ads pass `rounded-prompt border-hairline shadow-prompt`. */
export function card(
  ...extra: Array<string | false | null | undefined>
): string {
  const blob = extra.filter(Boolean).join(" ");
  const radius = /\brounded-/.test(blob) ? null : "rounded-lg";
  const border = /\bborder-(hairline|border)\b/.test(blob)
    ? "border"
    : "border border-border";
  return cn("bg-white", radius, border, ...extra);
}

export function panel(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(panelClass, ...extra);
}

export function chooserCard(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(chooserCardClass, ...extra);
}

export function noticeBox(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(noticeClass, ...extra);
}

export function onbCard(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(onbCardClass, ...extra);
}
