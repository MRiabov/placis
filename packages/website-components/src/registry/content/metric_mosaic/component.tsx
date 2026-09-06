import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function MetricMosaic({ props }: PublicSiteComponentProps) {
  const items = asRecords(props.items);
  return (
    <section
      className="public-metric-mosaic"
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="public-site-shell public-metric-mosaic__grid">
        <div className="public-metric-mosaic__title">
          <h2>{text(props.title, "At a glance")}</h2>
        </div>
        {items.map((item) => {
          const label = text(item.label, "Metric");
          const image = imageUrl(item.image_url);
          return (
            <article className="public-metric-mosaic__item" key={label}>
              {item.value ? (
                <strong className="public-metric-mosaic__value">
                  {String(item.value)}
                </strong>
              ) : null}
              {image ? (
                <img alt={text(item.alt_text, label)} src={image} />
              ) : null}
              <p>
                <span aria-hidden="true" />
                {label}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
