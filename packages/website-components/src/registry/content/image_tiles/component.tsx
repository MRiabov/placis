import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function ImageTiles({ props }: WebsiteComponentProps) {
  const items = asRecords(props.items);
  return (
    <section
      className="public-image-tiles"
      data-public-image-tiles
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="website-frame">
        <div className="public-image-tiles__frame">
          <div className="public-image-tiles__content">
            <div className="public-image-tiles__heading">
              <span aria-hidden="true" />
              <h2>{text(props.title, "Featured links")}</h2>
            </div>
            <div
              aria-label={text(props.title, "Featured links")}
              className="public-image-tiles__tabs"
              role="tablist"
            >
              {items.map((item, index) => {
                const title = text(item.title, `Featured item ${index + 1}`);
                return (
                  <button
                    aria-controls={`public-image-tile-panel-${index}`}
                    aria-selected={index === 0 ? "true" : "false"}
                    className={index === 0 ? "is-active" : ""}
                    data-public-image-tile-tab={String(index)}
                    id={`public-image-tile-tab-${index}`}
                    key={title}
                    role="tab"
                    tabIndex={index === 0 ? 0 : -1}
                    type="button"
                  >
                    {title}
                  </button>
                );
              })}
            </div>
            <div className="public-image-tiles__panels">
              {items.map((item, index) => {
                const title = text(item.title, `Featured item ${index + 1}`);
                return (
                  <div
                    aria-labelledby={`public-image-tile-tab-${index}`}
                    data-public-image-tile-panel={String(index)}
                    hidden={index !== 0}
                    id={`public-image-tile-panel-${index}`}
                    key={title}
                    role="tabpanel"
                  >
                    <p>{text(item.description, "")}</p>
                    {item.href ? (
                      <a href={text(item.href, "#")}>
                        {text(item.link_label, "Learn more")}{" "}
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="public-image-tiles__media">
            {items.map((item, index) => {
              const title = text(item.title, "Featured item");
              const image = imageUrl(item.image_url);
              return (
                <div
                  className={index === 0 ? "is-active" : ""}
                  data-public-image-tile-image={String(index)}
                  hidden={index !== 0}
                  key={title}
                >
                  {image ? (
                    <img alt={text(item.alt_text, title)} src={image} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
