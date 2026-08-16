import type { ReactNode } from "react";

import type { CmsPageProjection } from "../../api/cms";
import {
  cmsThemePresets,
  themeDisplayName,
  themePresetForValue,
} from "./themes/presets";

export type StylesWorkspacePanelProps = {
  draft: CmsPageProjection | null;
  onApplyTheme: (preset: (typeof cmsThemePresets)[number]) => void;
};

/** Theme preset rail: apply one of the curated visual themes. */
export function StylesWorkspacePanel({
  draft,
  onApplyTheme,
}: StylesWorkspacePanelProps): ReactNode {
  const theme = draft?.theme ?? null;
  const currentPreset = themePresetForValue(theme?.preset ?? null);
  const themeLabel = currentPreset?.label ?? themeDisplayName(theme);

  return (
    <div className="grid gap-4">
      <div className="text-sm font-semibold">Styles</div>
      <div className="rounded-lg border border-cms-border bg-cms-surface p-3">
        <div className="text-sm font-semibold">{themeLabel}</div>
        <div className="mt-1 text-xs text-cms-text-muted">Visual theme</div>
      </div>
      <div className="grid gap-2">
        {cmsThemePresets.map((preset) => (
          <ThemePresetCard
            active={preset.id === currentPreset?.id}
            disabled={!draft}
            key={preset.id}
            onApply={() => onApplyTheme(preset)}
            preset={preset}
          />
        ))}
      </div>
    </div>
  );
}

function ThemePresetCard({
  active,
  disabled,
  onApply,
  preset,
}: {
  active: boolean;
  disabled: boolean;
  onApply: () => void;
  preset: (typeof cmsThemePresets)[number];
}): ReactNode {
  return (
    <div
      className={
        active
          ? "rounded-lg border border-cms-border bg-cms-surface p-3"
          : "rounded-lg border border-cms-border bg-cms-surface p-3"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{preset.label}</div>
          <div className="mt-1 flex gap-1">
            {preset.swatches.map((swatch) => (
              <span
                className="size-3 rounded-full border border-black/10"
                key={swatch}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>
        <button
          className="button-secondary"
          disabled={disabled || active}
          onClick={onApply}
          type="button"
        >
          {active ? "Applied" : "Apply"}
        </button>
      </div>
    </div>
  );
}
