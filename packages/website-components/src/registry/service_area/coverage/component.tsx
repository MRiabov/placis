import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asStrings, imageUrl, text } from "../../../utils";

export default function ServiceAreaCoverage({
  props,
  theme,
}: PublicSiteComponentProps) {
  const areas = asStrings(props.areas ?? props.service_area);
  const image = imageUrl(props.image_url ?? props.source_image_url);
  const href = text(props.href, "");
  const linkLabel = text(props.link_label, "View service area");
  return (
    <section
      className={`${sectionPadding(theme)} public-service-area-coverage bg-(--public-background)`}
    >
      <div className="public-site-shell public-service-area-coverage__inner">
        <div className="public-service-area-coverage__copy">
          <p className="public-section-label">
            {text(props.eyebrow, "Service area")}
          </p>
          <h2>{text(props.title, "Areas covered")}</h2>
          <p>
            {text(
              props.body,
              "Local work is scheduled with clear arrival windows and practical follow-up.",
            )}
          </p>
          {href ? <a href={href}>{linkLabel}</a> : null}
        </div>
        <div className="public-service-area-coverage__proof">
          {image ? (
            <img alt={text(props.alt_text, "Service area map")} src={image} />
          ) : null}
          <div className="public-service-area-coverage__areas">
            {areas.map((area) => (
              <span key={area}>{area}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
