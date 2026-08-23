import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ProjectPlanner({ props }: PublicSiteComponentProps) {
  const projectTypes = asRecords(props.project_types);
  const priorities = asRecords(props.priorities);
  const timeline = asRecords(props.timeline);
  const defaultTimeline = text(timeline[1]?.value ?? timeline[0]?.value, "2");
  const defaultTimelineLabel = text(
    timeline[1]?.label ?? timeline[0]?.label,
    "Planning this season",
  );
  const timelineLabels = Object.fromEntries(
    timeline.map((item) => [
      text(item.value, text(item.label, "2")),
      text(item.label, "Planning this season"),
    ]),
  );
  return (
    <section
      className="public-section-panel public-section-panel--muted"
      id={text(props.anchor_id, "planner")}
    >
      <div className="public-section-inner public-project-planner">
        <div className="public-project-planner__copy">
          <p className="public-section-label public-section-label--dark">
            {text(props.eyebrow, "Project Planner")}
          </p>
          <h2>
            {text(props.title, "Let's explore the scope of your project")}
          </h2>
          <p>
            {text(
              props.description,
              "Book a call today to get clarity on budget and feasibility.",
            )}
          </p>
        </div>
        <form
          className="public-project-planner__form"
          data-planner=""
          data-result-prefix={text(
            props.result_prefix,
            "Start with a scope conversation",
          )}
          data-timeline-labels={JSON.stringify(timelineLabels)}
        >
          <label>
            <span>Project Type</span>
            <select name="type">
              {projectTypes.map((item) => (
                <option
                  value={text(item.value, text(item.label, "project"))}
                  key={text(item.value ?? item.label, "project")}
                >
                  {text(item.label, "Project")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Main Priority</span>
            <select name="priority">
              {priorities.map((item) => (
                <option
                  value={text(item.value, text(item.label, "priority"))}
                  key={text(item.value ?? item.label, "priority")}
                >
                  {text(item.label, "Priority")}
                </option>
              ))}
            </select>
          </label>
          <label className="public-project-planner__range">
            <span>
              Timeline: <em data-range-label="">{defaultTimelineLabel}</em>
            </span>
            <input
              name="timeline"
              type="range"
              min="1"
              max={String(Math.max(timeline.length, 1))}
              defaultValue={defaultTimeline}
            />
          </label>
          <div className="public-project-planner__result" aria-live="polite">
            <span data-planner-result="">
              {text(
                props.result_text,
                "Start with a scope conversation for your project.",
              )}
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
