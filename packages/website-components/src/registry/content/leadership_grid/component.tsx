import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function LeadershipGrid({
  props,
  theme,
}: WebsiteComponentProps) {
  const anchor = text(props.anchor_id);
  const items = asRecords(props.items);

  return (
    <section
      className={`${sectionPadding(theme)} public-leadership-grid`}
      id={anchor || undefined}
    >
      <div className="website-frame public-leadership-grid__inner">
        {props.title ? <h2>{text(props.title, "Leadership")}</h2> : null}
        <div className="public-leadership-grid__items">
          {items.map((item, index) => {
            const name = text(item.name ?? item.title, "Leader");
            const src = imageUrl(item.image_url);
            return (
              <article key={`${name}-${index}`}>
                {src ? <img alt={text(item.alt_text, name)} src={src} /> : null}
                <h3>{name}</h3>
                {item.role ? <p className="role">{String(item.role)}</p> : null}
                {item.bio ? <p>{String(item.bio)}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
