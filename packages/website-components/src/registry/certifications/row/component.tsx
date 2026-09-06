import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function CertificationsRow({
  props,
}: WebsiteComponentProps) {
  const items = asRecords(props.items);
  return (
    <section
      className="public-section-panel public-section-panel--brand"
      id={text(props.anchor_id, "certifications")}
    >
      <div className="public-section-inner">
        <div className="website-section-heading">
          <p className="public-section-label public-section-label--light">
            {text(props.eyebrow, "Certifications")}
          </p>
          <h2>{text(props.title, "Standards & Certifications")}</h2>
        </div>
        <div className="public-accreditations" data-item-count={items.length}>
          {items.map((item) => {
            const src = imageUrl(item.image_url ?? item.url);
            return (
              <article key={text(item.title ?? item.label, "Certification")}>
                <div className="public-accreditations__logo">
                  {src ? (
                    <img
                      alt={text(
                        item.alt_text,
                        text(item.title ?? item.label, "Certification"),
                      )}
                      src={src}
                    />
                  ) : null}
                </div>
                <p>{text(item.title ?? item.label, "Certification")}</p>
                <span>{text(item.description, "Trade certification")}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
