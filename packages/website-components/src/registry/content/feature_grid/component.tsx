import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function FeatureGrid({
  props,
  theme,
}: WebsiteComponentProps) {
  const items = asRecords(props.items);
  return (
    <section className={`${sectionPadding(theme)} public-feature-grid`}>
      <div className="website-frame">
        <div className="public-feature-grid__heading">
          {props.eyebrow ? (
            <p className="public-eyebrow">{String(props.eyebrow)}</p>
          ) : null}
          <h2>{text(props.title, "Features")}</h2>
          {props.body ? <p>{String(props.body)}</p> : null}
        </div>
        <div className="public-feature-grid__items">
          {items.map((item) => {
            const icon = imageUrl(item.icon_url);
            const title = text(item.title ?? item.name, "Feature");
            return (
              <article key={title}>
                {icon ? <img alt="" src={icon} /> : null}
                <h3>{title}</h3>
                <p>{text(item.body ?? item.description, "")}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
