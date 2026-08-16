import type { ReactNode } from "react";

import type { CmsDesignControl, CmsSection, CmsSectionDesign } from "../../api/cms";
import { designControls, sectionDesign } from "./inspectorModel";

export type DesignInspectorProps = {
  section: CmsSection;
  onDesignChange: (design: CmsSectionDesign) => void;
};

/** The section's design controls from its component contract. */
export function DesignInspector({
  section,
  onDesignChange,
}: DesignInspectorProps): ReactNode {
  const controls = designControls(section);
  const registeredKeys = new Set(controls.map((control) => control.key));
  const design = sectionDesign(section);
  const additionalValues = Object.fromEntries(
    Object.entries(design).filter(([key]) => !registeredKeys.has(key)),
  );

  function applyControl(control: CmsDesignControl, value: string | boolean) {
    onDesignChange({ ...design, [control.key]: value });
  }

  return (
    <div className="cms-inspector-content">
      <div className="cms-field">
        <span className="cms-field-label">Design controls</span>
        {controls.length ? null : (
          <p className="text-sm text-cms-text-muted">
            This component exposes no design controls yet.
          </p>
        )}
      </div>
      {controls.map((control) => (
        <DesignControl
          control={control}
          key={control.key}
          onChange={(value) => applyControl(control, value)}
        />
      ))}
      {additionalValues && Object.keys(additionalValues).length ? (
        <p className="text-xs text-cms-text-muted">
          {Object.keys(additionalValues).join(", ")} design values are not
          exposed by this component.
        </p>
      ) : null}
    </div>
  );
}

function DesignControl({
  control,
  onChange,
}: {
  control: CmsDesignControl;
  onChange: (value: string | boolean) => void;
}): ReactNode {
  return (
    <div className="cms-field">
      <span className="cms-field-label">{control.label}</span>
      {control.type === "boolean" ? (
        <input
          checked={Boolean(control.value)}
          className="cms-field-control"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      ) : (
        <select
          className="cms-field-control"
          onChange={(event) => onChange(event.target.value)}
          value={String(control.value ?? control.default ?? "")}
        >
          {(control.values ?? []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
