import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ProcessSteps({ props }: PublicSiteComponentProps) {
  const steps = asRecords(props.steps);
  return (
    <section
      className="public-section-panel public-section-panel--surface"
      data-public-tabs=""
      id={text(props.anchor_id, "process")}
    >
      <div className="public-section-inner">
        <div className="public-section-header">
          <p className="public-section-label">
            {text(props.eyebrow, "How We Work")}
          </p>
          <h2>{text(props.title, "A journey designed around you")}</h2>
        </div>
        <div className="public-process">
          <div className="public-process__steps" role="tablist">
            {steps.map((step, index) => (
              <button
                className={index === 0 ? "is-active" : ""}
                data-public-tab-trigger={String(index)}
                type="button"
                role="tab"
                aria-selected={index === 0}
                tabIndex={index === 0 ? 0 : -1}
                key={text(step.title, `step-${index}`)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {text(step.title, "Step")}
              </button>
            ))}
          </div>
          {steps.map((step, index) => (
            <div
              className="public-process__detail"
              data-public-tab-panel={String(index)}
              hidden={index !== 0}
              key={text(step.title, `step-detail-${index}`)}
              role="tabpanel"
            >
              <strong>{text(step.title, "Discover")}</strong>
              <p>
                {text(
                  step.description ?? step.body,
                  "A practical first conversation captures the project shape.",
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
