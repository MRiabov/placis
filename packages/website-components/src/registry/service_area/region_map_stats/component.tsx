import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

function firstImageUrl(...values: unknown[]): string | null {
  for (const value of values) {
    const url = imageUrl(value);
    if (url) {
      return url;
    }
  }
  return null;
}

export default function RegionMapStats({ props }: WebsiteComponentProps) {
  const regions = asRecords(props.regions);
  const panels = regions.length ? regions : [{}];

  return (
    <section
      className="public-region-map-stats"
      data-public-tabs=""
      id={text(props.anchor_id, "locations")}
    >
      <div className="website-frame public-region-map-stats__inner">
        <div className="public-region-map-stats__heading">
          <p className="public-section-label">
            {text(props.eyebrow, "Where We Work")}
          </p>
          <h2>{text(props.title, "Helping you transform communities.")}</h2>
        </div>
        <div className="public-region-map-stats__copy">
          <p>{text(props.body, "")}</p>
        </div>
        <div className="public-region-map-stats__tabs" role="tablist">
          {regions.map((region, index) => (
            <button
              aria-selected={index === 0}
              className={index === 0 ? "is-active" : ""}
              data-public-tab-trigger={String(index)}
              key={text(region.label ?? region.title, `region-${index}`)}
              role="tab"
              tabIndex={index === 0 ? 0 : -1}
              type="button"
            >
              {text(region.label ?? region.title, "Region")}
            </button>
          ))}
        </div>
        {panels.map((region, index) => {
          const stats = asRecords(region.stats ?? props.stats);
          const image = firstImageUrl(
            region.image_url,
            region.image,
            props.image_url,
            props.source_image_url,
          );
          return (
            <div
              className="public-region-map-stats__region-panel"
              data-public-tab-panel={String(index)}
              hidden={index !== 0}
              key={text(region.label ?? region.title, `region-panel-${index}`)}
              role="tabpanel"
            >
              <div
                className="public-region-map-stats__map"
                aria-hidden={!image}
              >
                {image ? (
                  <img
                    alt={text(
                      region.alt_text ?? props.alt_text,
                      text(region.label ?? props.title, "Region map"),
                    )}
                    src={image}
                  />
                ) : null}
              </div>
              <dl className="public-region-map-stats__stats">
                {stats.map((stat, statIndex) => (
                  <div key={text(stat.label, `stat-${index}-${statIndex}`)}>
                    <dt>{text(stat.value, "")}</dt>
                    <dd>{text(stat.label, "")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
