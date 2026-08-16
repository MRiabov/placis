import type { ReactNode } from "react";

import type { CmsPageProjection } from "../../api/cms";
import { pageVersions } from "./inspectorModel";

export type HistoryInspectorProps = {
  draft: CmsPageProjection;
};

/** Read-only page version history. */
export function HistoryInspector({ draft }: HistoryInspectorProps): ReactNode {
  const versions = pageVersions(draft);
  return (
    <div className="cms-inspector-content">
      <div className="cms-field">
        <span className="cms-field-label">History</span>
      </div>
      <div className="grid gap-2">
        {versions.length ? (
          versions.map((version) => (
            <div
              className="cms-inspector-section-card"
              key={version.id}
            >
              <strong>Version {version.version_number}</strong>
              <div className="mt-1 text-xs text-cms-text-muted">
                {new Date(version.created_at).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-cms-text-muted">
            No versions recorded for this page yet.
          </p>
        )}
      </div>
    </div>
  );
}
