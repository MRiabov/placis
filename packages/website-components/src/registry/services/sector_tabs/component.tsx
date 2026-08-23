import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function SectorTabs({ props }: PublicSiteComponentProps) {
  const sectors = asRecords(props.sectors);

  return (
    <section
      className="public-sector-tabs"
      data-public-tabs=""
      id={text(props.anchor_id, "capabilities")}
    >
      <div className="public-site-shell">
        <div className="public-sector-tabs__header">
          <p className="public-section-label">
            {text(props.eyebrow, "What We Do")}
          </p>
          <h2>{text(props.title, "Service capabilities")}</h2>
        </div>
        <div className="public-sector-tabs__tabs" role="tablist">
          {sectors.map((sector, index) => (
            <button
              aria-selected={index === 0}
              className={index === 0 ? "is-active" : ""}
              data-public-tab-trigger={String(index)}
              key={text(sector.label ?? sector.title, `capability-${index}`)}
              role="tab"
              tabIndex={index === 0 ? 0 : -1}
              type="button"
            >
              {text(sector.label ?? sector.title, "Capability")}
            </button>
          ))}
        </div>
        {sectors.map((sector, index) => {
          const image = imageUrl(sector.image ?? sector.image_url);
          return (
            <article
              className={`public-sector-tabs__panel${index === 0 ? " is-revealed" : ""}`}
              data-public-tab-panel={String(index)}
              hidden={index !== 0}
              key={text(
                sector.label ?? sector.title,
                `capability-panel-${index}`,
              )}
              role="tabpanel"
            >
              <div>
                <p className="public-section-label">
                  {text(sector.kicker ?? sector.label, "Service")}
                </p>
                <h3>{text(sector.title, "Service capability")}</h3>
                <p>{text(sector.description, "")}</p>
                {sector.href ? (
                  <a href={text(sector.href, "#")}>
                    {text(sector.link_label, "Explore this service")}
                  </a>
                ) : null}
              </div>
              {image ? (
                <figure className="public-sector-tabs__media">
                  <img
                    alt={text(sector.alt_text, text(sector.title, ""))}
                    src={image}
                  />
                </figure>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
