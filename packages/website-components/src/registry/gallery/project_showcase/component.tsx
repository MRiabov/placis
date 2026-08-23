import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function ProjectShowcase({ props }: PublicSiteComponentProps) {
  const projects = asRecords(props.projects);

  return (
    <section
      className="public-project-showcase"
      data-public-tabs=""
      id={text(props.anchor_id, "work")}
    >
      <div className="public-site-shell">
        <div className="public-project-showcase__heading">
          <p className="public-section-label">
            {text(props.eyebrow, "Our Work")}
          </p>
          <h2>{text(props.title, "Featured projects")}</h2>
        </div>
        <div className="public-project-showcase__tabs" role="tablist">
          {projects.map((project, index) => (
            <button
              aria-selected={index === 0}
              className={index === 0 ? "is-active" : ""}
              data-public-tab-trigger={String(index)}
              key={text(project.title, `project-${index}`)}
              role="tab"
              tabIndex={index === 0 ? 0 : -1}
              type="button"
            >
              {text(project.category ?? project.title, "Project")}
            </button>
          ))}
        </div>
        {projects.map((project, index) => {
          const image = imageUrl(project.image ?? project.image_url);
          return (
            <article
              className="public-project-showcase__panel"
              data-public-tab-panel={String(index)}
              hidden={index !== 0}
              key={text(project.title, `project-panel-${index}`)}
              role="tabpanel"
            >
              {image ? (
                <img
                  alt={text(project.alt_text, text(project.title, ""))}
                  src={image}
                />
              ) : null}
              <div>
                <p className="public-section-label">
                  {text(project.category, "Project")}
                </p>
                <h3>{text(project.title, "Project showcase")}</h3>
                <p>{text(project.description, "")}</p>
                {project.href ? (
                  <a href={text(project.href, "#")}>
                    {text(project.link_label, "View project")}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
