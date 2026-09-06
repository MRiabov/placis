import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ReviewPanel({ props }: WebsiteComponentProps) {
  const items = asRecords(props.items);
  const first = items[0] ?? {};
  const anchor = text(props.anchor_id);
  return (
    <section className="public-review-panel" id={anchor || undefined}>
      <div className="public-section-inner public-review-panel__inner">
        <div className="public-review-panel__label">
          <p className="public-section-label">
            {text(props.eyebrow, "Our Reputation")}
          </p>
          <h2>{text(props.title, "Reviews")}</h2>
        </div>
        <figure className="public-review-card">
          <svg
            aria-hidden="true"
            fill="none"
            height="36"
            viewBox="0 0 48 36"
            width="48"
          >
            <path
              d="M0 36V24C0 16.2 3 9.8 9 5.4 15 .8 22.6-.4 31.8.6v7.2C26.6.2 22.2 2.2 18.6 6c-3.6 3.8-5.4 8.4-5.4 13.8h10.8V36H0zm26.4 0V24c0-7.8 3-14.2 9-18.6C41.4.8 49-.4 58.2.6v7.2C53 .2 48.6 2.2 45 6c-3.6 3.8-5.4 8.4-5.4 13.8H50.4V36H26.4z"
              fill="rgba(12,32,113,0.1)"
            />
          </svg>
          <blockquote>
            {text(
              first.quote ?? first.body,
              "Helpful, professional, and easy to deal with.",
            )}
          </blockquote>
          <figcaption>
            <strong>{text(first.name ?? first.author, "Reviewer")}</strong>
            <span>{text(first.location, "")}</span>
          </figcaption>
          <div className="public-review-card__footer">
            <span />
            <div>
              <button aria-label="Previous" type="button">
                &lsaquo;
              </button>
              <button aria-label="Next" type="button">
                &rsaquo;
              </button>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
