import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, asRecords, imageUrl, text } from "../../../utils";

export default function TypeFirstTrustHero({
  props,
}: PublicSiteComponentProps) {
  const media = asRecord(props.media);
  const proofItems = asRecords(props.proof_items ?? props.proofItems);
  const primaryCta = asRecord(props.primary_cta ?? props.primaryCta);
  const secondaryCta = asRecord(props.secondary_cta ?? props.secondaryCta);
  const heroImage = imageUrl(
    props.generated_image_url ??
      props.image_url ??
      media.generated_image_url ??
      media.image_url ??
      media.url,
  );

  return (
    <section className="public-trust-hero" id={text(props.anchor_id, "hero")}>
      <div className="public-trust-hero__bg">
        {heroImage ? (
          <img alt="" className="public-trust-hero__image" src={heroImage} />
        ) : null}
        <div className="public-trust-hero__overlay" />
      </div>
      <div className="public-trust-hero__body">
        {props.eyebrow ? (
          <p className="public-section-label public-trust-hero__eyebrow">
            {String(props.eyebrow)}
          </p>
        ) : null}
        <h1>
          {text(props.headline, "You Dream,")}
          {props.emphasized_headline || props.emphasizedHeadline ? (
            <>
              <br />
              <em>
                {text(
                  props.emphasized_headline ?? props.emphasizedHeadline,
                  "We Build.",
                )}
              </em>
            </>
          ) : null}
        </h1>
        {props.subheadline ? (
          <p className="public-trust-hero__sub">{String(props.subheadline)}</p>
        ) : null}
        <div className="public-trust-hero__actions">
          {primaryCta.href || props.href ? (
            <a
              className="public-section-button public-section-button--light"
              href={text(primaryCta.href ?? props.href, "#contact")}
            >
              {text(primaryCta.label ?? props.cta_label, "Plan My Project")}
            </a>
          ) : null}
          {secondaryCta.href ? (
            <a
              className="public-section-button public-section-button--ghost"
              href={String(secondaryCta.href)}
            >
              {text(secondaryCta.label, "Call Now")}
            </a>
          ) : null}
        </div>
      </div>
      {proofItems.length ? (
        <div className="public-trust-hero__stats">
          {proofItems.slice(0, 4).map((item) => (
            <div className="public-trust-stat" key={text(item.label, "Proof")}>
              <strong>{text(item.value, "Trusted")}</strong>
              <span>{text(item.label, "Proof point")}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
