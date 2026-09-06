import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function PosterGrid({ props, theme }: WebsiteComponentProps) {
  const items = asRecords(props.items);
  const anchor = text(props.anchor_id, "");
  const hideMissingImages = props.hide_missing_images === true;
  return (
    <section
      className={`${sectionPadding(theme)} public-poster-grid`}
      id={anchor || undefined}
    >
      <div className="website-frame public-poster-grid__inner">
        {props.title ? <h2>{text(props.title, "Gallery")}</h2> : null}
        {props.intro ? <p>{text(props.intro, "")}</p> : null}
        <div className="public-poster-grid__items">
          {items.map((item, index) => {
            const src = imageUrl(item.generated_image_url ?? item.image_url);
            const title = text(
              item.title ?? item.name ?? item.category,
              "Project",
            );
            const href = text(item.href, "");
            const tile = (
              <>
                {src ? (
                  <img alt={text(item.alt_text, title)} src={src} />
                ) : hideMissingImages ? null : (
                  <div className="public-poster-grid__placeholder" />
                )}
                <figcaption>
                  <span>{title}</span>
                  {item.label ? (
                    <small>{text(item.label, "")}</small>
                  ) : null}
                  {item.excerpt ? <p>{text(item.excerpt, "")}</p> : null}
                </figcaption>
              </>
            );
            return (
              <figure key={`${title}-${index}`}>
                {href ? <a href={href}>{tile}</a> : tile}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
