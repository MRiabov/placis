import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, imageUrl, text } from "../../../utils";

export default function OverlayTitleHero({ props }: PublicSiteComponentProps) {
  const media = asRecord(props.media);
  const src = imageUrl(
    props.generated_image_url ??
      props.image_url ??
      media.generated_image_url ??
      media.image_url ??
      media.url,
  );
  const alt = text(media.alt_text ?? media.alt ?? props.alt_text, "");
  const scrollLabel = text(props.scroll_label, "Scroll");
  return (
    <section
      className="public-overlay-title-hero"
      id={text(props.anchor_id) || undefined}
    >
      {src ? (
        <img
          alt={alt}
          className="public-overlay-title-hero__image public-image-reveal"
          decoding="async"
          fetchPriority="high"
          src={src}
        />
      ) : (
        <div className="public-overlay-title-hero__placeholder" />
      )}
      <div className="public-overlay-title-hero__shade" />
      <div className="public-overlay-title-hero__content">
        <h1>{text(props.headline, "Project headline")}</h1>
      </div>
      {props.show_scroll_indicator === false ? null : (
        <div className="public-overlay-title-hero__scroll" aria-hidden="true">
          <span>{scrollLabel}</span>
          <i />
        </div>
      )}
    </section>
  );
}
