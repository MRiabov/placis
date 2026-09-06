import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="public-testimonial-google-icon"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.35a4.57 4.57 0 0 1-1.98 3v2.49h3.2c1.87-1.72 2.99-4.26 2.99-7.5Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.2-2.49c-.9.6-2.03.95-3.41.95-2.62 0-4.84-1.77-5.63-4.15H3.06v2.57A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.37 13.88A6.02 6.02 0 0 1 6.05 12c0-.65.11-1.29.32-1.88V7.55H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.06 4.45l3.31-2.57Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.86-2.86C16.96 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.55l3.31 2.57C7.16 7.74 9.38 5.97 12 5.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      aria-label={`${filledStars} out of 5 stars`}
      className="public-testimonial-rating"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          aria-hidden="true"
          className={index < filledStars ? "is-filled" : ""}
          key={index}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewCards({
  props,
  theme,
}: WebsiteComponentProps) {
  const items = asRecords(props.items ?? props.testimonials);
  const anchor = text(props.anchor_id, "");
  return (
    <section
      className={`${sectionPadding(theme)} website-reviews-cards bg-(--public-background)`}
      id={anchor || undefined}
    >
      <div className="website-frame">
        {props.eyebrow ? (
          <p className="public-section-label">{String(props.eyebrow)}</p>
        ) : null}
        <h2 className="text-3xl font-bold">
          {text(props.title, "Reviews")}
        </h2>
        <div className="website-reviews-cards__body mt-6 grid gap-4 lg:grid-cols-3">
          {items.map((item) => {
            const rating = Number(item.rating ?? 5);
            const sourceLabel = text(item.source_label ?? item.source, "");
            const sourceUrl = text(item.source_url ?? item.href, "");
            const isGoogleSource = sourceLabel.toLowerCase().includes("google");
            const sourceMarker = sourceLabel ? (
              isGoogleSource ? (
                <>
                  <span className="public-visually-hidden">{sourceLabel}</span>
                  <GoogleIcon />
                </>
              ) : (
                <span>{sourceLabel}</span>
              )
            ) : null;
            return (
              <figure
                className="rounded-(--public-radius) border border-(--public-border) bg-(--public-background) p-5"
                key={text(item.quote ?? item.body, "testimonial")}
              >
                <RatingStars rating={Number.isFinite(rating) ? rating : 5} />
                <blockquote className="text-sm leading-6 text-(--public-muted)">
                  “
                  {text(
                    item.quote ?? item.body,
                    "Helpful, professional, and easy to deal with.",
                  )}
                  ”
                </blockquote>
                <figcaption className="public-testimonial-meta mt-4 text-sm font-bold">
                  <span className="public-testimonial-author">
                    {text(item.name ?? item.author, "Reviewer")}
                  </span>
                  {sourceMarker ? (
                    sourceUrl ? (
                      <a
                        aria-label={sourceLabel}
                        className="public-testimonial-source"
                        href={sourceUrl}
                      >
                        {sourceMarker}
                      </a>
                    ) : (
                      <span
                        aria-label={sourceLabel}
                        className="public-testimonial-source"
                      >
                        {sourceMarker}
                      </span>
                    )
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
