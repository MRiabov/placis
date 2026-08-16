import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import type { CmsPageProjection } from "../../api/cms";
import {
  addFormField,
  fieldString,
  formFieldTypes,
  formFields,
  pageForms,
  updateForm,
  updateFormField,
} from "./inspectorModel";

export type FormsInspectorProps = {
  draft: CmsPageProjection;
  onDraftChange: (draft: CmsPageProjection) => void;
};

/** Page forms + field editing. */
export function FormsInspector({
  draft,
  onDraftChange,
}: FormsInspectorProps): ReactNode {
  return (
    <div className="cms-inspector-content">
      <div className="cms-field">
        <span className="cms-field-label">Forms</span>
      </div>
      {pageForms(draft).map((form) => (
        <div
          className="cms-inspector-section-card"
          key={form.form_id}
        >
          <div className="cms-field">
            <label className="cms-field-label" htmlFor={`cms-form-${form.form_id}`}>
              Form title
            </label>
            <input
              className="cms-field-control"
              id={`cms-form-${form.form_id}`}
              onChange={(event) =>
                onDraftChange(
                  updateForm(draft, form.form_id, {
                    title: event.target.value,
                  }),
                )
              }
              value={form.title}
            />
          </div>
          <div className="cms-field">
            <label
              className="cms-field-label"
              htmlFor={`cms-form-notice-${form.form_id}`}
            >
              Privacy notice
            </label>
            <textarea
              className="cms-field-control"
              id={`cms-form-notice-${form.form_id}`}
              onChange={(event) =>
                onDraftChange(
                  updateForm(draft, form.form_id, {
                    privacy_notice: event.target.value,
                  }),
                )
              }
              value={form.privacy_notice ?? ""}
            />
          </div>
          <div className="grid gap-2">
            {formFields(form).map((field, index) => (
              <div
                className="cms-inspector-section-card"
                key={fieldString(field, "id") || `${form.form_id}-${index}`}
              >
                <input
                  aria-label="Field label"
                  className="cms-field-control"
                  onChange={(event) =>
                    onDraftChange(
                      updateFormField(draft, form.form_id, index, {
                        label: event.target.value,
                      }),
                    )
                  }
                  value={fieldString(field, "label")}
                />
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    aria-label="Field type"
                    className="cms-field-control"
                    onChange={(event) =>
                      onDraftChange(
                        updateFormField(draft, form.form_id, index, {
                          type: event.target.value,
                        }),
                      )
                    }
                    value={fieldString(field, "type") || "text"}
                  >
                    {formFieldTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-xs">
                    Required
                    <input
                      checked={Boolean(field.required)}
                      onChange={(event) =>
                        onDraftChange(
                          updateFormField(draft, form.form_id, index, {
                            required: event.target.checked,
                          }),
                        )
                      }
                      type="checkbox"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            className="button-secondary"
            onClick={() => onDraftChange(addFormField(draft, form.form_id))}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Add field
          </button>
        </div>
      ))}
    </div>
  );
}
