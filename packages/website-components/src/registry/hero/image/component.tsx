import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecord, asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function HeroImage({ props, theme }: WebsiteComponentProps) {
  const serviceArea = asStrings(props.service_area);
  const trustBadges = asStrings(props.trust_badges);
  const image = asRecord(props.image);
  const primaryCta = asRecord(props.primary_cta);
  const secondaryCta = asRecord(props.secondary_cta);
  const configuredActions = asRecords(props.actions ?? props.buttons);
  const hasConfiguredActions =
    Array.isArray(props.actions) || Array.isArray(props.buttons);
  const heroImage = imageUrl(
    props.generated_image_url ??
      props.image_url ??
      image.generated_image_url ??
      image.image_url ??
      image.url,
  );
  const primaryHref = text(primaryCta.href ?? props.href, "#quote");
  const primaryLabel = text(
    primaryCta.label ?? props.cta_label ?? props.primary_cta_label,
    "Request a quote",
  );
  const secondaryHref = text(
    secondaryCta.href ?? props.secondary_href,
    props.marketing_phone ? `tel:${String(props.marketing_phone)}` : "",
  );
  const secondaryLabel = text(
    secondaryCta.label ?? props.secondary_cta_label,
    "Call now",
  );
  const actions = hasConfiguredActions
    ? configuredActions
    : [
        { href: primaryHref, label: primaryLabel },
        { href: secondaryHref, label: secondaryLabel },
      ];
  if (props.layout === "text_only") {
    return (
      <section className="public-page-hero public-page-hero--text-only">
        <div className="website-frame public-page-hero__content">
          {props.eyebrow ? (
            <p className="public-page-hero__eyebrow">{text(props.eyebrow)}</p>
          ) : null}
          <h1>{text(props.headline, "Reliable contractor services")}</h1>
          {props.subheadline ? <p>{text(props.subheadline, "")}</p> : null}
        </div>
      </section>
    );
  }
  if (props.layout === "center_overlay") {
    return (
      <section className="public-page-hero">
        {heroImage ? (
          <img
            alt=""
            className="public-page-hero__image public-image-reveal"
            decoding="async"
            fetchPriority="high"
            src={heroImage}
          />
        ) : null}
        <div className="public-page-hero__overlay" />
        <div className="website-frame public-page-hero__content">
          {props.eyebrow ? (
            <p className="public-page-hero__eyebrow">{text(props.eyebrow)}</p>
          ) : null}
          <h1>{text(props.headline, "Reliable contractor services")}</h1>
          {props.subheadline ? (
            <p>
              {text(
                props.subheadline,
                "Clear quotes, practical scheduling, and work done properly.",
              )}
            </p>
          ) : null}
          {actions.length ? (
            <div className="public-page-hero__actions">
              {actions.map((action) => {
                const href = text(action.href, "");
                const label = text(action.label, "");
                return href && label ? (
                  <a href={href} key={`${href}-${label}`}>
                    {label}
                  </a>
                ) : null;
              })}
            </div>
          ) : null}
          {props.proof_line ? (
            <p className="public-page-hero__proof">
              {text(props.proof_line, "")}
            </p>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section
      className={`${sectionPadding(theme)} bg-(--public-primary) text-(--public-background)`}
    >
      <div className="website-frame grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-background) opacity-70">
            {text(props.business_name, "Local contractor")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {text(props.headline, "Reliable contractor services")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-(--public-background) opacity-80">
            {text(
              props.subheadline,
              "Clear quotes, practical scheduling, and work done properly.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="website-button" href={primaryHref}>
              {primaryLabel}
            </a>
            {secondaryHref ? (
              <a
                className="website-button website-button-secondary border-(--public-background) text-(--public-background)"
                href={secondaryHref}
              >
                {secondaryLabel}
              </a>
            ) : null}
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--public-background) opacity-80">
            {trustBadges.slice(0, 3).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
            {serviceArea.length ? (
              <span>Serving {serviceArea.join(", ")}</span>
            ) : null}
          </div>
        </div>
        <div className="min-h-72 overflow-hidden rounded-(--public-radius) border border-(--public-border) bg-(--public-surface)">
          {heroImage ? (
            <img
              alt={text(props.alt_text, "Contractor work preview")}
              className="h-full min-h-72 w-full object-cover"
              src={heroImage}
            />
          ) : (
            <div className="grid min-h-72 place-items-center bg-(--public-surface) p-8 text-center text-lg font-semibold text-(--public-text)">
              {text(props.trade, "Business")} services
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
