import type { ReactNode } from "react";

import type { CmsPageProjection } from "../../api/cms";
import { pageSeo } from "./inspectorModel";

export type SeoInspectorProps = {
  draft: CmsPageProjection;
  onPageUpdate: (patch: { title?: string; path?: string }) => void;
  onSeoChange: (patch: Record<string, unknown>) => void;
};

const seoFields = [
  "title",
  "description",
  "canonical_url",
  "og_title",
  "og_description",
] as const;

/** Page title/path + SEO metadata editing. */
export function SeoInspector({
  draft,
  onPageUpdate,
  onSeoChange,
}: SeoInspectorProps): ReactNode {
  const seo = pageSeo(draft);
  return (
    <div className="cms-inspector-content">
      <div className="cms-field">
        <span className="cms-field-label">Page and SEO</span>
      </div>
      <div className="cms-field">
        <label className="cms-field-label" htmlFor="cms-seo-page-title">
          Page title
        </label>
        <input
          className="cms-field-control"
          id="cms-seo-page-title"
          onChange={(event) => onPageUpdate({ title: event.target.value })}
          value={draft.page.title}
        />
      </div>
      <div className="cms-field">
        <label className="cms-field-label" htmlFor="cms-seo-path">
          Path
        </label>
        <input
          className="cms-field-control"
          id="cms-seo-path"
          onChange={(event) => onPageUpdate({ path: event.target.value })}
          value={draft.page.path}
        />
      </div>
      {seoFields.map((field) => {
        const value = seo[field];
        const textValue = typeof value === "string" ? value : "";
        return field === "description" || field === "og_description" ? (
          <div className="cms-field" key={field}>
            <label className="cms-field-label" htmlFor={`cms-seo-${field}`}>
              {field.replaceAll("_", " ")}
            </label>
            <textarea
              className="cms-field-control"
              id={`cms-seo-${field}`}
              onChange={(event) => onSeoChange({ [field]: event.target.value })}
              value={textValue}
            />
          </div>
        ) : (
          <div className="cms-field" key={field}>
            <label className="cms-field-label" htmlFor={`cms-seo-${field}`}>
              {field.replaceAll("_", " ")}
            </label>
            <input
              className="cms-field-control"
              id={`cms-seo-${field}`}
              onChange={(event) => onSeoChange({ [field]: event.target.value })}
              value={textValue}
            />
          </div>
        );
      })}
    </div>
  );
}
