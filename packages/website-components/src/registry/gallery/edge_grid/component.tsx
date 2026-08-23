import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function EdgeGridGallery({ props }: PublicSiteComponentProps) {
  const items = asRecords(props.items);
  const anchor = text(props.anchor_id);
  return (
    <section className="public-edge-gallery" id={anchor || undefined}>
      <div className="public-section-inner public-section-header">
        <p className="public-section-label public-section-label--light">
          {text(props.eyebrow, "Selected Works")}
        </p>
        <h2>{text(props.title, "Recent Projects")}</h2>
      </div>
      <div className="public-edge-gallery__grid">
        {items.map((item, index) => {
          const src = imageUrl(item.generated_image_url ?? item.image_url);
          return (
            <article
              className="public-edge-gallery-card"
              key={text(item.title, `gallery-${index}`)}
            >
              <div className="public-edge-gallery-card__image">
                {src ? (
                  <img
                    alt={text(item.alt_text, text(item.title, "Project image"))}
                    src={src}
                  />
                ) : null}
                <span>{text(item.category, "Project")}</span>
              </div>
              <div className="public-edge-gallery-card__copy">
                <h3>{text(item.title, "Project")}</h3>
                <p>{text(item.caption, "")}</p>
                <small>
                  {[item.location, item.date].filter(Boolean).join(" - ")}
                </small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
