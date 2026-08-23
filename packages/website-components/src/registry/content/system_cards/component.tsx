import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function SystemCards({ props }: PublicSiteComponentProps) {
  const items = asRecords(props.items);
  const ctaLabel = text(props.cta_label, "");
  const ctaHref = text(props.cta_href, "#");
  return (
    <section
      className="public-system-cards"
      data-public-system-cards
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="public-site-shell public-system-cards__inner">
        <div className="public-system-cards__header">
          {props.eyebrow ? (
            <p className="public-eyebrow">
              <span aria-hidden="true" />
              {String(props.eyebrow)}
            </p>
          ) : null}
          <h2>{text(props.title, "How we work")}</h2>
        </div>
        <div className="public-system-cards__layout">
          <aside className="public-system-cards__index">
            {items.map((indexItem, index) => (
              <a
                aria-current={index === 0 ? "true" : undefined}
                className={index === 0 ? "is-active" : ""}
                data-public-system-card-link={text(
                  indexItem.anchor_id,
                  `system-card-${index}`,
                )}
                href={`#${text(indexItem.anchor_id, `system-card-${index}`)}`}
                key={text(indexItem.title, `Item ${index + 1}`)}
              >
                <span aria-hidden="true" />
                {text(indexItem.title, `Item ${index + 1}`)}
              </a>
            ))}
            {ctaLabel ? (
              <a className="public-system-cards__cta" href={ctaHref}>
                {ctaLabel} <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </aside>
          <div className="public-system-cards__items">
            {items.map((item, index) => {
              const title = text(item.title, `Item ${index + 1}`);
              const image = imageUrl(item.image_url);
              return (
                <article
                  className="public-system-cards__panel"
                  data-public-system-card-panel={text(
                    item.anchor_id,
                    `system-card-${index}`,
                  )}
                  id={text(item.anchor_id, `system-card-${index}`)}
                  key={title}
                >
                  <div className="public-system-cards__media">
                    {image ? (
                      <img alt={text(item.alt_text, title)} src={image} />
                    ) : null}
                  </div>
                  <div className="public-system-cards__copy">
                    <h3>{title}</h3>
                    <p>{text(item.description, "")}</p>
                    {item.href ? (
                      <a href={text(item.href, "#")}>
                        {text(item.link_label, "Learn more")}{" "}
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
